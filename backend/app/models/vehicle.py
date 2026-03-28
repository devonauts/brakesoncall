from datetime import datetime, timezone
from ..extensions import db


class Vehicle(db.Model):
    __tablename__ = 'vehicles'

    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    year = db.Column(db.Integer, nullable=False)
    make = db.Column(db.String(50), nullable=False)
    model = db.Column(db.String(50), nullable=False)
    trim = db.Column(db.String(50))
    color = db.Column(db.String(30))
    license_plate = db.Column(db.String(20))
    vin = db.Column(db.String(17))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    bookings = db.relationship('Booking', backref='vehicle', lazy='dynamic')

    @property
    def display_name(self):
        return f"{self.year} {self.make} {self.model}"

    def __repr__(self):
        return f'<Vehicle {self.display_name}>'
