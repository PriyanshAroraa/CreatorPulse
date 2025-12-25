from fastapi import APIRouter, Request, HTTPException, Depends
from typing import Optional
import hmac
import hashlib
import json

from app.database import get_database
from app.config import get_settings
from app.routes.auth import get_current_user
from app.models.user import User

router = APIRouter()
settings = get_settings()


@router.post("/dodo")
async def dodo_webhook(request: Request):
    """Handle Dodo Payments webhook events."""
    db = get_database()
    
    # Get raw body for signature verification
    body = await request.body()
    
    # Verify webhook signature if secret is configured
    if settings.dodo_webhook_secret:
        signature = request.headers.get("x-dodo-signature", "")
        expected_sig = hmac.new(
            settings.dodo_webhook_secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(signature, expected_sig):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Parse event
    try:
        event = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    
    event_type = event.get("type", "")
    data = event.get("data", {})
    
    print(f"📨 Dodo webhook received: {event_type}")
    
    # Handle subscription events
    if event_type == "subscription.active":
        # User subscribed successfully
        customer_email = data.get("customer", {}).get("email")
        subscription_id = data.get("subscription_id")
        
        if customer_email:
            # Update user subscription status
            result = await db.users.update_one(
                {"email": customer_email},
                {
                    "$set": {
                        "subscription_status": "active",
                        "subscription_id": subscription_id,
                        "subscription_plan": "pro",
                        "max_channels": 5
                    }
                }
            )
            print(f"✅ User {customer_email} subscribed! (matched: {result.matched_count})")
    
    elif event_type == "subscription.cancelled":
        customer_email = data.get("customer", {}).get("email")
        
        if customer_email:
            await db.users.update_one(
                {"email": customer_email},
                {
                    "$set": {
                        "subscription_status": "cancelled",
                        "subscription_plan": "free",
                        "max_channels": 1
                    }
                }
            )
            print(f"❌ User {customer_email} subscription cancelled")
    
    elif event_type == "subscription.expired":
        customer_email = data.get("customer", {}).get("email")
        
        if customer_email:
            await db.users.update_one(
                {"email": customer_email},
                {
                    "$set": {
                        "subscription_status": "expired",
                        "subscription_plan": "free",
                        "max_channels": 1
                    }
                }
            )
            print(f"⏰ User {customer_email} subscription expired")
    
    return {"received": True}


@router.get("/subscription/status")
async def get_subscription_status(user: Optional[User] = Depends(get_current_user)):
    """Get current user's subscription status."""
    if not user:
        return {
            "status": "free",
            "plan": "free",
            "max_channels": 1,
            "authenticated": False
        }
    
    db = get_database()
    user_data = await db.users.find_one({"google_id": user.google_id})
    
    if not user_data:
        return {
            "status": "free",
            "plan": "free", 
            "max_channels": 1,
            "authenticated": True
        }
    
    return {
        "status": user_data.get("subscription_status", "free"),
        "plan": user_data.get("subscription_plan", "free"),
        "max_channels": user_data.get("max_channels", 1),
        "authenticated": True
    }


@router.post("/checkout/create")
async def create_checkout(request: Request, user: Optional[User] = Depends(get_current_user)):
    """Create a Dodo Payments checkout session."""
    db = get_database()
    
    email = None
    
    # Try to get email from authenticated user
    if user:
        user_data = await db.users.find_one({"google_id": user.google_id})
        if user_data:
            email = user_data.get('email', '')
    
    # Fallback: try to get email from request body
    if not email:
        try:
            body = await request.json()
            email = body.get('email', '')
        except:
            pass
    
    if not email:
        raise HTTPException(status_code=401, detail="Authentication required - please provide email")
    
    # Return checkout URL with prefilled email
    checkout_url = f"https://checkout.dodopayments.com/buy/{settings.dodo_product_id}?email={email}"
    
    return {"checkout_url": checkout_url}
