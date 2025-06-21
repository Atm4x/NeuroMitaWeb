from fastapi import FastAPI, Request, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.security import SERVER_PUBLIC_KEY_PEM

from db.session import Base, engine
from api import users, prompts, admin 
from api.users import limiter

# Создание таблиц в БД при запуске
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Neuromita Backend")

# Подключение обработчика для лимита запросов
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Настройка CORS
origins = [
    "http://localhost:12009", # Порт вашего Vite-сервера
    "http://127.0.0.1:12009",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

auth_router = APIRouter()

@auth_router.get("/public-key")
def get_server_public_key():
    return {"public_key": SERVER_PUBLIC_KEY_PEM}

# Подключение роутеров
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"]) # Новый роутер
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(prompts.router, prefix="/api/prompts", tags=["Prompts"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Neuromita API"}