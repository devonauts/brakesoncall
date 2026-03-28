import os
from flask import jsonify, request
from flask_jwt_extended import jwt_required
from . import api_bp
from ..utils.decorators import role_required


def _get_config_status():
    """Return current configuration status of all integrations."""
    return {
        'stripe': {
            'is_configured': bool(os.environ.get('STRIPE_SECRET_KEY')),
            'publishable_key': os.environ.get('STRIPE_PUBLISHABLE_KEY', ''),
            'has_secret_key': bool(os.environ.get('STRIPE_SECRET_KEY')),
        },
        'sendgrid': {
            'is_configured': bool(os.environ.get('SENDGRID_API_KEY')),
            'from_email': os.environ.get('SENDGRID_FROM_EMAIL', 'brakesoncall@gmail.com'),
        },
        'turnstile': {
            'is_configured': bool(os.environ.get('TURNSTILE_SECRET_KEY') and os.environ.get('TURNSTILE_SITE_KEY')),
            'site_key': os.environ.get('TURNSTILE_SITE_KEY', ''),
            'has_secret_key': bool(os.environ.get('TURNSTILE_SECRET_KEY')),
        },
    }


@api_bp.route('/settings', methods=['GET'])
@jwt_required()
@role_required(['admin'])
def get_settings():
    """Get all integration configuration statuses."""
    return jsonify(_get_config_status())


@api_bp.route('/settings/stripe', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_stripe_settings():
    data = request.get_json()

    if 'secret_key' in data and data['secret_key']:
        os.environ['STRIPE_SECRET_KEY'] = data['secret_key']
    if 'publishable_key' in data and data['publishable_key']:
        os.environ['STRIPE_PUBLISHABLE_KEY'] = data['publishable_key']

    return jsonify({
        'message': 'Stripe settings updated',
        'stripe': _get_config_status()['stripe'],
    })


@api_bp.route('/settings/sendgrid', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_sendgrid_settings():
    data = request.get_json()

    if 'api_key' in data and data['api_key']:
        os.environ['SENDGRID_API_KEY'] = data['api_key']
    if 'from_email' in data and data['from_email']:
        os.environ['SENDGRID_FROM_EMAIL'] = data['from_email']

    return jsonify({
        'message': 'SendGrid settings updated',
        'sendgrid': _get_config_status()['sendgrid'],
    })


@api_bp.route('/settings/sendgrid/test', methods=['POST'])
@jwt_required()
@role_required(['admin'])
def test_sendgrid():
    """Send a test email to verify SendGrid configuration."""
    data = request.get_json()
    to_email = data.get('to_email', '')

    if not to_email:
        return jsonify({'error': 'Please provide a to_email'}), 422

    from ..utils.email import send_email
    success = send_email(
        to_email=to_email,
        subject='Brakes on Call — Test Email',
        html_content="""
        <div style="font-family: Arial, sans-serif; padding: 32px; text-align: center;">
            <h1 style="color: #FF6B00;">It works!</h1>
            <p style="color: #555;">Your SendGrid integration is configured correctly.</p>
            <p style="color: #999; font-size: 12px;">Brakes on Call</p>
        </div>
        """,
    )

    if success:
        return jsonify({'message': f'Test email sent to {to_email}'})
    return jsonify({'error': 'Failed to send. Check your SendGrid API key.'}), 400


@api_bp.route('/settings/turnstile', methods=['PUT'])
@jwt_required()
@role_required(['admin'])
def update_turnstile_settings():
    data = request.get_json()

    if 'site_key' in data and data['site_key']:
        os.environ['TURNSTILE_SITE_KEY'] = data['site_key']
    if 'secret_key' in data and data['secret_key']:
        os.environ['TURNSTILE_SECRET_KEY'] = data['secret_key']

    return jsonify({
        'message': 'Turnstile settings updated',
        'turnstile': _get_config_status()['turnstile'],
    })
