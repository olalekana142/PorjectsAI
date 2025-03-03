from app import app
from agents.crypto_data_agent import CryptoDataAgent

crypto_agent = CryptoDataAgent()

def update_market_data():
    """Update market data periodically"""
    with app.app_context():
        try:
            crypto_agent.get_top_coins()
        except Exception as e:
            app.logger.error(f"Error updating market data: {str(e)}")
