"""
Centralized logging configuration for TeleGate
Provides structured JSON logging for Cloud Logging
"""

import logging
import json
import sys
from datetime import datetime


class StructuredLogger:
    """Structured logger that outputs JSON for Google Cloud Logging"""

    def __init__(self, name: str):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.INFO)

        # Remove existing handlers
        self.logger.handlers = []

        # Create console handler with JSON formatter
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter())
        self.logger.addHandler(handler)

    def info(self, message: str, **kwargs):
        self.logger.info(message, extra={"structured_data": kwargs})

    def warning(self, message: str, **kwargs):
        self.logger.warning(message, extra={"structured_data": kwargs})

    def error(self, message: str, **kwargs):
        self.logger.error(message, extra={"structured_data": kwargs})

    def debug(self, message: str, **kwargs):
        self.logger.debug(message, extra={"structured_data": kwargs})


class JsonFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "severity": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add structured data if available
        if hasattr(record, "structured_data"):
            log_data.update(record.structured_data)

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_data)


def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance"""
    return StructuredLogger(name)
