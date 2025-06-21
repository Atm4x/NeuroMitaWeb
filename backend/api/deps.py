from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from db.session import SessionLocal
from core import security
from core.config import settings
from schemas.token import TokenData
from crud import crud_user
from models.user import User
from core.security import SERVER_PUBLIC_KEY 

# OAuth2 scheme that will look for an Authorization header with a Bearer token
# but we will manually process the token (decrypting it first)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/users/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # The token is no longer encrypted with AES during transport.
    # It's a standard JWT signed by our server. We just need to decode it.
    try:
        payload = jwt.decode(
            token,
            SERVER_PUBLIC_KEY, # Verify with our public key
            algorithms=[settings.JWT_ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = crud_user.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
        
    return user

# +++ НОВАЯ ЗАВИСИМОСТЬ ДЛЯ АДМИНОВ +++
def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Checks if the current user is a superuser.
    If not, raises a 403 Forbidden error.
    """
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user doesn't have enough privileges"
        )
    return current_user