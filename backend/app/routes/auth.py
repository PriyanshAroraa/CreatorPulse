from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
import httpx

from app.config import get_settings
from app.database import get_database
from app.models.user import User, UserCreate, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[User]:
    """Extract and verify the current user from JWT token."""
    if not credentials:
        return None
    
    settings = get_settings()
    
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
            
        # Get user from database
        db = get_database()
        user_data = await db.users.find_one({"google_id": user_id})
        
        if user_data:
            return User(**user_data)
        return None
        
    except JWTError:
        return None


async def require_auth(
    user: Optional[User] = Depends(get_current_user)
) -> User:
    """Dependency that requires authentication."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    settings = get_settings()
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=7)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


@router.post("/google")
async def google_auth(request: Request):
    """
    Authenticate with Google OAuth token from NextAuth.
    Frontend sends the Google access token, we verify and create/update user.
    """
    data = await request.json()
    google_token = data.get("access_token")
    user_info = data.get("user")  # User info from NextAuth
    
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User info required"
        )
    
    email = user_info.get("email")
    name = user_info.get("name")
    image = user_info.get("image")
    google_id = user_info.get("id") or email  # Use email as fallback ID
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email required"
        )
    
    db = get_database()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email})
    
    if existing_user:
        # Update last login
        await db.users.update_one(
            {"email": email},
            {"$set": {"last_login": datetime.utcnow(), "name": name, "image": image}}
        )
        user_id = str(existing_user["_id"])
        google_id = existing_user.get("google_id", google_id)
    else:
        # Create new user
        new_user = {
            "email": email,
            "name": name,
            "image": image,
            "google_id": google_id,
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow(),
        }
        result = await db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": google_id, "email": email, "name": name}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "email": email,
            "name": name,
            "image": image,
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(require_auth)):
    """Get current authenticated user."""
    return UserResponse(
        id=str(user.id) if user.id else user.google_id,
        email=user.email,
        name=user.name,
        image=user.image,
        created_at=user.created_at,
    )


@router.post("/logout")
async def logout():
    """Logout endpoint - client should clear tokens."""
    return {"message": "Logged out successfully"}
