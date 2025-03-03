from flask import render_template, jsonify, request
from app import app
from agents.crypto_data_agent import CryptoDataAgent
from agents.sentiment_agent import SentimentAgent
from agents.recommendation_agent import RecommendationAgent
from config.settings import Config
from datetime import datetime

crypto_agent = CryptoDataAgent()
sentiment_agent = SentimentAgent()
recommendation_agent = RecommendationAgent()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/crypto/top')
def get_top_crypto():
    data = crypto_agent.get_top_coins()
    if isinstance(data, dict) and 'error' in data:
        return jsonify({"success": False, "error": data['error']}), 500
    return jsonify({"success": True, "data": data})

@app.route('/api/recommendations')
def get_recommendations():
    try:
        risk_profile = request.args.get('risk_profile', 'moderate')
        app.logger.info(f"Fetching recommendations for risk profile: {risk_profile}")
        
        market_data = crypto_agent.get_top_coins()
        if isinstance(market_data, dict) and 'error' in market_data:
            app.logger.error(f"Failed to fetch market data: {market_data['error']}")
            return jsonify({"success": False, "error": f"Failed to fetch market data: {market_data['error']}"}), 500
            
        if not market_data or not isinstance(market_data, list):
            app.logger.error("No valid market data received")
            return jsonify({"success": False, "error": "No valid market data received"}), 500
            
        app.logger.info(f"Fetched market data for {len(market_data)} coins")
        
        recommendations = recommendation_agent.generate_recommendations(
            market_data=market_data,
            risk_profile=risk_profile
        )
        
        if isinstance(recommendations, dict) and 'error' in recommendations:
            app.logger.error(f"Failed to generate recommendations: {recommendations['error']}")
            return jsonify({"success": False, "error": recommendations['error']}), 500
            
        app.logger.info("Successfully generated recommendations")
        return jsonify({"success": True, "recommendations": recommendations})
        
    except Exception as e:
        app.logger.error(f"Error in get_recommendations: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500
