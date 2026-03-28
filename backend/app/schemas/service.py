from marshmallow import fields, validate
from ..extensions import ma
from ..models.service import Service, ServiceRecord


class ServiceSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = Service
        load_instance = True


class ServiceCreateSchema(ma.Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    description = fields.String()
    base_price = fields.Float(required=True, validate=validate.Range(min=0))
    estimated_duration_minutes = fields.Integer(required=True, validate=validate.Range(min=15))
    is_active = fields.Boolean(load_default=True)
    icon = fields.String()


class ServiceRecordSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ServiceRecord
        load_instance = True
        include_fk = True

    steps = fields.Nested('ServiceStepSchema', many=True, dump_only=True)
    technician_user = fields.Nested('UserSchema', only=('id', 'first_name', 'last_name'), dump_only=True)
