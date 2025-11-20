# aes_engine/aes_sbox.py
import json
import os
from aes_engine.aes_standard import AES

class AESSbox44(AES):
    def __init__(self, key):
        """
        Kelas khusus untuk AES dengan S-box 44.
        Otomatis meload file JSON saat kelas dipanggil.
        """
        sbox44 = self._load_sbox44()
        
        # Panggil inisialisasi AES standard, tapi suply dengan sbox44
        # Ini akan otomatis me-replace logika SubBytes di engine utama
        super().__init__(key, sbox=sbox44)

    def _load_sbox44(self):
        # Cari lokasi file json secara dinamis agar tidak error path
        current_dir = os.path.dirname(os.path.abspath(__file__))
        # Mundur satu folder ke root, lalu masuk assets
        json_path = os.path.join(current_dir, '..', 'assets', 'sbox44.json')
        
        try:
            with open(json_path, 'r') as f:
                data = json.load(f)
                # Pastikan key di JSON namanya "sbox" sesuai file assets kamu
                return data['sbox'] 
        except FileNotFoundError:
            raise Exception(f"Error: File sbox44.json tidak ditemukan di {json_path}")
        except KeyError:
            raise Exception("Error: Format JSON salah. Harus ada key 'sbox'.")