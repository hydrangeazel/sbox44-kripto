# aes_engine/modes.py

import os
from .aes_standard import AES
from .aes_sbox import AESSbox44

class AESModes:
    def __init__(self, key, use_sbox44=False):
        """
        Wrapper untuk menangani Mode Operasi (ECB/CBC) dan Padding.
        :param key: Kunci (bytes atau string)
        :param use_sbox44: Boolean, jika True pakai S-box custom.
        """
        # Konversi key ke bytes jika inputnya string
        if isinstance(key, str):
            key = key.encode('utf-8')
            
        # Pastikan key 16 bytes (simple fix: potong atau padding nol)
        if len(key) > 16:
            key = key[:16]
        elif len(key) < 16:
            key = key.ljust(16, b'\0')

        self.key = key
        
        # Pilih Engine: Standar atau Sbox44
        if use_sbox44:
            self.engine = AESSbox44(key)
        else:
            self.engine = AES(key)

    # --- PADDING (PKCS7) ---
    def _pad(self, data):
        """Menambahkan padding agar panjang data kelipatan 16 byte."""
        block_size = 16
        padding_len = block_size - (len(data) % block_size)
        padding = bytes([padding_len] * padding_len)
        return data + padding

    def _unpad(self, data):
        """Menghapus padding setelah dekripsi."""
        padding_len = data[-1]
        # Validasi padding
        if padding_len < 1 or padding_len > 16:
            # Jika padding rusak, kembalikan raw data (untuk debug)
            return data
        return data[:-padding_len]

    # --- ECB MODE ---
    def encrypt_ecb(self, plaintext):
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
            
        padded_text = self._pad(plaintext)
        ciphertext = b""
        
        # Potong per 16 byte dan enkripsi independen
        for i in range(0, len(padded_text), 16):
            block = padded_text[i : i+16]
            ciphertext += self.engine.encrypt_block(block)
            
        return ciphertext

    def decrypt_ecb(self, ciphertext):
        if len(ciphertext) % 16 != 0:
            raise ValueError("Ciphertext length must be multiple of 16.")
            
        decrypted_data = b""
        for i in range(0, len(ciphertext), 16):
            block = ciphertext[i : i+16]
            decrypted_data += self.engine.decrypt_block(block)
            
        return self._unpad(decrypted_data)

    # --- CBC MODE ---
    def encrypt_cbc(self, plaintext, iv):
        """
        Encrypt dengan CBC Mode.
        Butuh IV (Initialization Vector) 16 bytes.
        """
        if isinstance(plaintext, str):
            plaintext = plaintext.encode('utf-8')
        if isinstance(iv, str):
            iv = iv.encode('utf-8')
            
        if len(iv) != 16:
            raise ValueError("IV must be 16 bytes.")

        padded_text = self._pad(plaintext)
        ciphertext = b""
        prev_block = iv # Blok sebelumnya dimulai dengan IV
        
        for i in range(0, len(padded_text), 16):
            curr_block = padded_text[i : i+16]
            
            # XOR dengan blok ciphertext sebelumnya (atau IV)
            xor_block = bytes([b ^ p for b, p in zip(curr_block, prev_block)])
            
            # Enkripsi hasil XOR
            encrypted_block = self.engine.encrypt_block(xor_block)
            
            ciphertext += encrypted_block
            prev_block = encrypted_block # Update prev_block
            
        return ciphertext

    def decrypt_cbc(self, ciphertext, iv):
        if isinstance(iv, str):
            iv = iv.encode('utf-8')
        if len(ciphertext) % 16 != 0:
            raise ValueError("Ciphertext length must be multiple of 16.")
        if len(iv) != 16:
            raise ValueError("IV must be 16 bytes.")

        decrypted_data = b""
        prev_block = iv
        
        for i in range(0, len(ciphertext), 16):
            curr_block = ciphertext[i : i+16]
            
            # Decrypt blok sekarang
            decrypted_block_raw = self.engine.decrypt_block(curr_block)
            
            # XOR dengan ciphertext sebelumnya (atau IV) untuk dapat plaintext
            plaintext_block = bytes([b ^ p for b, p in zip(decrypted_block_raw, prev_block)])
            
            decrypted_data += plaintext_block
            prev_block = curr_block # Simpan ciphertext asli untuk iterasi berikutnya
            
        return self._unpad(decrypted_data)