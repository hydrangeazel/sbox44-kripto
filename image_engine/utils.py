# image_engine/utils.py

from PIL import Image
import numpy as np


def image_to_bytes(image):
    """
    Mengkonversi PIL Image ke bytes.
    
    :param image: PIL Image object
    :return: bytes representation dari gambar
    """
    img_array = np.array(image)
    return img_array.tobytes()


def bytes_to_image(data_bytes, shape, dtype=np.uint8):
    """
    Mengkonversi bytes kembali ke PIL Image.
    
    :param data_bytes: bytes data
    :param shape: Tuple bentuk array asli (height, width, channels)
    :param dtype: Data type untuk array
    :return: PIL Image object
    """
    img_array = np.frombuffer(data_bytes, dtype=dtype)
    img_array = img_array.reshape(shape)
    return Image.fromarray(img_array)


def validate_image_size(image, max_size_mb=10):
    """
    Memvalidasi ukuran gambar.
    
    :param image: PIL Image object
    :param max_size_mb: Ukuran maksimum dalam MB
    :return: Boolean, True jika valid
    """
    # Hitung ukuran dalam bytes
    img_array = np.array(image)
    size_bytes = img_array.nbytes
    
    # Konversi ke MB
    size_mb = size_bytes / (1024 * 1024)
    
    return size_mb <= max_size_mb
