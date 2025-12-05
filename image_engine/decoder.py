# image_engine/decoder.py

from PIL import Image
import numpy as np
from aes_engine.modes import AESModes


def decrypt_image(encrypted_image, key, use_sbox44=False, mode='ECB', iv=None):
    """
    Mendekripsi gambar yang terenkripsi menggunakan AES.
    
    :param encrypted_image: PIL Image object yang terenkripsi
    :param key: String key (16 karakter)
    :param use_sbox44: Boolean, True jika menggunakan S-box44
    :param mode: 'ECB' atau 'CBC'
    :param iv: Initialization Vector untuk CBC mode (16 karakter)
    :return: PIL Image object yang didekripsi
    """
    # Konversi gambar ke numpy array
    img_array = np.array(encrypted_image)
    original_shape = img_array.shape
    
    # Flatten array menjadi 1D
    flat_array = img_array.flatten()
    
    # Konversi ke bytes
    img_bytes = flat_array.tobytes()
    
    # Inisialisasi cipher
    cipher = AESModes(key, use_sbox44=use_sbox44)
    
    # Dekripsi
    if mode == 'ECB':
        decrypted_bytes = cipher.decrypt_ecb(img_bytes)
    elif mode == 'CBC':
        if iv is None:
            raise ValueError("IV diperlukan untuk mode CBC")
        decrypted_bytes = cipher.decrypt_cbc(img_bytes, iv)
    else:
        raise ValueError(f"Mode {mode} tidak didukung")
    
    # Pastikan panjang decrypted_bytes sesuai dengan yang diharapkan
    expected_size = len(img_bytes)
    if len(decrypted_bytes) > expected_size:
        # Ambil hanya bytes yang sesuai dengan ukuran asli
        decrypted_bytes = decrypted_bytes[:expected_size]
    
    # Konversi kembali ke numpy array
    decrypted_array = np.frombuffer(decrypted_bytes, dtype=img_array.dtype)
    
    # Reshape ke bentuk asli
    decrypted_array = decrypted_array.reshape(original_shape)
    
    # Konversi kembali ke PIL Image
    decrypted_image = Image.fromarray(decrypted_array)
    
    return decrypted_image
