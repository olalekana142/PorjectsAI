import requests
from datetime import datetime, timedelta
from config.settings import Config

class CryptoDataAgent:
    def __init__(self):
        self.base_url = Config.COINGECKO_API_URL
        self.headers = Config.get_api_headers()
        
    def get_top_coins(self, limit=50):
        """Fetch top cryptocurrencies by market cap with detailed market data"""
        endpoint = f"{self.base_url}/coins/markets"
        params = {
            "vs_currency": "usd",
            "order": "market_cap_desc",
            "per_page": limit,
            "page": 1,
            "sparkline": True,
            "price_change_percentage": "1h,24h,7d",
        }
        
        try:
            response = requests.get(endpoint, params=params, headers=self.headers)
            response.raise_for_status()  # Raise an exception for bad status codes
                
            data = response.json()
            if not data:
                raise ValueError("No data received from API")
                
            enriched_data = []
            
            for coin in data:
                market_data = {
                    "id": coin.get("id"),
                    "name": coin.get("name"),
                    "symbol": coin.get("symbol"),
                    "current_price": coin.get("current_price", 0),
                    "market_cap": coin.get("market_cap", 0),
                    "market_cap_rank": coin.get("market_cap_rank", 0),
                    "total_volume": coin.get("total_volume", 0),
                    "high_24h": coin.get("high_24h", 0),
                    "low_24h": coin.get("low_24h", 0),
                    "price_change_24h": coin.get("price_change_24h", 0),
                    "price_change_percentage_24h": coin.get("price_change_percentage_24h", 0),
                    "price_change_percentage_1h": coin.get("price_change_percentage_1h_in_currency", 0),
                    "price_change_percentage_7d": coin.get("price_change_percentage_7d_in_currency", 0),
                    "market_cap_change_24h": coin.get("market_cap_change_24h", 0),
                    "market_cap_change_percentage_24h": coin.get("market_cap_change_percentage_24h", 0),
                    "circulating_supply": coin.get("circulating_supply", 0),
                    "total_supply": coin.get("total_supply", 0),
                    "max_supply": coin.get("max_supply", 0),
                    "ath": coin.get("ath", 0),
                    "ath_change_percentage": coin.get("ath_change_percentage", 0),
                    "ath_date": coin.get("ath_date"),
                    "atl": coin.get("atl", 0),
                    "atl_change_percentage": coin.get("atl_change_percentage", 0),
                    "atl_date": coin.get("atl_date"),
                    "sparkline_7d": coin.get("sparkline_in_7d", {}).get("price", [])
                }
                
                # Get historical data for graphs
                historical_data = self.get_coin_history(coin["id"])
                if isinstance(historical_data, dict) and "error" not in historical_data:
                    market_data["historical_data"] = historical_data
                
                # Calculate additional metrics
                market_data.update(self._calculate_additional_metrics(market_data))
                enriched_data.append(market_data)
            
            if not enriched_data:
                raise ValueError("No valid market data to analyze")
                
            return enriched_data
            
        except requests.exceptions.RequestException as e:
            return {"error": f"API request failed: {str(e)}"}
        except ValueError as e:
            return {"error": str(e)}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}
            
    def get_coin_history(self, coin_id, days=30):
        """Fetch historical price data for a specific coin"""
        endpoint = f"{self.base_url}/coins/{coin_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": days,
            "interval": "daily"
        }
        
        try:
            response = requests.get(endpoint, params=params, headers=self.headers)
            response.raise_for_status()
                
            data = response.json()
            if not data:
                raise ValueError("No historical data received")
            
            # Process the data into a more usable format
            prices = []
            volumes = []
            market_caps = []
            
            for price_data, volume_data, mcap_data in zip(
                data.get("prices", []),
                data.get("total_volumes", []),
                data.get("market_caps", [])
            ):
                timestamp = datetime.fromtimestamp(price_data[0]/1000).strftime('%Y-%m-%d')
                prices.append({"date": timestamp, "value": price_data[1]})
                volumes.append({"date": timestamp, "value": volume_data[1]})
                market_caps.append({"date": timestamp, "value": mcap_data[1]})
            
            return {
                "prices": prices,
                "volumes": volumes,
                "market_caps": market_caps
            }
            
        except requests.exceptions.RequestException as e:
            return {"error": f"API request failed: {str(e)}"}
        except ValueError as e:
            return {"error": str(e)}
        except Exception as e:
            return {"error": f"Unexpected error: {str(e)}"}
            
    def _calculate_additional_metrics(self, coin_data):
        """Calculate additional market metrics for analysis"""
        additional_metrics = {}
        
        try:
            # Calculate volatility (using 24h high/low range)
            high_24h = coin_data.get("high_24h", 0)
            low_24h = coin_data.get("low_24h", 0)
            current_price = coin_data.get("current_price", 0)
            
            if all([high_24h, low_24h, current_price]):
                volatility = ((high_24h - low_24h) / current_price) * 100
                additional_metrics["volatility_24h"] = round(volatility, 2)
            
            # Calculate volume to market cap ratio
            market_cap = coin_data.get("market_cap", 0)
            volume = coin_data.get("total_volume", 0)
            
            if market_cap and volume:
                volume_to_mcap = (volume / market_cap) * 100
                additional_metrics["volume_to_mcap_ratio"] = round(volume_to_mcap, 2)
            
            # Calculate supply metrics
            circulating = coin_data.get("circulating_supply", 0)
            total = coin_data.get("total_supply", 0)
            max_supply = coin_data.get("max_supply", 0)
            
            if circulating and total:
                circulation_ratio = (circulating / total) * 100
                additional_metrics["circulation_ratio"] = round(circulation_ratio, 2)
            
            if max_supply:
                supply_ratio = (circulating / max_supply) * 100
                additional_metrics["max_supply_ratio"] = round(supply_ratio, 2)
            
            # Distance from ATH/ATL
            ath = coin_data.get("ath", 0)
            atl = coin_data.get("atl", 0)
            
            if ath and current_price:
                ath_distance = ((ath - current_price) / ath) * 100
                additional_metrics["distance_from_ath"] = round(ath_distance, 2)
            
            if atl and current_price:
                atl_distance = ((current_price - atl) / current_price) * 100
                additional_metrics["distance_from_atl"] = round(atl_distance, 2)
                
            # Analyze price trends from sparkline data
            sparkline_data = coin_data.get("sparkline_7d", [])
            if sparkline_data:
                additional_metrics.update(self._analyze_price_trend(sparkline_data))
            
        except Exception as e:
            print(f"Error calculating metrics: {str(e)}")
        
        return additional_metrics
        
    def _analyze_price_trend(self, price_data):
        """Analyze price trend from sparkline data"""
        if not price_data or len(price_data) < 2:
            return {}
            
        try:
            # Calculate trend metrics
            price_changes = [
                ((b - a) / a) * 100 
                for a, b in zip(price_data[:-1], price_data[1:])
            ]
            
            trend_metrics = {
                "trend_strength": sum(1 for x in price_changes if x > 0) / len(price_changes),
                "avg_daily_change": sum(price_changes) / len(price_changes),
                "trend_volatility": sum(abs(x) for x in price_changes) / len(price_changes)
            }
            
            # Determine trend direction
            if trend_metrics["trend_strength"] > 0.6:
                trend_metrics["trend_direction"] = "strong_upward"
            elif trend_metrics["trend_strength"] > 0.5:
                trend_metrics["trend_direction"] = "moderate_upward"
            elif trend_metrics["trend_strength"] < 0.4:
                trend_metrics["trend_direction"] = "strong_downward"
            elif trend_metrics["trend_strength"] < 0.5:
                trend_metrics["trend_direction"] = "moderate_downward"
            else:
                trend_metrics["trend_direction"] = "sideways"
                
            return trend_metrics
            
        except Exception as e:
            print(f"Error analyzing price trend: {str(e)}")
            return {}
