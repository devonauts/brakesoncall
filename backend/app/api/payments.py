import os
from datetime import datetime, timezone
from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import api_bp
from ..extensions import db
from ..models.user import User
from ..models.payment import Payment
from ..models.booking import Booking
from ..schemas.payment import PaymentSchema, PaymentCreateSchema
from ..utils.decorators import role_required
from ..utils.helpers import paginate

payment_schema = PaymentSchema()
payments_schema = PaymentSchema(many=True)
payment_create_schema = PaymentCreateSchema()


def get_stripe():
    """Lazy import and configure stripe."""
    try:
        import stripe
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
        return stripe
    except ImportError:
        return None


@api_bp.route('/payments', methods=['GET'])
@jwt_required()
def get_payments():
    user_id = int(get_jwt_identity())
    user = User.query.get_or_404(user_id)

    query = Payment.query
    if user.role == 'customer':
        booking_ids = [b.id for b in Booking.query.filter_by(customer_id=user.id).all()]
        query = query.filter(Payment.booking_id.in_(booking_ids)) if booking_ids else query.filter(Payment.id < 0)

    query = query.order_by(Payment.created_at.desc())
    return jsonify(paginate(query, payments_schema))


@api_bp.route('/payments/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)
    return jsonify(payment_schema.dump(payment))


@api_bp.route('/payments', methods=['POST'])
@jwt_required()
def create_payment():
    data = request.get_json()
    errors = payment_create_schema.validate(data)
    if errors:
        return jsonify({'errors': errors}), 422

    booking = Booking.query.get_or_404(data['booking_id'])

    if booking.payment:
        return jsonify({'error': 'Payment already exists for this booking'}), 422

    payment = Payment(
        booking_id=data['booking_id'],
        amount=data['amount'],
        payment_method=data['payment_method'],
        transaction_id=data.get('transaction_id'),
        status='completed',
        paid_at=datetime.now(timezone.utc),
    )

    db.session.add(payment)
    db.session.commit()

    return jsonify(payment_schema.dump(payment)), 201


@api_bp.route('/payments/<int:payment_id>/refund', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def refund_payment(payment_id):
    payment = Payment.query.get_or_404(payment_id)

    stripe = get_stripe()
    if stripe and stripe.api_key and payment.transaction_id and payment.transaction_id.startswith('pi_'):
        try:
            stripe.Refund.create(payment_intent=payment.transaction_id)
        except Exception as e:
            return jsonify({'error': f'Stripe refund failed: {str(e)}'}), 400

    payment.status = 'refunded'
    db.session.commit()
    return jsonify(payment_schema.dump(payment))


@api_bp.route('/payments/create-intent', methods=['POST'])
@jwt_required()
def create_payment_intent():
    """Create a Stripe PaymentIntent for a booking."""
    stripe = get_stripe()
    if not stripe or not stripe.api_key:
        return jsonify({'error': 'Stripe is not configured'}), 400

    data = request.get_json()
    booking_id = data.get('booking_id')
    booking = Booking.query.get_or_404(booking_id)

    if booking.payment:
        return jsonify({'error': 'Payment already exists for this booking'}), 422

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(booking.total_price * 100),  # cents
            currency='usd',
            metadata={
                'booking_id': str(booking.id),
                'customer_email': booking.customer.email,
                'service': booking.service.name,
            },
        )
        return jsonify({
            'client_secret': intent.client_secret,
            'payment_intent_id': intent.id,
            'amount': booking.total_price,
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


@api_bp.route('/payments/confirm-intent', methods=['POST'])
@jwt_required()
def confirm_payment_intent():
    """Record a completed Stripe payment."""
    data = request.get_json()
    booking_id = data.get('booking_id')
    payment_intent_id = data.get('payment_intent_id')

    booking = Booking.query.get_or_404(booking_id)

    if booking.payment:
        return jsonify({'error': 'Payment already exists'}), 422

    payment = Payment(
        booking_id=booking_id,
        amount=booking.total_price,
        payment_method='card',
        transaction_id=payment_intent_id,
        status='completed',
        paid_at=datetime.now(timezone.utc),
    )
    db.session.add(payment)
    db.session.commit()

    return jsonify(payment_schema.dump(payment)), 201


@api_bp.route('/payments/stripe-config', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_stripe_config():
    """Get Stripe configuration status for admin."""
    stripe_key = os.environ.get('STRIPE_SECRET_KEY', '')
    publishable_key = os.environ.get('STRIPE_PUBLISHABLE_KEY', '')
    return jsonify({
        'is_configured': bool(stripe_key),
        'publishable_key': publishable_key,
        'has_secret_key': bool(stripe_key),
    })


@api_bp.route('/payments/stripe-config', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_stripe_config():
    """Update Stripe keys (stored in environment/runtime)."""
    data = request.get_json()

    if 'secret_key' in data:
        os.environ['STRIPE_SECRET_KEY'] = data['secret_key']
    if 'publishable_key' in data:
        os.environ['STRIPE_PUBLISHABLE_KEY'] = data['publishable_key']

    return jsonify({
        'is_configured': bool(os.environ.get('STRIPE_SECRET_KEY')),
        'message': 'Stripe configuration updated',
    })
