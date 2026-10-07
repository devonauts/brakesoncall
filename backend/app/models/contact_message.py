from datetime import datetime, timezone
from ..extensions import db


class ContactMessage(db.Model):
    """Message submitted through the public contact form."""
    __tablename__ = 'contact_messages'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False)
    phone = db.Column(db.String(30))
    message = db.Column(db.Text, nullable=False)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    status = db.Column(db.String(20), nullable=False, default='new')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f'<ContactMessage {self.id} {self.email}>'
