from flask import jsonify, request, current_app
from . import api_bp
from ..extensions import db, limiter
from ..models.contact_message import ContactMessage
from ..utils.turnstile import verify_turnstile
from ..utils.notify import post_webhook, admin_url

MAX_MESSAGE_LENGTH = 5000


@api_bp.route('/contact', methods=['POST'])
@limiter.limit('5/minute;20/hour')
def submit_contact():
    """Public contact form: store the message and notify HQ."""
    data = request.get_json(silent=True) or {}

    # Honeypot: real users never fill the hidden "website" field.
    # Pretend success so bots get no signal.
    if (data.get('website') or '').strip():
        current_app.logger.info('Contact honeypot triggered from %s', request.remote_addr)
        return jsonify({'ok': True}), 201

    if not verify_turnstile(data.get('turnstile_token')):
        return jsonify({'error': 'CAPTCHA verification failed. Please try again.'}), 422

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    phone = (data.get('phone') or '').strip()
    message = (data.get('message') or '').strip()

    errors = {}
    if not name or len(name) > 100:
        errors['name'] = ['Name is required (max 100 characters).']
    if not email or '@' not in email or '.' not in email.split('@')[-1] or len(email) > 120:
        errors['email'] = ['A valid email is required.']
    if len(phone) > 30:
        errors['phone'] = ['Phone is too long.']
    if not message:
        errors['message'] = ['Message is required.']
    elif len(message) > MAX_MESSAGE_LENGTH:
        errors['message'] = [f'Message is too long (max {MAX_MESSAGE_LENGTH} characters).']
    if errors:
        return jsonify({'errors': errors}), 422

    contact = ContactMessage(
        name=name,
        email=email,
        phone=phone or None,
        message=message,
        ip_address=request.remote_addr,
        user_agent=(request.headers.get('User-Agent') or '')[:255],
    )
    db.session.add(contact)
    db.session.commit()

    post_webhook(
        kind='contact',
        subject=f'Contact form: {name}',
        text=f'Contact message #{contact.id} from {name} <{email}>'
             + (f' ({phone})' if phone else '') + f':\n\n{message}',
        name=name,
        email=email,
        phone=phone or None,
        url=admin_url('/backoffice/dashboard'),
        extra={'id': contact.id},
    )

    return jsonify({'ok': True, 'id': contact.id}), 201
