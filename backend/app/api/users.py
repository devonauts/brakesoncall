from flask import jsonify, request
from flask_jwt_extended import jwt_required
from . import api_bp
from ..extensions import db
from ..models.user import User
from ..schemas.user import UserSchema, UserCreateSchema
from ..utils.decorators import role_required
from ..utils.helpers import paginate

user_schema = UserSchema()
users_schema = UserSchema(many=True)
user_create_schema = UserCreateSchema()


@api_bp.route('/users', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def get_users():
    role_filter = request.args.get('role')
    search = request.args.get('search')

    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter)
    if search:
        query = query.filter(
            db.or_(
                User.first_name.ilike(f'%{search}%'),
                User.last_name.ilike(f'%{search}%'),
                User.email.ilike(f'%{search}%')
            )
        )
    query = query.order_by(User.created_at.desc())
    return jsonify(paginate(query, users_schema))


@api_bp.route('/users', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_user():
    data = request.get_json()
    errors = user_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    user = User(
        email=data['email'].lower().strip(),
        first_name=data['first_name'].strip(),
        last_name=data['last_name'].strip(),
        phone=data.get('phone', ''),
        role=data.get('role', 'customer'),
    )
    user.set_password(data['password'])

    db.session.add(user)
    db.session.commit()
    return jsonify(user_schema.dump(user)), 201


@api_bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user_schema.dump(user))


@api_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    for key, value in data.items():
        if hasattr(user, key) and key not in ('id', 'password_hash'):
            setattr(user, key, value)

    if 'password' in data and data['password']:
        user.set_password(data['password'])

    db.session.commit()
    return jsonify(user_schema.dump(user))


@api_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = False
    db.session.commit()
    return jsonify(user_schema.dump(user))


@api_bp.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def toggle_user_active(user_id):
    user = User.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify(user_schema.dump(user))


@api_bp.route('/technicians', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def get_technicians():
    technicians = User.query.filter_by(role='technician', is_active=True).all()
    return jsonify(users_schema.dump(technicians))
