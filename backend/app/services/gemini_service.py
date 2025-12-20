import json
from typing import List, Dict, Any, Optional
import google.generativeai as genai

from app.config import get_settings

settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)


class GeminiService:
    """Service for AI-powered comment analysis using Gemini."""
    
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    async def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of a single comment."""
        prompt = f"""Analyze the sentiment of this YouTube comment.

Comment: "{text}"

Respond ONLY with a JSON object (no markdown, no code blocks):
{{"sentiment": "positive" or "neutral" or "negative", "score": -1.0 to 1.0}}

Examples:
- "Love this video!" -> {{"sentiment": "positive", "score": 0.9}}
- "First!" -> {{"sentiment": "neutral", "score": 0.0}}
- "This is terrible" -> {{"sentiment": "negative", "score": -0.8}}"""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up response
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            result = json.loads(result_text)
            return {
                'sentiment': result.get('sentiment', 'neutral'),
                'score': float(result.get('score', 0.0))
            }
        except Exception as e:
            print(f"Error analyzing sentiment: {e}")
            return {'sentiment': 'neutral', 'score': 0.0}
    
    async def analyze_batch_sentiment(
        self,
        comments: List[Dict[str, Any]],
        batch_size: int = 20
    ) -> List[Dict[str, Any]]:
        """Analyze sentiment for a batch of comments."""
        results = []
        
        for i in range(0, len(comments), batch_size):
            batch = comments[i:i + batch_size]
            batch_texts = [f"{j+1}. {c['text'][:200]}" for j, c in enumerate(batch)]
            
            prompt = f"""Analyze the sentiment of these YouTube comments.

Comments:
{chr(10).join(batch_texts)}

Respond ONLY with a JSON array (no markdown, no code blocks):
[{{"id": 1, "sentiment": "positive/neutral/negative", "score": -1.0 to 1.0}}, ...]"""

            try:
                response = self.model.generate_content(prompt)
                result_text = response.text.strip()
                
                # Clean up response
                if result_text.startswith('```'):
                    result_text = result_text.split('```')[1]
                    if result_text.startswith('json'):
                        result_text = result_text[4:]
                
                batch_results = json.loads(result_text)
                
                for j, comment in enumerate(batch):
                    if j < len(batch_results):
                        results.append({
                            'comment_id': comment['comment_id'],
                            'sentiment': batch_results[j].get('sentiment', 'neutral'),
                            'score': float(batch_results[j].get('score', 0.0))
                        })
                    else:
                        results.append({
                            'comment_id': comment['comment_id'],
                            'sentiment': 'neutral',
                            'score': 0.0
                        })
            except Exception as e:
                print(f"Error in batch sentiment: {e}")
                # Fill with neutral for failed batch
                for comment in batch:
                    results.append({
                        'comment_id': comment['comment_id'],
                        'sentiment': 'neutral',
                        'score': 0.0
                    })
        
        return results
    
    async def generate_tags(self, text: str) -> List[str]:
        """Generate relevant tags for a comment."""
        prompt = f"""Analyze this YouTube comment and assign relevant tags.

Comment: "{text}"

Available tags:
- viral_moment: Content that could go viral
- new_opportunity: Business or collaboration opportunity
- content_goldmine: Ideas for new content
- urgent_response: Needs immediate attention
- collaboration: Collaboration request
- feedback: Constructive feedback
- question: Question from viewer
- appreciation: Positive appreciation

Respond ONLY with a JSON array of applicable tag names (no markdown):
["tag1", "tag2"]

If no tags apply, respond with: []"""

        try:
            response = self.model.generate_content(prompt)
            result_text = response.text.strip()
            
            # Clean up response
            if result_text.startswith('```'):
                result_text = result_text.split('```')[1]
                if result_text.startswith('json'):
                    result_text = result_text[4:]
            
            tags = json.loads(result_text)
            return tags if isinstance(tags, list) else []
        except Exception as e:
            print(f"Error generating tags: {e}")
            return []
    
    async def analyze_batch_tags(
        self,
        comments: List[Dict[str, Any]],
        batch_size: int = 10
    ) -> List[Dict[str, Any]]:
        """Generate tags for a batch of comments."""
        results = []
        
        for i in range(0, len(comments), batch_size):
            batch = comments[i:i + batch_size]
            batch_texts = [f"{j+1}. {c['text'][:200]}" for j, c in enumerate(batch)]
            
            prompt = f"""Analyze these YouTube comments and assign relevant tags to each.

Comments:
{chr(10).join(batch_texts)}

Available tags: viral_moment, new_opportunity, content_goldmine, urgent_response, collaboration, feedback, question, appreciation

Respond ONLY with a JSON array (no markdown):
[{{"id": 1, "tags": ["tag1", "tag2"]}}, ...]

Assign [] if no tags apply."""

            try:
                response = self.model.generate_content(prompt)
                result_text = response.text.strip()
                
                # Clean up response
                if result_text.startswith('```'):
                    result_text = result_text.split('```')[1]
                    if result_text.startswith('json'):
                        result_text = result_text[4:]
                
                batch_results = json.loads(result_text)
                
                for j, comment in enumerate(batch):
                    if j < len(batch_results):
                        results.append({
                            'comment_id': comment['comment_id'],
                            'tags': batch_results[j].get('tags', [])
                        })
                    else:
                        results.append({
                            'comment_id': comment['comment_id'],
                            'tags': []
                        })
            except Exception as e:
                print(f"Error in batch tags: {e}")
                for comment in batch:
                    results.append({
                        'comment_id': comment['comment_id'],
                        'tags': []
                    })
        
        return results
    
    async def chat_with_comments(
        self,
        question: str,
        comments_context: List[Dict[str, Any]],
        channel_name: str
    ) -> str:
        """Answer questions about comments using AI."""
        # Prepare context
        comments_text = "\n".join([
            f"- {c['text'][:150]} (sentiment: {c.get('sentiment', 'unknown')}, likes: {c.get('like_count', 0)})"
            for c in comments_context[:50]  # Limit context
        ])
        
        prompt = f"""You are an AI assistant helping analyze YouTube comments for the channel "{channel_name}".

Here are some recent comments:
{comments_text}

User question: {question}

Provide a helpful, concise answer based on the comments. If the question cannot be answered from the available data, say so politely."""

        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error in chat: {e}")
            return "I apologize, but I encountered an error processing your question. Please try again."


# Singleton instance
gemini_service = GeminiService()
