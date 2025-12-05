# image_engine/encoder.py

from PIL import Image
import numpy as np
from aes_engine.modes import AESModes


def encrypt_image(image, key, use_sbox44=False, mode='ECB', iv=None):
    """
    Mengenkripsi gambar menggunakan AES.
    
    :param image: PIL Image object
    :param key: String key (16 karakter)
    :param use_sbox44: Boolean, True untuk menggunakan S-box44
    :param mode: 'ECB' atau 'CBC'
    :param iv: Initialization Vector untuk CBC mode (16 karakter)
    :return: PIL Image object yang terenkripsi
    """
    # Konversi gambar ke numpy array
    img_array = np.array(image)
    original_shape = img_array.shape
    
    # Flatten array menjadi 1D
    flat_array = img_array.flatten()
    
    # Konversi ke bytes
    img_bytes = flat_array.tobytes()
    
    # Inisialisasi cipher
    cipher = AESModes(key, use_sbox44=use_sbox44)
    
    # Enkripsi
    if mode == 'ECB':
        encrypted_bytes = cipher.encrypt_ecb(img_bytes)
    elif mode == 'CBC':
        if iv is None:
            raise ValueError("IV diperlukan untuk mode CBC")
        encrypted_bytes = cipher.encrypt_cbc(img_bytes, iv)
    else:
        raise ValueError(f"Mode {mode} tidak didukung")
    
    # Pastikan panjang encrypted_bytes sesuai dengan yang diharapkan
    # Jika lebih panjang karena padding, potong sesuai ukuran asli
    expected_size = len(img_bytes)
    if len(encrypted_bytes) > expected_size:
        # Ambil hanya bytes yang sesuai dengan ukuran asli
        encrypted_bytes = encrypted_bytes[:expected_size]
    
    # Konversi kembali ke numpy array
    encrypted_array = np.frombuffer(encrypted_bytes, dtype=img_array.dtype)
    
    # Reshape ke bentuk asli
    encrypted_array = encrypted_array.reshape(original_shape)
    
    # Konversi kembali ke PIL Image
    encrypted_image = Image.fromarray(encrypted_array)
    
    return encrypted_image
