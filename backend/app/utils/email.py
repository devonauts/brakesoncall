import os
from flask import current_app


def send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send an email via SendGrid. Returns True if sent, False if not configured or failed."""
    api_key = current_app.config.get('SENDGRID_API_KEY', '')
    if not api_key:
        current_app.logger.info(f'SendGrid not configured. Email to {to_email}: {subject}')
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail

        message = Mail(
            from_email=(
                current_app.config['SENDGRID_FROM_EMAIL'],
                current_app.config['SENDGRID_FROM_NAME'],
            ),
            to_emails=to_email,
            subject=subject,
            html_content=html_content,
        )

        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        return response.status_code in (200, 201, 202)
    except Exception as e:
        current_app.logger.error(f'SendGrid error: {e}')
        return False


def send_booking_confirmation(booking):
    """Send booking confirmation email to customer."""
    customer = booking.customer
    service = booking.service
    frontend_url = current_app.config.get('FRONTEND_URL', 'https://brakesoncall.com')

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #141414; padding: 24px; text-align: center;">
            <h1 style="color: #FF6B00; margin: 0; font-size: 24px;">Brakes on Call</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
            <h2 style="color: #141414; margin-top: 0;">Booking Confirmed!</h2>
            <p style="color: #555;">Hi {customer.first_name},</p>
            <p style="color: #555;">Your brake service has been booked successfully. Here are the details:</p>

            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Service:</strong> {service.name}</p>
                <p style="margin: 4px 0;"><strong>Date:</strong> {booking.scheduled_date}</p>
                <p style="margin: 4px 0;"><strong>Time:</strong> {booking.scheduled_time_slot}</p>
                <p style="margin: 4px 0;"><strong>Location:</strong> {booking.address}, {booking.city}, {booking.state} {booking.zip_code}</p>
                <p style="margin: 4px 0;"><strong>Total:</strong> ${booking.total_price:.2f}</p>
            </div>

            <p style="color: #555;">Our team will confirm your appointment shortly. If you need to make changes, please call us at <strong>(512) 630-9050</strong>.</p>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{frontend_url}/account/bookings/{booking.id}"
                   style="background: #FF6B00; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    View Booking
                </a>
            </div>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>&copy; Brakes on Call | (512) 630-9050 | brakesoncall@gmail.com</p>
        </div>
    </div>
    """

    return send_email(
        to_email=customer.email,
        subject=f'Booking Confirmed — {service.name} on {booking.scheduled_date}',
        html_content=html,
    )


def send_password_reset_email(user, reset_token: str):
    """Send password reset email."""
    frontend_url = current_app.config.get('FRONTEND_URL', 'https://brakesoncall.com')

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #141414; padding: 24px; text-align: center;">
            <h1 style="color: #FF6B00; margin: 0; font-size: 24px;">Brakes on Call</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
            <h2 style="color: #141414; margin-top: 0;">Reset Your Password</h2>
            <p style="color: #555;">Hi {user.first_name},</p>
            <p style="color: #555;">We received a request to reset your password. Click the button below to set a new one. This link expires in 1 hour.</p>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{frontend_url}/reset-password?token={reset_token}"
                   style="background: #FF6B00; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    Reset Password
                </a>
            </div>

            <p style="color: #999; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>&copy; Brakes on Call | (512) 630-9050 | brakesoncall@gmail.com</p>
        </div>
    </div>
    """

    return send_email(
        to_email=user.email,
        subject='Reset Your Password — Brakes on Call',
        html_content=html,
    )


def send_booking_status_update(booking, new_status: str):
    """Notify customer of booking status change."""
    customer = booking.customer
    status_messages = {
        'confirmed': 'Your booking has been confirmed!',
        'assigned': 'A technician has been assigned to your booking.',
        'in_progress': 'Your brake service is now in progress!',
        'completed': 'Your brake service has been completed. Thank you!',
        'cancelled': 'Your booking has been cancelled.',
    }

    message = status_messages.get(new_status, f'Your booking status has been updated to: {new_status}')
    frontend_url = current_app.config.get('FRONTEND_URL', 'https://brakesoncall.com')

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #141414; padding: 24px; text-align: center;">
            <h1 style="color: #FF6B00; margin: 0; font-size: 24px;">Brakes on Call</h1>
        </div>
        <div style="padding: 32px 24px; background: #ffffff;">
            <h2 style="color: #141414; margin-top: 0;">Booking Update</h2>
            <p style="color: #555;">Hi {customer.first_name},</p>
            <p style="color: #555; font-size: 16px;">{message}</p>

            <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Booking:</strong> #{booking.id}</p>
                <p style="margin: 4px 0;"><strong>Service:</strong> {booking.service.name}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> {new_status.replace('_', ' ').title()}</p>
            </div>

            <div style="text-align: center; margin: 24px 0;">
                <a href="{frontend_url}/account/bookings/{booking.id}"
                   style="background: #FF6B00; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                    View Booking
                </a>
            </div>
        </div>
        <div style="background: #f3f4f6; padding: 16px 24px; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>&copy; Brakes on Call | (512) 630-9050 | brakesoncall@gmail.com</p>
        </div>
    </div>
    """

    return send_email(
        to_email=customer.email,
        subject=f'Booking #{booking.id} — {new_status.replace("_", " ").title()}',
        html_content=html,
    )
