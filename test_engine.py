# test_engine.py (File untuk testing internal Person 1)

import os
import sys

# Memastikan Python bisa menemukan folder aes_engine & analytics
sys.path.append(os.getcwd())

from aes_engine.modes import AESModes
from aes_engine.utils import SBOX
from analytics.nl import calc_nl_measure
from analytics.sac import calc_sac_measure
from analytics.bicnl import calc_bic_nl_measure
from analytics.bicsac import calc_bic_sac_measure
from analytics.lap import calc_lap_measure
from analytics.dap import calc_dap_measure

def test_encryption_flow():
    print("="*50)
    print("🚀 MULAI TEST ENKRIPSI & DEKRIPSI")
    print("="*50)

    key = "kuncirahasia1234" # 16 bytes
    plaintext = "Halo, ini adalah percobaan enkripsi Person 1."
    
    # --- TEST 1: AES Standar (ECB) ---
    print("\n[1] Testing AES STANDAR (ECB Mode)...")
    cipher = AESModes(key, use_sbox44=False)
    encrypted = cipher.encrypt_ecb(plaintext)
    decrypted = cipher.decrypt_ecb(encrypted).decode('utf-8')
    
    print(f" -> Plaintext: {plaintext}")
    print(f" -> Encrypted (Hex): {encrypted.hex()[:32]}...") # Tampilkan sebagian
    print(f" -> Decrypted: {decrypted}")
    
    if plaintext == decrypted:
        print(" ✅ SUCCESS: Dekripsi cocok dengan Plaintext!")
    else:
        print(" ❌ FAILED: Dekripsi gagal!")

    # --- TEST 2: AES S-box44 (Custom) ---
    print("\n[2] Testing AES S-BOX 44 (CBC Mode)...")
    try:
        # Mode CBC butuh IV
        iv = "vektorinisial123" 
        cipher_custom = AESModes(key, use_sbox44=True)
        
        encrypted_custom = cipher_custom.encrypt_cbc(plaintext, iv)
        decrypted_custom = cipher_custom.decrypt_cbc(encrypted_custom, iv).decode('utf-8')
        
        print(f" -> Plaintext: {plaintext}")
        print(f" -> Encrypted (Hex): {encrypted_custom.hex()[:32]}...")
        print(f" -> Decrypted: {decrypted_custom}")
        
        if plaintext == decrypted_custom:
            print(" ✅ SUCCESS: Dekripsi S-box44 cocok!")
        else:
            print(" ❌ FAILED: Dekripsi S-box44 gagal!")
            
    except Exception as e:
        print(f" ❌ ERROR pada S-box44: {e}")
        print("    (Pastikan file assets/sbox44.json sudah ada dan formatnya benar)")

def test_analytics():
    print("\n" + "="*50)
    print("📊 MULAI TEST ANALYTICS (Kalkulasi S-box Standar)")
    print("="*50)
    
    # Kita test pakai SBOX standar dulu sebagai sampel
    # (Nanti Person 2 akan menghubungkan ini ke Sbox44 di UI)
    target_sbox = SBOX 
    
    print("Sedang menghitung... (mungkin butuh beberapa detik)")
    
    try:
        nl_val = calc_nl_measure(target_sbox)
        print(f" [1] NL (Non-Linearity): {nl_val} (Standar AES biasanya 112)")
        
        sac_val = calc_sac_measure(target_sbox)
        print(f" [2] SAC: {sac_val:.5f} (Ideal ~0.5)")
        
        bic_nl_val = calc_bic_nl_measure(target_sbox)
        print(f" [3] BIC-NL: {bic_nl_val}")
        
        bic_sac_val = calc_bic_sac_measure(target_sbox)
        print(f" [4] BIC-SAC: {bic_sac_val:.5f}")
        
        lap_val = calc_lap_measure(target_sbox)
        print(f" [5] LAP (Linear Prob): {lap_val:.5f}")
        
        dap_val = calc_dap_measure(target_sbox)
        print(f" [6] DAP (Diff Prob): {dap_val:.5f}")
        
        print("\n ✅ SEMUA FUNGSI ANALYTICS BERJALAN TANPA ERROR!")
        
    except Exception as e:
        print(f"\n ❌ ERROR pada Analytics: {e}")

if __name__ == "__main__":
    test_encryption_flow()
    test_analytics()