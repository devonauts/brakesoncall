from marshmallow import fields, validate, validates, ValidationError
from ..extensions import ma
from ..models.user import User


class UserSchema(ma.SQLAlchemyAutoSchema):
    class Meta:
        model = User
        exclude = ('password_hash',)
        load_instance = True

    full_name = fields.String(dump_only=True)


class UserCreateSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True, validate=validate.Length(min=8, max=128))
    first_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    last_name = fields.String(required=True, validate=validate.Length(min=1, max=50))
    phone = fields.String(validate=validate.Length(max=20))
    role = fields.String(validate=validate.OneOf(User.VALID_ROLES), load_default='customer')

    @validates('email')
    def validate_email_unique(self, value):
        if User.query.filter_by(email=value.lower()).first():
            raise ValidationError('Email already registered.')


class UserUpdateSchema(ma.Schema):
    first_name = fields.String(validate=validate.Length(min=1, max=50))
    last_name = fields.String(validate=validate.Length(min=1, max=50))
    phone = fields.String(validate=validate.Length(max=20))
    avatar_url = fields.String()


class UserLoginSchema(ma.Schema):
    email = fields.Email(required=True)
    password = fields.String(required=True)
