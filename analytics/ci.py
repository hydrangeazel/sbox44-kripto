# analytics/ci.py

from .nl import fwht, get_bit

def calc_ci_measure(sbox):
    """
    Menghitung Correlation Immunity (CI) order.
    CI mengukur sejauh mana output S-box tidak berkorelasi dengan subset input.
    
    Untuk S-box 8-bit, kita menghitung order correlation immunity minimum
    di antara semua bit output.
    
    Order m berarti output tidak berkorelasi dengan subset m input bits.
    
    Return: order correlation immunity (integer, 0-8)
    Semakin tinggi order, semakin baik.
    """
    n = 8
    size = 256
    
    # Untuk setiap bit output (0-7), kita cek correlation immunity-nya
    min_order = n  # Inisialisasi dengan nilai maksimum
    
    for output_bit in range(n):
        # Buat truth table untuk bit output ke-i
        truth_table = []
        for x in range(size):
            val = get_bit(sbox[x], output_bit)
            truth_table.append(val)
        
        # Cek correlation immunity order untuk fungsi ini
        order = check_correlation_immunity_order(truth_table, n)
        
        # Ambil order minimum di antara semua bit output
        if order < min_order:
            min_order = order
    
    return min_order


def check_correlation_immunity_order(truth_table, n):
    """
    Cek correlation immunity order untuk sebuah fungsi boolean.
    
    Fungsi f adalah m-th order correlation immune jika:
    - Untuk setiap subset S dari input dengan |S| <= m,
    - Output f tidak berkorelasi dengan kombinasi linear dari bits di S.
    
    Kita menggunakan Walsh transform untuk mengecek korelasi.
    Jika Walsh coefficient untuk mask dengan Hamming weight <= m adalah 0,
    maka fungsi adalah m-th order correlation immune.
    """
    size = len(truth_table)
    
    # Konversi truth table ke bentuk {-1, +1} untuk Walsh transform
    f = [(-1) ** val for val in truth_table]
    
    # Hitung Walsh transform
    walsh = fwht(f)
    
    # Cek mulai dari order tertinggi ke terendah
    for order in range(n, -1, -1):
        is_immune = True
        
        # Cek semua mask dengan Hamming weight <= order
        # (kecuali mask 0 yang selalu menghasilkan nilai konstan)
        for mask in range(1, size):
            hw = bin(mask).count('1')
            if hw <= order:
                # Jika Walsh coefficient tidak nol, ada korelasi
                # (dalam konteks ini, kita cek apakah ada bias signifikan)
                if abs(walsh[mask]) > 0:
                    is_immune = False
                    break
        
        if is_immune:
            return order
    
    return 0

