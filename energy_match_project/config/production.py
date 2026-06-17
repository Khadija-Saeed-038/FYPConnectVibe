"""
Production settings for deployed Energy Match API (Render, Railway, VPS, etc.).

Set environment:
  DJANGO_SETTINGS_MODULE=config.production
"""
import os

import dj_database_url

from .settings import *  # noqa: F401,F403

DEBUG = False

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
if not SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY environment variable is required in production')

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('ALLOWED_HOSTS', '').split(',')
    if h.strip()
]

_render_host = os.environ.get('RENDER_EXTERNAL_HOSTNAME', '').strip()
if _render_host and _render_host not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append(_render_host)

if not ALLOWED_HOSTS:
    raise ValueError(
        'Set ALLOWED_HOSTS or deploy on Render (RENDER_EXTERNAL_HOSTNAME is set automatically)',
    )

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    *[
        m
        for m in MIDDLEWARE  # noqa: F405
        if m
        not in (
            'django.middleware.security.SecurityMiddleware',
            'whitenoise.middleware.WhiteNoiseMiddleware',
        )
    ],
]

STATIC_ROOT = BASE_DIR / 'staticfiles'  # noqa: F405
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

_database_url = os.environ.get('DATABASE_URL')
if _database_url:
    DATABASES = {  # noqa: F405
        'default': dj_database_url.parse(_database_url, conn_max_age=600),
    }
