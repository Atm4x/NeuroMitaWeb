from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from urllib.parse import unquote_plus # +++ ИМПОРТИРУЕМ ФУНКЦИЮ РАСКОДИРОВАНИЯ +++
from schemas.token import LoginRequest, HybridEncryptedToken
from schemas.token import LoginRequest, EncryptedToken
from schemas import user as user_schemas
from crud import crud_user
from core import security
from . import deps

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

@router.post("/register", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register_user(
    request: Request, 
    user_data: user_schemas.UserRegisterRequest,
    db: Session = Depends(deps.get_db)
):
    if crud_user.get_user_by_email(db, email=user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if crud_user.get_user_by_username(db, username=user_data.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    try:
        # --- УБИРАЕМ unquote_plus, РАСШИФРОВЫВАЕМ НАПРЯМУЮ ---
        decrypted_password = security.decrypt_with_server_private_key(
            encrypted_data_b64=user_data.encrypted_password
        ).decode('utf-8')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid password encryption format.")

    user_to_create = user_schemas.UserCreate(
        email=user_data.email,
        username=user_data.username,
        password=decrypted_password
    )
    
    return crud_user.create_user(db=db, user=user_to_create)


@router.post("/login", response_model=HybridEncryptedToken)
@limiter.limit("10/minute")
def login_for_access_token(
    request: Request,
    login_data: LoginRequest, 
    db: Session = Depends(deps.get_db)
):
    try:
        decrypted_password = security.decrypt_with_server_private_key(
            encrypted_data_b64=login_data.encrypted_password
        ).decode('utf-8')
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid password encryption format.")

    user = crud_user.get_user_by_email(db, email=login_data.email)
    if not user or not security.verify_password(decrypted_password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    # Создаем JWT
    access_token_jwt = security.create_access_token(data={"sub": user.username})
    
    # Создаем гибридно-зашифрованный ответ
    try:
        encrypted_response = security.create_hybrid_encrypted_response(
            data_str=access_token_jwt,
            client_public_key_pem=login_data.client_public_key
        )
        return encrypted_response
    except Exception as e:
        print(f"Hybrid encryption failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid client public key format")


@router.get("/me", response_model=user_schemas.User)
def read_users_me(current_user: user_schemas.User = Depends(deps.get_current_user)):
    return current_user