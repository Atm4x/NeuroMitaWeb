import api from './api';
import { JSEncrypt } from 'jsencrypt';
import CryptoJS from 'crypto-js';

/* ----------  helpers  ---------- */
const u8ToWordArray = (u8) => {
  const words = [];
  for (let i = 0; i < u8.length; i++) {
    words[i >>> 2] |= u8[i] << (24 - (i % 4) * 8);
  }
  return CryptoJS.lib.WordArray.create(words, u8.length);
};
const b64ToU8 = (b64) => Uint8Array.from(atob(b64), c => c.charCodeAt(0));

/* ----------  public-key cache  ---------- */
let serverPub = null;
const getServerPub = async () => {
  if (serverPub) return serverPub;
  const { data } = await api.get('/auth/public-key');
  if (!data?.public_key) throw new Error('no pubkey from server');
  serverPub = data.public_key;
  return serverPub;
};
const rsaEncryptWithServer = async (plain) => {
  const pub = await getServerPub();
  const enc = new JSEncrypt();
  enc.setPublicKey(pub);
  const out = enc.encrypt(plain);
  if (!out) throw new Error('RSA encrypt failed');
  return out;
};

/* ----------  register  ---------- */
export const register = async (username, email, password) => {
  const encrypted_password = await rsaEncryptWithServer(password);
  await api.post('/users/register', { username, email, encrypted_password });
};

/* ----------  login  ---------- */
export const login = async (email, password) => {
  /* 1. RSA-шифруем пароль */
  const encPass = await rsaEncryptWithServer(password);

  /* 2. Генерируем свою RSA-пару */
  const rsa = new JSEncrypt({ default_key_size: 2048 });
  rsa.getKey();
  const priv = rsa.getPrivateKey();
  const pub  = rsa.getPublicKey();

  /* 3. Логинимся */
  const { data } = await api.post('/users/login', {
    email,
    encrypted_password: encPass,
    client_public_key: pub,
  });
  const { encrypted_key, encrypted_data } = data;

  /* 4. Расшифровываем B64-строку ключа */
  rsa.setPrivateKey(priv);
  const sessionKeyB64 = rsa.decrypt(encrypted_key);        // ← уже ТЕКСТ
  if (!sessionKeyB64) throw new Error('RSA decrypt failed');
  const aesKeyBytes = b64ToU8(sessionKeyB64);              // 32 B
  const aesKeyWA    = u8ToWordArray(aesKeyBytes);

  /* 5. IV + ciphertext */
  const blob   = b64ToU8(encrypted_data);
  const iv     = u8ToWordArray(blob.slice(0, 16));
  const cipher = u8ToWordArray(blob.slice(16));

  /* 6. AES-CBC-PKCS7 */
  const clear = CryptoJS.AES.decrypt({ ciphertext: cipher }, aesKeyWA, {
    iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7
  });

  const jwt = clear.toString(CryptoJS.enc.Utf8);
  if (!jwt) throw new Error('AES decrypt produced empty string');

  localStorage.setItem('jwt_token', jwt);
  return true;
};

/* ----------  misc  ---------- */
export const logout = () => {
  serverPub = null;
  localStorage.removeItem('jwt_token');
};
export const isAuthenticated = () => Boolean(localStorage.getItem('jwt_token'));
export const getCurrentUser  = () => api.get('/users/me');