import os
import sys

# Ensure local imports work in Cloud Functions environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import functions_framework
from firebase_admin import initialize_app
from fastapi import FastAPI
from a2wsgi import ASGIMiddleware
from werkzeug.wrappers import Response

# Initialize Firebase Admin
try:
    initialize_app()
except ValueError:
    pass  # Already initialized

# Import sub-apps
# These imports assume 'api', 'bot', and 'shared' are packages in this directory
from api.main import app as api_app
from bot.main import app as bot_app

# Create master app
main_app = FastAPI()

# Mount sub-apps
# /api -> routed to API app
# /bot -> routed to Bot app (including webhook)
main_app.mount("/api", api_app)
main_app.mount("/bot", bot_app)

# Convert ASGI app to WSGI for Cloud Functions compatibility
wsgi_app = ASGIMiddleware(main_app)


@functions_framework.http
def membership_backend(request):
    """
    Cloud Function handler that bridges HTTPS requests to the FastAPI app.
    Using functions-framework for Python 3.9 compatibility.
    """
    return Response.from_app(wsgi_app, request.environ)
