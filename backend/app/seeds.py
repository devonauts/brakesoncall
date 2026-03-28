from datetime import date, datetime, timezone, timedelta
from .extensions import db
from .models import User, Vehicle, Service, Booking, Payment


def run_seeds():
    """Seed the database with sample data."""
    db.drop_all()
    db.create_all()

    # Users
    admin = User(email='admin@brakesoncall.com', first_name='Admin', last_name='User',
                 role='admin', phone='555-0100')
    admin.set_password('admin123')

    assistant = User(email='assistant@brakesoncall.com', first_name='Sarah', last_name='Johnson',
                     role='assistant', phone='555-0101')
    assistant.set_password('assistant123')

    tech1 = User(email='tech1@brakesoncall.com', first_name='Mike', last_name='Rodriguez',
                 role='technician', phone='555-0102')
    tech1.set_password('tech123')

    tech2 = User(email='tech2@brakesoncall.com', first_name='James', last_name='Wilson',
                 role='technician', phone='555-0103')
    tech2.set_password('tech123')

    cust1 = User(email='john@example.com', first_name='John', last_name='Smith',
                 role='customer', phone='555-0200')
    cust1.set_password('customer123')

    cust2 = User(email='jane@example.com', first_name='Jane', last_name='Doe',
                 role='customer', phone='555-0201')
    cust2.set_password('customer123')

    db.session.add_all([admin, assistant, tech1, tech2, cust1, cust2])
    db.session.flush()

    # Services
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
    db.session.flush()

    # Vehicles
    v1 = Vehicle(customer_id=cust1.id, year=2022, make='Toyota', model='Camry',
                 trim='SE', color='Silver', license_plate='ABC-1234')
    v2 = Vehicle(customer_id=cust1.id, year=2020, make='Honda', model='CR-V',
                 trim='EX', color='Blue', license_plate='XYZ-5678')
    v3 = Vehicle(customer_id=cust2.id, year=2023, make='Tesla', model='Model 3',
                 trim='Long Range', color='White', license_plate='EV-9012')

    db.session.add_all([v1, v2, v3])
    db.session.flush()

    # Bookings
    b1 = Booking(
        customer_id=cust1.id, vehicle_id=v1.id, service_id=services[0].id,
        technician_id=tech1.id, status='completed',
        scheduled_date=date.today() - timedelta(days=7),
        scheduled_time_slot='09:00-11:00',
        address='123 Main St', city='Austin', state='TX', zip_code='78701',
        total_price=149.99,
    )
    b2 = Booking(
        customer_id=cust1.id, vehicle_id=v2.id, service_id=services[2].id,
        technician_id=tech1.id, status='assigned',
        scheduled_date=date.today() + timedelta(days=2),
        scheduled_time_slot='10:00-12:00',
        address='123 Main St', city='Austin', state='TX', zip_code='78701',
        total_price=279.99,
    )
    b3 = Booking(
        customer_id=cust2.id, vehicle_id=v3.id, service_id=services[0].id,
        status='pending',
        scheduled_date=date.today() + timedelta(days=5),
        scheduled_time_slot='14:00-16:00',
        address='456 Oak Ave', city='Austin', state='TX', zip_code='78702',
        total_price=149.99,
    )

    db.session.add_all([b1, b2, b3])
    db.session.flush()

    # Payment for completed booking
    p1 = Payment(
        booking_id=b1.id, amount=149.99, status='completed',
        payment_method='card', transaction_id='txn_sample_001',
        paid_at=datetime.now(timezone.utc) - timedelta(days=7),
    )
    db.session.add(p1)

    db.session.commit()
    print(f'Created: 6 users, {len(services)} services, 3 vehicles, 3 bookings, 1 payment')
