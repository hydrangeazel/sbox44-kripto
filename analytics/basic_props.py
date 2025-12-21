# analytics/basic_props.py

def check_sbox_bijective(sbox):
    """
    Memeriksa apakah S-box adalah bijective (permutasi).
    S-box bijective jika setiap nilai output muncul tepat sekali.
    
    Return: (is_bijective: bool, message: str)
    """
    if len(sbox) != 256:
        return False, "S-box harus memiliki 256 elemen"
    
    # Cek apakah semua nilai 0-255 muncul tepat sekali
    seen = set()
    for val in sbox:
        if val < 0 or val > 255:
            return False, f"S-box mengandung nilai di luar range 0-255: {val}"
        if val in seen:
            return False, f"Nilai {val} muncul lebih dari sekali (tidak bijective)"
        seen.add(val)
    
    if len(seen) == 256:
        return True, "S-box adalah permutasi (bijective)"
    else:
        return False, f"S-box tidak lengkap: hanya {len(seen)} dari 256 nilai yang muncul"


def check_sbox_balanced(sbox):
    """
    Memeriksa apakah S-box adalah balanced.
    Untuk S-box 8-bit, balanced berarti setiap nilai output muncul sama sering.
    Untuk permutasi (bijective), ini otomatis terpenuhi.
    
    Return: (is_balanced: bool, message: str)
    """
    if len(sbox) != 256:
        return False, "S-box harus memiliki 256 elemen"
    
    # Hitung frekuensi setiap nilai output
    freq = {}
    for val in sbox:
        freq[val] = freq.get(val, 0) + 1
    
    # Untuk balanced, semua nilai harus muncul dengan frekuensi yang sama
    if len(freq) == 0:
        return False, "S-box kosong"
    
    expected_freq = len(sbox) / len(freq)
    
    # Cek apakah semua frekuensi sama
    frequencies = list(freq.values())
    if all(f == frequencies[0] for f in frequencies):
        return True, f"S-box balanced: setiap nilai output muncul {frequencies[0]} kali"
    else:
        min_freq = min(frequencies)
        max_freq = max(frequencies)
        return False, f"S-box tidak balanced: frekuensi bervariasi dari {min_freq} sampai {max_freq}"


def check_sbox_basic_properties(sbox):
    """
    Memeriksa properti dasar S-box: Bijective dan Balanced.
    
    Return: dict dengan keys:
        - is_bijective: bool
        - is_balanced: bool
        - is_valid: bool (True jika keduanya terpenuhi)
        - bijective_message: str
        - balanced_message: str
    """
    is_bijective, bijective_msg = check_sbox_bijective(sbox)
    is_balanced, balanced_msg = check_sbox_balanced(sbox)
    
    # Untuk permutasi (bijective), balanced otomatis terpenuhi
    # Tapi kita tetap cek keduanya untuk konsistensi
    is_valid = is_bijective and is_balanced
    
    return {
        'is_bijective': is_bijective,
        'is_balanced': is_balanced,
        'is_valid': is_valid,
        'bijective_message': bijective_msg,
        'balanced_message': balanced_msg
    }

