from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    AES_SECRET_KEY: str
    JWT_ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_DAYS: int

    class Config:
        env_file = ".env"

settings = Settings()