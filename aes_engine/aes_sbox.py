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
                # Dukungan untuk key 'sbox44' maupun 'sbox'
                sbox_values = data.get('sbox44') or data.get('sbox')
                if not sbox_values:
                    raise KeyError("sbox44/sbox")
                if len(sbox_values) != 256:
                    raise ValueError("S-box harus berisi 256 nilai.")
                return sbox_values
        except FileNotFoundError:
            raise Exception(f"Error: File sbox44.json tidak ditemukan di {json_path}")
        except KeyError:
            raise Exception("Error: Format JSON salah. Harus ada key 'sbox44' atau 'sbox'.")