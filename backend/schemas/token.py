from pydantic import BaseModel, EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class EncryptedToken(BaseModel):
    encrypted_access_token: str

class LoginRequest(BaseModel):
    email: EmailStr
    encrypted_password: str  # Теперь пароль приходит зашифрованным
    client_public_key: str

class HybridEncryptedToken(BaseModel):
    encrypted_key: str  # RSA-зашифрованный ключ AES
    encrypted_data: str # AES-зашифрованный JWT

class TokenData(BaseModel):
    username: str | None = None