# analytics/to.py

import numpy as np

def calc_to_measure(sbox):
    """
    Transparency Order (TO)
    Implementasi berdasarkan definisi Berta et al., 2014.
    Input:
        sbox -> array/list 256 elemen, nilai 0–255 (8-bit)
    Output:
        nilai Transparency Order (semakin kecil semakin baik)
    """

    # pastikan array numpy
    sbox = np.array(sbox, dtype=np.uint8)

    # Precompute Hamming weight 0–255
    HW = np.unpackbits(np.arange(256, dtype=np.uint8)[:, None], axis=1).sum(axis=1)

    max_val = 0.0
    for a in range(1, 256):        # mask input ≠ 0
        for b in range(1, 256):    # mask output ≠ 0
            total = 0.0
            for x in range(256):
                x1 = x
                x2 = x ^ a

                y1 = sbox[x1]
                y2 = sbox[x2]

                # Hamming Weight leakage model
                leak = HW[y1] ^ (b & 0xFF)  # XOR correlated leakage
                total += ((HW[y2] - HW[y1]) * leak)

            val = abs(total) / 256.0
            max_val = max(max_val, val)

    return float(max_val)