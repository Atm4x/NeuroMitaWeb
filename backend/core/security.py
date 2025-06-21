import hashlib
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from jose import JWTError, jwt
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.asymmetric import padding as rsa_padding, rsa
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from base64 import b64encode, b64decode

from .config import settings

# --- Константы и пути ---
BASE_DIR = Path(__file__).resolve().parent.parent
KEYS_PATH = BASE_DIR / "keys"
AES_BLOCK_SIZE = 16

# --- Загрузка ключей сервера ---
try:
    with open(KEYS_PATH / "private.pem", "rb") as f:
        private_key_data = f.read()
    SERVER_PRIVATE_KEY = serialization.load_pem_private_key(private_key_data, password=None)
except FileNotFoundError:
    raise RuntimeError("FATAL: private.pem not found.")

try:
    with open(KEYS_PATH / "public.pem", "rb") as f:
        public_key_data = f.read()
    SERVER_PUBLIC_KEY = serialization.load_pem_public_key(public_key_data)
    SERVER_PUBLIC_KEY_PEM = public_key_data.decode('utf-8').replace('\r\n', '\n')
except FileNotFoundError:
    raise RuntimeError("FATAL: public.pem not found.")

# --- Стандартные функции (без изменений) ---
def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, private_key_data, algorithm=settings.JWT_ALGORITHM)

# --- Функции шифрования ---

def decrypt_with_server_private_key(encrypted_data_b64: str) -> bytes:
    """Расшифровывает пароль клиента"""
    encrypted_data = b64decode(encrypted_data_b64)
    return SERVER_PRIVATE_KEY.decrypt(encrypted_data, rsa_padding.PKCS1v15())

def create_hybrid_encrypted_response(data_str: str, client_public_key_pem: str) -> dict:
    # 1. Генерируем одноразовый ключ
    session_key = os.urandom(32)                     # 32 B
    session_key_b64 = b64encode(session_key)         # ← NEW

    iv = os.urandom(16)

    # 2. Шифруем B64-строку ключа
    unclean_key = serialization.load_pem_public_key(client_public_key_pem.encode())
    public_numbers = unclean_key.public_numbers()
    clean_key = rsa.RSAPublicNumbers(public_numbers.e, public_numbers.n).public_key()
    encrypted_session_key = clean_key.encrypt(
        session_key_b64,                             # ← encode уже сделали
        rsa_padding.PKCS1v15()
    )

    # 3. AES-CBC
    cipher = AES.new(session_key, AES.MODE_CBC, iv)
    encrypted_data = cipher.encrypt(pad(data_str.encode(), AES_BLOCK_SIZE))

    # 4. Вернём B64
    return {
        "encrypted_key": b64encode(encrypted_session_key).decode(),
        "encrypted_data": b64encode(iv + encrypted_data).decode()
    }