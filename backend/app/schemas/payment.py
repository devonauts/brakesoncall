from marshmallow import fields, validate
from ..extensions import ma
from ..models.payment import Payment


class PaymentSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Payment
        load_instance = True
        include_fk = True

    booking = fields.Nested('BookingSchema', only=('id', 'status', 'scheduled_date', 'total_price'), dump_only=True)


class PaymentCreateSchema(ma.Schema):
    booking_id = fields.Integer(required=True)
    amount = fields.Float(required=True, validate=validate.Range(min=0))
    payment_method = fields.String(required=True, validate=validate.OneOf(Payment.VALID_METHODS))
    transaction_id = fields.String()
