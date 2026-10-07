"""Tests for the public contact endpoint and HQ webhook notifications.

Run from backend/:  python -m pytest tests -q
"""
from datetime import date, timedelta
from unittest import mock

import pytest

from app import create_app
from app.extensions import db
from app.models import ContactMessage, Service, User, Vehicle
from app.utils import notify


@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def sent(monkeypatch):
    """Capture webhook payloads synchronously instead of hitting the network."""
    calls = []

    def fake_send(url, payload, log):
        calls.append((url, payload))

    monkeypatch.setattr(notify, '_send', fake_send)
    return calls


def _enable(app):
    app.config['NOTIFY_WEBHOOK_URL'] = 'http://hooks.example.test/api/hooks/brakesoncall/x'


def _wait_threads():
    import threading
    for t in threading.enumerate():
        if t is not threading.current_thread() and t.daemon:
            t.join(2)


def test_post_webhook_noop_without_url(app, sent):
    assert notify.post_webhook('contact', 'hi') is None
    assert sent == []


def test_post_webhook_swallows_network_errors(app):
    _enable(app)
    with mock.patch('app.utils.notify.requests.post', side_effect=RuntimeError('boom')):
        t = notify.post_webhook('alert', 'x', wait=True)
    assert t is not None  # no exception raised


def test_contact_saves_and_notifies(app, client, sent):
    _enable(app)
    resp = client.post('/api/v1/contact', json={
        'name': 'Test Person', 'email': 'person@example.test',
        'phone': '555-0100', 'message': 'Need brakes checked',
    })
    assert resp.status_code == 201
    _wait_threads()
    assert ContactMessage.query.count() == 1
    assert len(sent) == 1
    payload = sent[0][1]
    assert payload['kind'] == 'contact'
    assert payload['email'] == 'person@example.test'
    assert payload['id'] == resp.get_json()['id']


def test_contact_validation(app, client, sent):
    resp = client.post('/api/v1/contact', json={'name': '', 'email': 'bad', 'message': ''})
    assert resp.status_code == 422
    assert set(resp.get_json()['errors']) == {'name', 'email', 'message'}
    assert ContactMessage.query.count() == 0


def test_contact_honeypot_drops_silently(app, client, sent):
    _enable(app)
    resp = client.post('/api/v1/contact', json={
        'name': 'Bot', 'email': 'bot@example.test', 'message': 'spam', 'website': 'http://spam',
    })
    assert resp.status_code == 201
    assert ContactMessage.query.count() == 0
    assert sent == []


def test_signup_booking_and_order_notify(app, client, sent):
    _enable(app)
    resp = client.post('/api/v1/auth/register', json={
        'email': 'driver@example.test', 'password': 'Sup3rSecret!pw',
        'first_name': 'Dee', 'last_name': 'Driver', 'phone': '555-0101',
    })
    assert resp.status_code == 201, resp.get_json()
    token = resp.get_json()['access_token']
    user = User.query.filter_by(email='driver@example.test').one()

    service = Service(name='Front pads', base_price=149.0)
    db.session.add(service)
    vehicle = Vehicle(customer_id=user.id, make='Ford', model='F-150', year=2020)
    db.session.add(vehicle)
    db.session.commit()

    headers = {'Authorization': f'Bearer {token}'}
    with mock.patch('app.utils.email.send_booking_confirmation', return_value=False):
        resp = client.post('/api/v1/bookings', headers=headers, json={
            'vehicle_id': vehicle.id, 'service_id': service.id,
            'scheduled_date': (date.today() + timedelta(days=3)).isoformat(),
            'scheduled_time_slot': '08:00-10:00',
            'address': '1 Test St', 'city': 'Austin', 'state': 'TX', 'zip_code': '78701',
        })
    assert resp.status_code == 201, resp.get_json()
    booking_id = resp.get_json()['id']

    resp = client.post('/api/v1/payments/confirm-intent', headers=headers, json={
        'booking_id': booking_id, 'payment_intent_id': 'pi_test_123',
    })
    assert resp.status_code == 201, resp.get_json()

    _wait_threads()
    kinds = [p['kind'] for _, p in sent]
    assert kinds == ['signup', 'booking', 'order']
    assert sent[1][1]['url'].endswith(f'/backoffice/bookings/{booking_id}')
