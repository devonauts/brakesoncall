from marshmallow import fields, validate
from ..extensions import ma
from ..models.service_step import ServiceStep


class ServiceStepSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = ServiceStep
        load_instance = True
        include_fk = True


class ServiceStepUpdateSchema(ma.Schema):
    status = fields.String(validate=validate.OneOf(ServiceStep.VALID_STATUSES))
    notes = fields.String()
    photo_url = fields.String()
