"""
Local analysis service using VADER for sentiment and spaCy + patterns for tagging.
No API calls required - runs 100% locally.
"""
import re
from typing import Dict, Any, List
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Initialize VADER
analyzer = SentimentIntensityAnalyzer()


class LocalAnalysisService:
    """Service for local comment analysis without API calls."""
    
    def __init__(self):
        self.vader = SentimentIntensityAnalyzer()
        
        # Tag patterns for keyword-based classification
        self.tag_patterns = {
            'question': [
                r'\?',  # Contains question mark
                r'^(what|why|how|when|where|who|which|can|could|would|should|is|are|do|does)\b',
            ],
            'suggestion': [
                r'you should',
                r'please make',
                r'would love (to see|if)',
                r'it would be (great|nice|cool)',
                r'can you (make|do|try)',
                r'next (video|time)',
            ],
            'collab_request': [
                r'collab',
                r'feature me',
                r'work together',
                r'let\'s (do|make)',
                r'dm me',
                r'reach out',
                r'contact me',
            ],
            'feedback': [
                r'(great|good|nice|awesome|amazing|love) (video|content|work)',
                r'keep (it )?up',
                r'well done',
                r'appreciate',
                r'thank(s| you)',
            ],
            'urgent': [
                r'(help|please|urgent|asap|emergency)',
                r'need (help|assistance)',
                r'important',
            ],
            'viral_potential': [
                r'(omg|lol|lmao|dead|crying)',
                r'🔥|💀|😂|🤣|❤️',
                r'this is (gold|fire|amazing)',
                r'best (video|content)',
            ],
        }
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment using VADER.
        Returns sentiment label and confidence score.
        """
        scores = self.vader.polarity_scores(text)
        compound = scores['compound']
        
        # Classify based on compound score
        if compound >= 0.05:
            sentiment = 'positive'
        elif compound <= -0.05:
            sentiment = 'negative'
        else:
            sentiment = 'neutral'
        
        return {
            'sentiment': sentiment,
            'score': abs(compound),
            'details': scores
        }
    
    def analyze_tags(self, text: str) -> List[str]:
        """
        Analyze text and return relevant tags using pattern matching.
        """
        tags = []
        text_lower = text.lower()
        
        for tag, patterns in self.tag_patterns.items():
            for pattern in patterns:
                if re.search(pattern, text_lower, re.IGNORECASE):
                    if tag not in tags:
                        tags.append(tag)
                    break
        
        return tags
    
    def analyze_comment(self, text: str) -> Dict[str, Any]:
        """
        Full analysis of a single comment.
        """
        sentiment_result = self.analyze_sentiment(text)
        tags = self.analyze_tags(text)
        
        return {
            'sentiment': sentiment_result['sentiment'],
            'sentiment_score': sentiment_result['score'],
            'tags': tags
        }
    
    def analyze_batch(self, comments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyze a batch of comments.
        Much faster than API calls - processes thousands per second.
        """
        results = []
        
        for comment in comments:
            text = comment.get('text', '')
            analysis = self.analyze_comment(text)
            
            results.append({
                'comment_id': comment.get('comment_id'),
                **analysis
            })
        
        return results


# Singleton instance
local_analysis_service = LocalAnalysisService()
