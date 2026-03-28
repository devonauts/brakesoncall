from datetime import datetime, timezone
from ..extensions import db


class Service(db.Model):
    __tablename__ = 'services'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    base_price = db.Column(db.Float, nullable=False)
    estimated_duration_minutes = db.Column(db.Integer, nullable=False, default=60)
    is_active = db.Column(db.Boolean, default=True)
    icon = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    bookings = db.relationship('Booking', backref='service', lazy='dynamic')

    def __repr__(self):
        return f'<Service {self.name}>'


class ServiceRecord(db.Model):
    __tablename__ = 'service_records'

    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, unique=True)
    technician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    customer_signature_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    steps = db.relationship('ServiceStep', backref='service_record', lazy='dynamic',
                            order_by='ServiceStep.step_number')
    technician_user = db.relationship('User', foreign_keys=[technician_id])

    def __repr__(self):
        return f'<ServiceRecord booking={self.booking_id}>'
