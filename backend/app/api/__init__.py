from flask import Blueprint

api_bp = Blueprint('api', __name__)

from . import auth, users, bookings, vehicles, services, service_steps, payments, dashboard, settings
