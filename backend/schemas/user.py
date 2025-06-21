import hashlib
from pydantic import BaseModel, EmailStr, computed_field

class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserRegisterRequest(UserBase):
    encrypted_password: str

class User(UserBase):
    id: int
    is_superuser: bool

    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.email:
            return None
        
        clean_email = self.email.lower().strip()
        hash_val = hashlib.md5(clean_email.encode('utf-8')).hexdigest()
        return f"https://www.gravatar.com/avatar/{hash_val}?d=identicon&s=512"

    class Config:
        from_attributes = True