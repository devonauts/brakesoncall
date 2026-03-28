from .extensions import db
from .models import Service


def run_seeds():
    """Seed the database with service catalog only. First registered user becomes admin."""
    db.drop_all()
    db.create_all()

    services = [
        Service(name='Front Brake Pad Replacement',
                description='Complete front brake pad replacement including inspection of rotors and brake fluid check.',
                base_price=149.99, estimated_duration_minutes=60, icon='disc'),
        Service(name='Rear Brake Pad Replacement',
                description='Complete rear brake pad replacement including inspection of rotors and brake fluid check.',
                base_price=149.99, estimated_duration_minutes=60, icon='disc'),
        Service(name='Full Brake Pad Replacement',
                description='Front and rear brake pad replacement with full brake system inspection.',
                base_price=279.99, estimated_duration_minutes=120, icon='shield-check'),
        Service(name='Brake Inspection',
                description='Comprehensive brake system inspection including pads, rotors, fluid, and lines.',
                base_price=49.99, estimated_duration_minutes=30, icon='search'),
        Service(name='Brake Fluid Flush',
                description='Complete brake fluid flush and replacement with DOT-4 brake fluid.',
                base_price=89.99, estimated_duration_minutes=45, icon='droplets'),
    ]

    db.session.add_all(services)
    db.session.commit()
    print(f'Created: {len(services)} services. First user to register will become admin.')
