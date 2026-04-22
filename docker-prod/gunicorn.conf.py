"""Gunicorn configuration file for Visual Portfolio backend."""

import os

# Server socket
bind = "0.0.0.0:5000"

# Worker processes
workers = int(os.environ.get("WEB_CONCURRENCY", 2))
worker_class = "sync"
worker_tmp_dir = "/dev/shm"

# Timeouts
timeout = 120
graceful_timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = os.environ.get("LOG_LEVEL", "info").lower()

# Performance
preload_app = True
