import requests
from flask import current_app, request


def verify_turnstile(token: str) -> bool:
    """Verify a Cloudflare Turnstile CAPTCHA token.
    Returns True if valid or if Turnstile is not configured (dev mode).
    """
    secret_key = current_app.config.get('TURNSTILE_SECRET_KEY', '')
    if not secret_key:
        return True  # Skip in development if not configured

    if not token:
        return False

    try:
        response = requests.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data={
                'secret': secret_key,
                'response': token,
                'remoteip': request.remote_addr,
            },
            timeout=5,
        )
        result = response.json()
        return result.get('success', False)
    except Exception:
        # Fail open in case of network issues to not block users
        return True
