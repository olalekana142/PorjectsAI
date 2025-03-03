import os
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask Configuration
    SECRET_KEY = 'your-secret-key'  # Change this in production
    DEBUG = True  # Enable debug mode for auto-reloading
    PORT = 5000
    HOST = '127.0.0.1'
    
    # Operating hours (5 AM to 10 PM EST)
    OPERATING_START_HOUR = 5
    OPERATING_END_HOUR = 22
    
    # API Configuration
    COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
    COINGECKO_API_KEY = ''  # Optional, for higher rate limits
    
    # Cache Configuration
    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300  # 5 minutes
    
    # Scheduler Configuration
    SCHEDULER_API_ENABLED = True
    JOBS = [
        {
            'id': 'update_market_data',
            'func': 'app.tasks:update_market_data',
            'trigger': 'interval',
            'minutes': 5
        }
    ]
    
    # Technical Analysis Configuration
    TECHNICAL_ANALYSIS = {
        'short_window': 20,
        'long_window': 50,
        'rsi_period': 14,
        'macd_fast': 12,
        'macd_slow': 26,
        'macd_signal': 9
    }
    
    # Risk Profile Configuration
    RISK_PROFILES = {
        'conservative': {
            'volatility_weight': 0.4,
            'market_cap_weight': 0.3,
            'volume_weight': 0.3
        },
        'moderate': {
            'volatility_weight': 0.5,
            'market_cap_weight': 0.25,
            'volume_weight': 0.25
        },
        'aggressive': {
            'volatility_weight': 0.6,
            'market_cap_weight': 0.2,
            'volume_weight': 0.2
        }
    }
    
    @staticmethod
    def is_operating_hours():
        """Check if current time is within operating hours"""
        current_hour = datetime.now().hour
        print(f"Current hour: {current_hour}")  # Debug print
        is_operating = Config.OPERATING_START_HOUR <= current_hour < Config.OPERATING_END_HOUR
        print(f"Operating hours: {Config.OPERATING_START_HOUR} to {Config.OPERATING_END_HOUR}")
        print(f"Is operating: {is_operating}")
        return is_operating
        
    @staticmethod
    def get_api_headers():
        """Get API headers for CoinGecko"""
        headers = {
            'Accept': 'application/json',
            'User-Agent': 'Crypto-Advisor/1.0'
        }
        if Config.COINGECKO_API_KEY:
            headers['X-CG-API-Key'] = Config.COINGECKO_API_KEY
        return headers
