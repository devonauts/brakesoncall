from datetime import datetime, timezone
from ..extensions import db


class ServiceStep(db.Model):
    __tablename__ = 'service_steps'

    id = db.Column(db.Integer, primary_key=True)
    service_record_id = db.Column(db.Integer, db.ForeignKey('service_records.id'), nullable=False)
    step_number = db.Column(db.Integer, nullable=False)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    photo_url = db.Column(db.String(500))
    status = db.Column(db.String(20), default='pending')
    notes = db.Column(db.Text)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    VALID_STATUSES = ['pending', 'in_progress', 'completed']

    DEFAULT_STEPS = [
        {'step_number': 1, 'title': 'Vehicle Inspection',
         'description': 'Perform initial vehicle inspection. Check brake fluid level, tire condition, and overall vehicle safety.'},
        {'step_number': 2, 'title': 'Remove Wheel',
         'description': 'Safely lift vehicle and remove the wheel to access brake assembly.'},
        {'step_number': 3, 'title': 'Inspect Rotor',
         'description': 'Inspect brake rotor for wear, warping, or damage. Measure rotor thickness.'},
        {'step_number': 4, 'title': 'Remove Old Brake Pads',
         'description': 'Remove worn brake pads and inspect caliper pins and hardware.'},
        {'step_number': 5, 'title': 'Install New Brake Pads',
         'description': 'Install new brake pads with proper hardware and anti-squeal compound.'},
        {'step_number': 6, 'title': 'Reassemble',
         'description': 'Reinstall caliper, mount wheel, and torque lug nuts to spec.'},
        {'step_number': 7, 'title': 'Test Brakes',
         'description': 'Pump brake pedal to seat pads. Test brake feel and responsiveness.'},
        {'step_number': 8, 'title': 'Final Inspection',
         'description': 'Complete final safety inspection. Verify no leaks, proper brake function, and clean work area.'},
    ]

    @classmethod
    def create_default_steps(cls, service_record_id):
        steps = []
        for step_data in cls.DEFAULT_STEPS:
            step = cls(service_record_id=service_record_id, **step_data)
            steps.append(step)
        return steps

    def __repr__(self):
        return f'<ServiceStep {self.step_number}: {self.title}>'
