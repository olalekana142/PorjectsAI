from textblob import TextBlob
from config.settings import Config
import re

class SentimentAgent:
    def __init__(self):
        self.sentiment_cache = {}
        
    def analyze_text(self, text):
        """Analyze sentiment of given text"""
        if not Config.is_operating_hours():
            return {"error": "Service only available during operating hours"}
            
        try:
            # Clean the text
            cleaned_text = self._clean_text(text)
            
            # Perform sentiment analysis
            analysis = TextBlob(cleaned_text)
            
            # Calculate compound score
            compound_score = (analysis.sentiment.polarity + 1) / 2  # Normalize to 0-1
            
            return {
                "polarity": analysis.sentiment.polarity,
                "subjectivity": analysis.sentiment.subjectivity,
                "compound_score": compound_score,
                "sentiment": self._get_sentiment_label(compound_score)
            }
        except Exception as e:
            return {"error": str(e)}
            
    def analyze_multiple(self, texts):
        """Analyze sentiment for multiple texts and return aggregate results"""
        if not Config.is_operating_hours():
            return {"error": "Service only available during operating hours"}
            
        try:
            results = []
            total_polarity = 0
            total_subjectivity = 0
            
            for text in texts:
                analysis = self.analyze_text(text)
                if "error" not in analysis:
                    results.append(analysis)
                    total_polarity += analysis["polarity"]
                    total_subjectivity += analysis["subjectivity"]
                    
            if not results:
                return {"error": "No valid texts to analyze"}
                
            avg_polarity = total_polarity / len(results)
            avg_subjectivity = total_subjectivity / len(results)
            avg_compound = (avg_polarity + 1) / 2
            
            return {
                "individual_results": results,
                "aggregate_results": {
                    "average_polarity": avg_polarity,
                    "average_subjectivity": avg_subjectivity,
                    "average_compound": avg_compound,
                    "overall_sentiment": self._get_sentiment_label(avg_compound)
                }
            }
        except Exception as e:
            return {"error": str(e)}
            
    def _clean_text(self, text):
        """Clean and preprocess text for analysis"""
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs
        text = re.sub(r'http\S+|www.\S+', '', text)
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Remove extra whitespace
        text = ' '.join(text.split())
        
        return text
        
    def _get_sentiment_label(self, compound_score):
        """Convert compound score to sentiment label"""
        if compound_score >= 0.6:
            return "very positive"
        elif compound_score >= 0.2:
            return "positive"
        elif compound_score > 0.4:
            return "neutral"
        elif compound_score > 0.2:
            return "negative"
        else:
            return "very negative"
