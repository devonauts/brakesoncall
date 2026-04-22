from datetime import datetime, timezone
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from . import api_bp
from ..extensions import db
from ..models.user import User
from ..models.booking import Booking
from ..models.service import Service, ServiceRecord
from ..models.service_step import ServiceStep
from ..schemas.booking import BookingSchema, BookingCreateSchema, BookingUpdateSchema, BookingAssignSchema
from ..utils.decorators import role_required
from ..utils.helpers import paginate

booking_schema = BookingSchema()
bookings_schema = BookingSchema(many=True)
booking_create_schema = BookingCreateSchema()
booking_update_schema = BookingUpdateSchema()
booking_assign_schema = BookingAssignSchema()


@api_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_bookings():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    query = Booking.query

    if user.role == 'customer':
        query = query.filter_by(customer_id=user.id)
    elif user.role == 'technician':
        query = query.filter_by(technician_id=user.id)

    status = request.args.get('status')
    if status:
        query = query.filter_by(status=status)

    query = query.order_by(Booking.scheduled_date.desc(), Booking.created_at.desc())
    return jsonify(paginate(query, bookings_schema))


@api_bp.route('/bookings/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    booking = Booking.query.get_or_404(booking_id)

    if user.role == 'customer' and booking.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403
    if user.role == 'technician' and booking.technician_id != user.id:
        return jsonify({'error': 'Access denied'}), 403

    return jsonify(booking_schema.dump(booking))


@api_bp.route('/bookings', methods=['POST'])
@jwt_required()
def create_booking():
    user_id = int(get_jwt_identity())
    raw = request.get_json()

    try:
        data = booking_create_schema.load(raw)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 422

    service = Service.query.get_or_404(data['service_id'])

    booking = Booking(
        customer_id=user_id,
        vehicle_id=data['vehicle_id'],
        service_id=data['service_id'],
        scheduled_date=data['scheduled_date'],
        scheduled_time_slot=data['scheduled_time_slot'],
        address=data['address'],
        city=data['city'],
        state=data['state'],
        zip_code=data['zip_code'],
        notes=data.get('notes'),
        total_price=service.base_price,
    )

    db.session.add(booking)
    db.session.commit()

    # Send confirmation email
    try:
        from ..utils.email import send_booking_confirmation
        send_booking_confirmation(booking)
    except Exception:
        pass  # Don't fail the booking if email fails

    return jsonify(booking_schema.dump(booking)), 201


@api_bp.route('/bookings/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    booking = Booking.query.get_or_404(booking_id)

    if user.role == 'customer' and booking.customer_id != user.id:
        return jsonify({'error': 'Access denied'}), 403

    raw = request.get_json()
    try:
        data = booking_update_schema.load(raw)
    except ValidationError as err:
        return jsonify({'errors': err.messages}), 422

    for key, value in data.items():
        if hasattr(booking, key) and key not in ('id', 'customer_id'):
            setattr(booking, key, value)

    db.session.commit()
    return jsonify(booking_schema.dump(booking))


@api_bp.route('/bookings/<int:booking_id>/assign', methods=['PUT'])
@jwt_required()
@role_required(['admin', 'assistant'])
def assign_technician(booking_id):
    booking = Booking.query.get_or_404(booking_id)
    data = request.get_json()

    errors = booking_assign_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    technician = User.query.get_or_404(data['technician_id'])
    if technician.role != 'technician':
        return jsonify({'error': 'User is not a technician'}), 422

    booking.technician_id = technician.id
    booking.status = 'assigned'
    db.session.commit()

    return jsonify(booking_schema.dump(booking))


@api_bp.route('/bookings/<int:booking_id>/status', methods=['PUT'])
@jwt_required()
def update_booking_status(booking_id):
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)
    booking = Booking.query.get_or_404(booking_id)

    data = request.get_json()
    new_status = data.get('status')

    if new_status not in Booking.VALID_STATUSES:
        return jsonify({'error': 'Invalid status'}), 422

    if new_status == 'in_progress' and user.role == 'technician':
        if not booking.service_record:
            record = ServiceRecord(
                booking_id=booking.id,
                technician_id=user.id,
                started_at=datetime.now(timezone.utc),
            )
            db.session.add(record)
            db.session.flush()

            steps = ServiceStep.create_default_steps(record.id)
            for step in steps:
                db.session.add(step)

    if new_status == 'completed' and booking.service_record:
        booking.service_record.completed_at = datetime.now(timezone.utc)

    booking.status = new_status
    db.session.commit()

    # Send status update email
    try:
        from ..utils.email import send_booking_status_update
        send_booking_status_update(booking, new_status)
    except Exception:
        pass

    return jsonify(booking_schema.dump(booking))
