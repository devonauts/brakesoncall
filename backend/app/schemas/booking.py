from marshmallow import fields, validate
from ..extensions import ma
from ..models.booking import Booking


class BookingSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Booking
        load_instance = True
        include_fk = True

    customer = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'email', 'phone'), dump_only=True)
    technician = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'email', 'phone'), dump_only=True)
    vehicle = fields.Nested('VehicleSchema', only=('id', 'year', 'make', 'model', 'color', 'license_plate', 'display_name'), dump_only=True)
    service = fields.Nested('ServiceSchema', only=('id', 'name', 'base_price', 'estimated_duration_minutes'), dump_only=True)


class BookingCreateSchema(ma.Schema):
    vehicle_id = fields.Integer(required=True)
    service_id = fields.Integer(required=True)
    scheduled_date = fields.Date(required=True)
    scheduled_time_slot = fields.String(required=True, validate=validate.OneOf(Booking.TIME_SLOTS))
    address = fields.String(required=True, validate=validate.Length(min=1, max=200))
    city = fields.String(required=True, validate=validate.Length(min=1, max=100))
    state = fields.String(required=True, validate=validate.Length(min=1, max=50))
    zip_code = fields.String(required=True, validate=validate.Length(min=5, max=10))
    notes = fields.String()


class BookingUpdateSchema(ma.Schema):
    scheduled_date = fields.Date()
    scheduled_time_slot = fields.String(validate=validate.OneOf(Booking.TIME_SLOTS))
    address = fields.String(validate=validate.Length(min=1, max=200))
    city = fields.String(validate=validate.Length(min=1, max=100))
    state = fields.String(validate=validate.Length(min=1, max=50))
    zip_code = fields.String(validate=validate.Length(min=5, max=10))
    notes = fields.String()
    status = fields.String(validate=validate.OneOf(Booking.VALID_STATUSES))


class BookingAssignSchema(ma.Schema):
    technician_id = fields.Integer(required=True)
