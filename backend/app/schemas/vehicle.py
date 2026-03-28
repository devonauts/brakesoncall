from marshmallow import fields, validate
from ..extensions import ma
from ..models.vehicle import Vehicle


class VehicleSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Vehicle
        load_instance = True
        include_fk = True

    display_name = fields.String(dump_only=True)
    owner = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name', 'email'), dump_only=True)


class VehicleCreateSchema(ma.Schema):
    year = fields.Integer(required=True, validate=validate.Range(min=1900, max=2030))
    make = fields.String(required=True, validate=validate.Length(min=1, max=50))
    model = fields.String(required=True, validate=validate.Length(min=1, max=50))
    trim = fields.String(validate=validate.Length(max=50))
    color = fields.String(validate=validate.Length(max=30))
    license_plate = fields.String(validate=validate.Length(max=20))
    vin = fields.String(validate=validate.Length(max=17))
    notes = fields.String()


class VehicleUpdateSchema(ma.Schema):
    year = fields.Integer(validate=validate.Range(min=1900, max=2030))
    make = fields.String(validate=validate.Length(min=1, max=50))
    model = fields.String(validate=validate.Length(min=1, max=50))
    trim = fields.String(validate=validate.Length(max=50))
    color = fields.String(validate=validate.Length(max=30))
    license_plate = fields.String(validate=validate.Length(max=20))
    vin = fields.String(validate=validate.Length(max=17))
    notes = fields.String()
