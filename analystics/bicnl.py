# analytics/bicnl.py

from .nl import fwht, get_bit # Kita gunakan fungsi bantuan dari nl.py

def calc_bic_nl_measure(sbox):
    """
    Menghitung Bit Independence Criterion untuk Non-Linearity (BIC-NL).
    Menguji Non-Linearity dari XOR sum setiap pasang bit output.
    """
    n = 8
    length = 256
    min_nl_bic = 256 # Inisialisasi nilai

    # Iterasi untuk setiap PAIR (pasangan) bit output (j, k)
    # j dari 0-7, k dari j+1 sampai 7 (kombinasi unik)
    for j in range(n):
        for k in range(j + 1, n):
            
            # Buat fungsi boolean f yang merupakan XOR dari bit ke-j dan bit ke-k
            f = [0] * length
            for x in range(length):
                val = sbox[x]
                # XOR antara bit j dan bit k
                bit_j = get_bit(val, j)
                bit_k = get_bit(val, k)
                f[x] = (-1) ** (bit_j ^ bit_k)

            # Hitung NL untuk fungsi gabungan ini pakai Walsh Transform
            walsh_spectrum = fwht(f)
            
            max_walsh = 0
            for w in walsh_spectrum:
                if abs(w) > max_walsh:
                    max_walsh = abs(w)
            
            nl = (1 << (n - 1)) - (max_walsh // 2)
            
            # Kita cari nilai NL terkecil di antara semua pasangan
            if nl < min_nl_bic:
                min_nl_bic = nl

    return min_nl_bic