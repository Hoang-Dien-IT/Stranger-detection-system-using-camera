import logging
import logging.handlers
import os
import sys
from datetime import datetime

def setup_logger():
    """Setup structured logging with Unicode support"""
    
    # Create logs directory
    os.makedirs("logs", exist_ok=True)
    
    # Create logger
    logger = logging.getLogger("face_recognition_saas")
    logger.setLevel(logging.INFO)
    
    # Create formatters (without emoji for file logs)
    file_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # File handler with rotation and UTF-8 encoding
    file_handler = logging.handlers.RotatingFileHandler(
        "logs/app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5,
        encoding='utf-8'  # Explicitly set UTF-8 encoding
    )
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(file_formatter)
    
    # Console handler with UTF-8 support
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    
    # Set console encoding to UTF-8 if possible
    if hasattr(console_handler.stream, 'reconfigure'):
        try:
            console_handler.stream.reconfigure(encoding='utf-8')
        except:
            pass
    
    # Add handlers to logger
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# Custom log functions without emoji for Windows compatibility
def log_info(message: str):
    """Log info message without emoji"""
    app_logger.info(message.replace('🚀', '[START]')
                          .replace('✅', '[SUCCESS]')
                          .replace('🔄', '[SHUTDOWN]')
                          .replace('🌟', '[SERVER]')
                          .replace('❌', '[ERROR]')
                          .replace('⚠️', '[WARNING]'))

def log_error(message: str):
    """Log error message without emoji"""
    app_logger.error(message.replace('❌', '[ERROR]')
                           .replace('⚠️', '[WARNING]'))

def log_success(message: str):
    """Log success message without emoji"""
    app_logger.info(message.replace('✅', '[SUCCESS]'))

# Global logger instance
app_logger = setup_logger()