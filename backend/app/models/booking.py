from datetime import datetime, timezone
from ..extensions import db


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    service_id = db.Column(db.Integer, db.ForeignKey('services.id'), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    status = db.Column(db.String(20), nullable=False, default='pending')

    scheduled_date = db.Column(db.Date, nullable=False)
    scheduled_time_slot = db.Column(db.String(20), nullable=False)

    address = db.Column(db.String(200), nullable=False)
    city = db.Column(db.String(100), nullable=False)
    state = db.Column(db.String(50), nullable=False)
    zip_code = db.Column(db.String(10), nullable=False)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)

    notes = db.Column(db.Text)
    total_price = db.Column(db.Float)

    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    service_record = db.relationship('ServiceRecord', backref='booking', uselist=False)
    payment = db.relationship('Payment', backref='booking', uselist=False)

    VALID_STATUSES = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']

    TIME_SLOTS = [
        '08:00-10:00', '09:00-11:00', '10:00-12:00',
        '11:00-13:00', '12:00-14:00', '13:00-15:00',
        '14:00-16:00', '15:00-17:00', '16:00-18:00',
    ]

    def __repr__(self):
        return f'<Booking {self.id} - {self.status}>'
