from flask import jsonify, request
from flask_jwt_extended import jwt_required
from . import api_bp
from ..extensions import db
from ..models.service import Service, ServiceRecord
from ..schemas.service import ServiceSchema, ServiceCreateSchema, ServiceRecordSchema
from ..utils.decorators import role_required

service_schema = ServiceSchema()
services_schema = ServiceSchema(many=True)
service_create_schema = ServiceCreateSchema()
service_record_schema = ServiceRecordSchema()


@api_bp.route('/services', methods=['GET'])
def get_services():
    services = Service.query.filter_by(is_active=True).all()
    return jsonify(services_schema.dump(services))


@api_bp.route('/services/all', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_all_services():
    services = Service.query.all()
    return jsonify(services_schema.dump(services))


@api_bp.route('/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    service = Service.query.get_or_404(service_id)
    return jsonify(service_schema.dump(service))


@api_bp.route('/services', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def create_service():
    data = request.get_json()
    errors = service_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    service = Service(**data)
    db.session.add(service)
    db.session.commit()
    return jsonify(service_schema.dump(service)), 201


@api_bp.route('/services/<int:service_id>', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_service(service_id):
    service = Service.query.get_or_404(service_id)
    data = request.get_json()

    for key, value in data.items():
        if hasattr(service, key) and key != 'id':
            setattr(service, key, value)

    db.session.commit()
    return jsonify(service_schema.dump(service))


@api_bp.route('/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
@role_required(['admin'])
def delete_service(service_id):
    service = Service.query.get_or_404(service_id)
    service.is_active = False
    db.session.commit()
    return jsonify({'message': 'Service deactivated'})


@api_bp.route('/service-records/booking/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_service_record(booking_id):
    record = ServiceRecord.query.filter_by(booking_id=booking_id).first_or_404()
    return jsonify(service_record_schema.dump(record))
