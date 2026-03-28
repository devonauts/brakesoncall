from datetime import datetime, timezone
from flask import jsonify, request, current_app
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from . import api_bp
from ..extensions import db, limiter
from ..models.user import User
from ..schemas.user import UserSchema, UserCreateSchema, UserLoginSchema, UserUpdateSchema
from ..utils.turnstile import verify_turnstile
from ..utils.email import send_email

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()
user_update_schema = UserUpdateSchema()

# Track failed login attempts (in-memory; use Redis in production)
_failed_attempts: dict[str, list[float]] = {}
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 900  # 15 minutes


def _check_lockout(email: str) -> bool:
    """Return True if the account is locked out."""
    attempts = _failed_attempts.get(email, [])
    now = datetime.now(timezone.utc).timestamp()
    # Clean old attempts
    recent = [t for t in attempts if now - t < LOCKOUT_SECONDS]
    _failed_attempts[email] = recent
    return len(recent) >= MAX_FAILED_ATTEMPTS


def _record_failed_attempt(email: str):
    now = datetime.now(timezone.utc).timestamp()
    _failed_attempts.setdefault(email, []).append(now)


def _clear_failed_attempts(email: str):
    _failed_attempts.pop(email, None)


@api_bp.route('/auth/register', methods=['POST'])
@limiter.limit('10/hour')
def register():
    data = request.get_json()

    # Verify Turnstile CAPTCHA
    turnstile_token = data.pop('turnstile_token', None)
    if not verify_turnstile(turnstile_token):
        return jsonify({'error': 'CAPTCHA verification failed. Please try again.'}), 422

    errors = user_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    # First user becomes admin, all others are customers
    is_first_user = User.query.count() == 0
    role = 'admin' if is_first_user else 'customer'

    user = User(
        email=data['email'].lower().strip(),
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        phone=data.get('phone', ''),
        role=role,
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token,
    }), 201


@api_bp.route('/auth/login', methods=['POST'])
@limiter.limit('20/hour')
def login():
    data = request.get_json()
    errors = user_login_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    email = data['email'].lower().strip()

    # Check account lockout
    if _check_lockout(email):
        return jsonify({'error': 'Account temporarily locked. Please try again in 15 minutes.'}), 429

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(data['password']):
        _record_failed_attempt(email)
        remaining = MAX_FAILED_ATTEMPTS - len(_failed_attempts.get(email, []))
        if remaining <= 2 and remaining > 0:
            return jsonify({'error': f'Invalid email or password. {remaining} attempts remaining.'}), 401
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    _clear_failed_attempts(email)

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token,
    })


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
@limiter.limit('30/hour')
def refresh():
    user_id = int(get_jwt_identity())
    access_token = create_access_token(identity=str(user_id))
    return jsonify({'access_token': access_token})


@api_bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    return jsonify(user_schema.dump(user))


@api_bp.route('/auth/me', methods=['PUT'])
@jwt_required()
def update_me():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    data = request.get_json()
    errors = user_update_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    for key, value in data.items():
        if hasattr(user, key) and key not in ('id', 'email', 'password_hash', 'role'):
            setattr(user, key, value)

    db.session.commit()
    return jsonify(user_schema.dump(user))


@api_bp.route('/auth/forgot-password', methods=['POST'])
@limiter.limit('5/hour')
def forgot_password():
    data = request.get_json()
    email = data.get('email', '').lower().strip()

    # Always return success to prevent email enumeration
    user = User.query.filter_by(email=email).first()
    if user:
        from ..utils.email import send_password_reset_email
        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={'type': 'password_reset'},
        )
        send_password_reset_email(user, reset_token)

    return jsonify({'message': 'If an account exists with that email, a reset link has been sent.'})


@api_bp.route('/auth/reset-password', methods=['POST'])
@jwt_required()
@limiter.limit('5/hour')
def reset_password():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    data = request.get_json()
    new_password = data.get('password', '')

    if len(new_password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters'}), 422

    user.set_password(new_password)
    db.session.commit()

    return jsonify({'message': 'Password has been reset successfully.'})


@api_bp.route('/auth/turnstile-config', methods=['GET'])
def turnstile_config():
    """Public endpoint: return Turnstile site key for frontend."""
    site_key = current_app.config.get('TURNSTILE_SITE_KEY', '')
    return jsonify({
        'enabled': bool(site_key),
        'site_key': site_key,
    })
