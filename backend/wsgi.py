"""Production WSGI entry point. Run with: gunicorn wsgi:app"""
from dotenv import load_dotenv

load_dotenv()

from app import create_app

app = create_app('production')
