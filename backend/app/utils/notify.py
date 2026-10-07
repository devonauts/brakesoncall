"""Fire-and-forget notifications to the Urresta HQ webhook receiver."""
import logging
import threading

import requests
from flask import current_app

logger = logging.getLogger(__name__)

NOTIFY_TIMEOUT_SECONDS = 5


def _send(url: str, payload: dict, log: logging.Logger):
    try:
        resp = requests.post(url, json=payload, timeout=NOTIFY_TIMEOUT_SECONDS)
        if resp.status_code >= 400:
            log.warning('Notify webhook returned %s for kind=%s', resp.status_code, payload.get('kind'))
    except Exception as e:  # never let a notification failure propagate
        log.warning('Notify webhook failed for kind=%s: %s', payload.get('kind'), e)


def post_webhook(kind: str, text: str, subject: str = None, name: str = None,
                 email: str = None, phone: str = None, url: str = None,
                 severity: str = None, extra: dict = None, wait: bool = False):
    """Post an event to NOTIFY_WEBHOOK_URL in a background thread.

    Does nothing when the URL is not configured. Never raises.
    Returns the thread (or None) so tests can join it; pass wait=True to block.
    """
    try:
        try:
            webhook_url = current_app.config.get('NOTIFY_WEBHOOK_URL', '')
            log = current_app.logger
        except RuntimeError:  # outside an app context
            webhook_url, log = '', logger
        if not webhook_url:
            return None

        payload = {'kind': kind, 'text': text}
        for key, value in (('subject', subject), ('name', name), ('email', email),
                           ('phone', phone), ('url', url), ('severity', severity)):
            if value:
                payload[key] = value
        if extra:
            payload.update(extra)

        thread = threading.Thread(target=_send, args=(webhook_url, payload, log), daemon=True)
        thread.start()
        if wait:
            thread.join(NOTIFY_TIMEOUT_SECONDS + 1)
        return thread
    except Exception as e:
        logger.warning('Notify webhook could not be scheduled: %s', e)
        return None


def admin_url(path: str) -> str:
    """Build an absolute backoffice link from FRONTEND_URL."""
    try:
        base = current_app.config.get('FRONTEND_URL', '').rstrip('/')
    except RuntimeError:
        base = ''
    return f'{base}{path}'
