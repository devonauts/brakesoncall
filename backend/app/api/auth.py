from flask import jsonify, request
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from . import api_bp
from ..extensions import db
from ..models.user import User
from ..schemas.user import UserSchema, UserCreateSchema, UserLoginSchema, UserUpdateSchema

user_schema = UserSchema()
user_create_schema = UserCreateSchema()
user_login_schema = UserLoginSchema()
user_update_schema = UserUpdateSchema()


@api_bp.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    errors = user_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    user = User(
        email=data['email'].lower().strip(),
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        phone=data.get('phone', ''),
        role=data.get('role', 'customer')
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@api_bp.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    errors = user_login_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    user = User.query.filter_by(email=data['email'].lower().strip()).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403

    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify({
        'user': user_schema.dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token
    })


@api_bp.route('/auth/refresh', methods=['POST'])
@jwt_required(refresh=True)
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
