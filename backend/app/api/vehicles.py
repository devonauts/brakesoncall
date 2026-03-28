from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import api_bp
from ..extensions import db
from ..models.user import User
from ..models.vehicle import Vehicle
from ..schemas.vehicle import VehicleSchema, VehicleCreateSchema, VehicleUpdateSchema

vehicle_schema = VehicleSchema()
vehicles_schema = VehicleSchema(many=True)
vehicle_create_schema = VehicleCreateSchema()
vehicle_update_schema = VehicleUpdateSchema()


@api_bp.route('/vehicles', methods=['GET'])
@jwt_required()
def get_vehicles():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    if user.role == 'customer':
        vehicles = Vehicle.query.filter_by(customer_id=user.id).all()
    else:
        customer_id = request.args.get('customer_id', type=int)
        if customer_id:
            vehicles = Vehicle.query.filter_by(customer_id=customer_id).all()
        else:
            vehicles = Vehicle.query.all()

    return jsonify(vehicles_schema.dump(vehicles))


@api_bp.route('/vehicles/<int:vehicle_id>', methods=['GET'])
@jwt_required()
def get_vehicle(vehicle_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    if user.role == 'customer' and vehicle.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify(vehicle_schema.dump(vehicle))


@api_bp.route('/vehicles', methods=['POST'])
@jwt_required()
def create_vehicle():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    errors = vehicle_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    vehicle = Vehicle(customer_id=user_id, **data)
    db.session.add(vehicle)
    db.session.commit()

    return jsonify(vehicle_schema.dump(vehicle)), 201


@api_bp.route('/vehicles/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    if user.role == 'customer' and vehicle.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403

    data = request.get_json()
    errors = vehicle_update_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    for key, value in data.items():
        if hasattr(vehicle, key) and key not in ('id', 'customer_id'):
            setattr(vehicle, key, value)

    db.session.commit()
    return jsonify(vehicle_schema.dump(vehicle))


@api_bp.route('/vehicles/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    vehicle = Vehicle.query.get_or_404(vehicle_id)

    if user.role == 'customer' and vehicle.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403

    db.session.delete(vehicle)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted'})
