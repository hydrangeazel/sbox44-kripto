import base64
import json
from pathlib import Path
from typing import Iterable, List

from Crypto.Random import get_random_bytes

ASSETS_DIR = Path(__file__).resolve().parents[1] / "assets"
SBOX_FILE = ASSETS_DIR / "sbox44.json"


def ensure_key_bytes(key: str) -> bytes:
    if len(key) != 16:
        raise ValueError("Kunci AES wajib 16 karakter (AES-128).")
    return key.encode("utf-8")


def generate_nonce(size: int = 8) -> bytes:
    return get_random_bytes(size)


def chunk_bytes(data: bytes, size: int) -> List[bytes]:
    return [data[i : i + size] for i in range(0, len(data), size)]


def b64_encode(data: bytes) -> str:
    return base64.b64encode(data).decode("utf-8")


def b64_decode(data: str) -> bytes:
    return base64.b64decode(data.encode("utf-8"))


def load_sbox() -> List[int]:
    with SBOX_FILE.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload["sbox44"]


def build_inverse_sbox(sbox: Iterable[int]) -> List[int]:
    inverse = [0] * 256
    for idx, value in enumerate(sbox):
        inverse[value] = idx
    return inverse


def apply_sbox(data: bytes, table: List[int]) -> bytes:
    return bytes(table[byte] for byte in data)
