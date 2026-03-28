from datetime import datetime, timezone
from flask import jsonify
from flask_jwt_extended import jwt_required
from sqlalchemy import func
from . import api_bp
from ..extensions import db
from ..models.booking import Booking
from ..models.payment import Payment
from ..models.user import User
from ..utils.decorators import role_required


@api_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def get_stats():
    total_bookings = Booking.query.count()
    pending_bookings = Booking.query.filter_by(status='pending').count()
    active_bookings = Booking.query.filter(
        Booking.status.in_(['confirmed', 'assigned', 'in_progress'])
    ).count()
    completed_bookings = Booking.query.filter_by(status='completed').count()

    total_revenue = db.session.query(func.sum(Payment.amount)).filter_by(status='completed').scalar() or 0

    total_customers = User.query.filter_by(role='customer').count()
    total_technicians = User.query.filter_by(role='technician', is_active=True).count()

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_bookings = Booking.query.filter(Booking.created_at >= month_start).count()
    monthly_revenue = db.session.query(func.sum(Payment.amount)).filter(
        Payment.status == 'completed',
        Payment.paid_at >= month_start
    ).scalar() or 0

    return jsonify({
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'active_bookings': active_bookings,
        'completed_bookings': completed_bookings,
        'total_revenue': round(total_revenue, 2),
        'total_customers': total_customers,
        'total_technicians': total_technicians,
        'monthly_bookings': monthly_bookings,
        'monthly_revenue': round(monthly_revenue, 2),
    })


@api_bp.route('/dashboard/recent-bookings', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def get_recent_bookings():
    from ..schemas.booking import BookingSchema
    bookings_schema = BookingSchema(many=True)
    bookings = Booking.query.order_by(Booking.created_at.desc()).limit(10).all()
    return jsonify(bookings_schema.dump(bookings))


@api_bp.route('/dashboard/bookings-by-status', methods=['GET'])
@jwt_required()
@role_required(['admin', 'assistant'])
def bookings_by_status():
    results = db.session.query(
        Booking.status, func.count(Booking.id)
    ).group_by(Booking.status).all()

    return jsonify({status: count for status, count in results})
