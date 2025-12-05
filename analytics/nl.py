# analytics/nl.py

def fwht(a):
    """
    Fast Walsh-Hadamard Transform.
    Digunakan untuk menghitung korelasi fungsi boolean.
    """
    n = len(a)
    if n == 1:
        return a
    a_left = fwht(a[::2])
    a_right = fwht(a[1::2])
    return [x + y for x, y in zip(a_left, a_right)] + [x - y for x, y in zip(a_left, a_right)]

def get_bit(value, n):
    """Mengambil bit ke-n dari sebuah integer."""
    return (value >> n) & 1

def calc_nl_measure(sbox):
    """
    Menghitung nilai Non-Linearity (NL) dari S-box.
    NL mengukur jarak terpendek ke fungsi affine.
    """
    min_nl = 256  # Inisialisasi dengan nilai besar
    n = 8         # AES S-box 8-bit
    length = 1 << n # 2^8 = 256

    # S-box memiliki 8 output bits. Kita harus cek NL untuk setiap kombinasi output.
    # Namun, standar minimal adalah mengecek 8 fungsi koordinat boolean.
    
    results = []

    # Cek untuk setiap bit output (0 sampai 7)
    for bit in range(8):
        # Buat tabel kebenaran (Truth Table) untuk bit ke-i
        f = [0] * length
        for x in range(length):
            # Sinyal fungsi boolean: 1 -> -1, 0 -> 1 (Standar Walsh)
            bit_val = get_bit(sbox[x], bit)
            f[x] = (-1) ** bit_val

        # Hitung spektrum Walsh
        walsh_spectrum = fwht(f)

        # Cari nilai absolut maksimum di spektrum
        max_walsh = 0
        for w in walsh_spectrum:
            if abs(w) > max_walsh:
                max_walsh = abs(w)

        # Rumus NL = 2^(n-1) - 1/2 * max_walsh
        nl = (1 << (n - 1)) - (max_walsh // 2)
        results.append(nl)

    # Nilai NL dari S-box adalah nilai minimum dari semua komponennya
    return min(results)