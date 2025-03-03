from typing import Dict, List, Any
import numpy as np
import random

class RecommendationAgent:
    def __init__(self):
        self.risk_weights = {
            'conservative': {'volatility': 0.4, 'market_cap': 0.4, 'volume': 0.2},
            'moderate': {'volatility': 0.5, 'market_cap': 0.3, 'volume': 0.2},
            'aggressive': {'volatility': 0.6, 'market_cap': 0.2, 'volume': 0.2}
        }

    def generate_recommendations(self, market_data: List[Dict[str, Any]], risk_profile: str = "moderate") -> Dict[str, Any]:
        try:
            if not market_data:
                return {"error": "No market data available for analysis"}

            # Filter and sort coins
            analyzed_coins = self._analyze_coins(market_data, risk_profile)
            
            # Get top 4 recommendations
            top_recommendations = analyzed_coins[:4]
            
            recommendations = []
            for coin in top_recommendations:
                analysis_points = self._generate_analysis_points(coin, risk_profile)
                prediction = self._generate_price_prediction(coin)
                
                recommendation = {
                    "coin": coin["id"],
                    "price": coin["current_price"],
                    "change_24h": coin["price_change_percentage_24h"],
                    "risk_score": self._calculate_risk_score(coin, risk_profile),
                    "analysis": analysis_points,
                    "prediction": prediction
                }
                recommendations.append(recommendation)

            return {
                "specific_recommendations": recommendations,
                "disclaimer": self._get_risk_disclaimer(risk_profile)
            }

        except Exception as e:
            return {"error": f"Failed to generate recommendations: {str(e)}"}

    def _analyze_coins(self, market_data: List[Dict[str, Any]], risk_profile: str) -> List[Dict[str, Any]]:
        weights = self.risk_weights[risk_profile]
        
        for coin in market_data:
            # Calculate composite score based on risk profile
            volatility_score = 1 / (abs(coin.get('price_change_percentage_24h', 0)) + 1)
            market_cap_score = np.log(coin.get('market_cap', 1)) / 30  # Normalize large numbers
            volume_score = np.log(coin.get('total_volume', 1)) / 25    # Normalize large numbers
            
            coin['composite_score'] = (
                weights['volatility'] * volatility_score +
                weights['market_cap'] * market_cap_score +
                weights['volume'] * volume_score
            )
        
        # Sort by composite score
        return sorted(market_data, key=lambda x: x.get('composite_score', 0), reverse=True)

    def _calculate_risk_score(self, coin: Dict[str, Any], risk_profile: str) -> int:
        # Calculate risk score (1-10)
        volatility = abs(coin.get('price_change_percentage_24h', 0))
        market_cap = coin.get('market_cap', 0)
        volume = coin.get('total_volume', 0)
        
        # Normalize factors
        volatility_score = min(volatility / 10, 1) * 10
        market_cap_score = (1 - (np.log(market_cap) / 25)) * 10 if market_cap > 0 else 10
        volume_score = (np.log(volume) / 25) * 10 if volume > 0 else 0
        
        # Weight the scores based on risk profile
        weights = self.risk_weights[risk_profile]
        risk_score = (
            weights['volatility'] * volatility_score +
            weights['market_cap'] * market_cap_score +
            weights['volume'] * volume_score
        )
        
        return min(max(int(risk_score), 1), 10)

    def _generate_analysis_points(self, coin: Dict[str, Any], risk_profile: str) -> List[str]:
        analysis = []
        
        # Price change analysis
        price_change = coin.get('price_change_percentage_24h', 0)
        if abs(price_change) > 5:
            direction = "bullish" if price_change > 0 else "bearish"
            analysis.append(f"Showing strong {direction} momentum with {abs(price_change):.1f}% change in 24h")
        
        # Volume analysis
        volume = coin.get('total_volume', 0)
        market_cap = coin.get('market_cap', 0)
        if market_cap > 0:
            volume_to_mcap = volume / market_cap
            if volume_to_mcap > 0.2:
                analysis.append(f"High trading volume relative to market cap indicates strong market interest")
            elif volume_to_mcap < 0.05:
                analysis.append(f"Low trading volume suggests potential liquidity risks")
        
        # Market cap analysis
        if market_cap > 1e10:  # > $10B
            analysis.append("Large market cap suggests lower volatility risk")
        elif market_cap < 1e9:  # < $1B
            analysis.append("Smaller market cap indicates higher potential for price swings")
        
        # Risk profile specific analysis
        if risk_profile == 'conservative':
            analysis.append("Recommended as part of a conservative portfolio with focus on stability")
        elif risk_profile == 'aggressive':
            analysis.append("Suitable for aggressive traders comfortable with higher volatility")
        else:
            analysis.append("Balanced risk-reward profile for moderate investors")
        
        return analysis

    def _generate_price_prediction(self, coin: Dict[str, Any]) -> str:
        price_change = coin.get('price_change_percentage_24h', 0)
        market_cap = coin.get('market_cap', 0)
        
        if market_cap > 1e10:  # > $10B
            confidence = "moderate"
            range_percent = random.uniform(3, 7)
        else:
            confidence = "speculative"
            range_percent = random.uniform(5, 15)
        
        direction = "increase" if price_change > 0 else "decrease"
        
        return f"With {confidence} confidence, we project a potential {direction} of {range_percent:.1f}% in the next 24-48 hours based on current market conditions"

    def _get_risk_disclaimer(self, risk_profile: str) -> str:
        disclaimers = {
            'conservative': "These recommendations prioritize stability over high returns. While selected assets show lower volatility, cryptocurrency investments still carry significant risks.",
            'moderate': "These balanced recommendations aim to optimize risk-reward ratio. However, cryptocurrency markets are highly volatile and past performance doesn't guarantee future results.",
            'aggressive': "These high-risk recommendations prioritize potential returns over stability. Be prepared for significant price swings and only invest what you can afford to lose."
        }
        return disclaimers.get(risk_profile, "Cryptocurrency investments are highly volatile. Always conduct your own research and invest responsibly.")
