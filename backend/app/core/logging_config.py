"""Structured logging configuration for the application.

Supports both human-readable (development) and JSON (production) log formats.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict, Optional

from app.core.config import settings


class StructuredFormatter(logging.Formatter):
    """JSON structured log formatter for production environments."""
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add extra fields if present
        if hasattr(record, "extra_data"):
            log_data["data"] = record.extra_data
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data, ensure_ascii=False)


class ColoredFormatter(logging.Formatter):
    """Colored console formatter for development environments."""
    
    COLORS = {
        "DEBUG": "\033[36m",     # Cyan
        "INFO": "\033[32m",      # Green
        "WARNING": "\033[33m",   # Yellow
        "ERROR": "\033[31m",     # Red
        "CRITICAL": "\033[35m",  # Magenta
    }
    RESET = "\033[0m"
    
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with colors."""
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)


class StructuredLogger(logging.Logger):
    """Extended logger with structured logging support."""
    
    def _log_with_data(
        self, 
        level: int, 
        msg: str, 
        *args, 
        data: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> None:
        """Log with additional structured data."""
        extra = kwargs.pop("extra", {})
        if data:
            extra["extra_data"] = data
        super()._log(level, msg, args, extra=extra, **kwargs)
    
    def info_with_data(self, msg: str, data: Dict[str, Any], *args, **kwargs):
        """Log INFO level with structured data."""
        self._log_with_data(logging.INFO, msg, *args, data=data, **kwargs)
    
    def warning_with_data(self, msg: str, data: Dict[str, Any], *args, **kwargs):
        """Log WARNING level with structured data."""
        self._log_with_data(logging.WARNING, msg, *args, data=data, **kwargs)
    
    def error_with_data(self, msg: str, data: Dict[str, Any], *args, **kwargs):
        """Log ERROR level with structured data."""
        self._log_with_data(logging.ERROR, msg, *args, data=data, **kwargs)


def setup_logging() -> None:
    """Setup logging configuration for the application.
    
    Uses JSON format in production, colored format in development.
    """
    # Set custom logger class
    logging.setLoggerClass(StructuredLogger)
    
    # Create root logger
    logger = logging.getLogger()
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logger.setLevel(log_level)

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)

    # Choose formatter based on environment
    is_production = settings.APP_ENV.lower() == "production"
    
    if is_production:
        # JSON format for production (easier to parse with log aggregators)
        formatter = StructuredFormatter()
    else:
        # Colored human-readable format for development
        formatter = ColoredFormatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # Set specific log levels for third-party libraries
    logging.getLogger('motor').setLevel(logging.WARNING)
    logging.getLogger('beanie').setLevel(logging.WARNING)
    logging.getLogger('uvicorn').setLevel(logging.INFO)
    logging.getLogger('fastapi').setLevel(logging.INFO)
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('sentence_transformers').setLevel(logging.WARNING)

    # Log startup information
    logger.info(
        "Logging configured | level=%s | format=%s",
        settings.LOG_LEVEL,
        "json" if is_production else "colored"
    )


def get_logger(name: str) -> StructuredLogger:
    """Get a structured logger instance with the specified name.
    
    Args:
        name: Logger name (typically __name__)
        
    Returns:
        StructuredLogger instance
    """
    return logging.getLogger(name)


# Convenience function for request logging
def log_request(
    logger: logging.Logger,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    user_id: Optional[str] = None,
) -> None:
    """Log HTTP request with structured data.
    
    Args:
        logger: Logger instance
        method: HTTP method
        path: Request path
        status_code: Response status code
        duration_ms: Request duration in milliseconds
        user_id: Optional user ID
    """
    data = {
        "method": method,
        "path": path,
        "status_code": status_code,
        "duration_ms": round(duration_ms, 2),
    }
    if user_id:
        data["user_id"] = user_id
    
    level = logging.INFO if status_code < 400 else logging.WARNING
    
    if hasattr(logger, "_log_with_data"):
        logger._log_with_data(level, "HTTP Request", data=data)
    else:
        logger.log(level, "HTTP Request | %s %s | %d | %.2fms", method, path, status_code, duration_ms)
