def hamming_weight(n):
    """Menghitung jumlah bit '1' dalam angka biner."""
    return bin(n).count('1')

def mobius_transform(function_table):
    """
    Algoritma Fast Mobius Transform.
    Mengubah Truth Table menjadi Algebraic Normal Form (ANF).
    """
    size = len(function_table)
    anf = list(function_table)
    
    step = 1
    while step < size:
        for i in range(0, size, step * 2):
            for j in range(i, i + step):
                # XOR nilai saat ini dengan nilai sebelumnya di blok
                anf[j + step] ^= anf[j]
        step *= 2
        
    return anf

def calc_ad_measure(sbox):
    """
    Menghitung Algebraic Degree (AD).
    Mencari derajat polinomial tertinggi dari 8 fungsi output S-box.
    Nilai optimal untuk S-box 8-bit adalah 7.
    """
    n = 8
    size = 256
    max_degree = 0

    # Cek derajat untuk setiap bit output (0 sampai 7)
    for bit in range(n):
        # 1. Buat Truth Table untuk bit ke-i
        truth_table = []
        for x in range(size):
            # Ambil bit ke-i dari output S-box
            val = (sbox[x] >> bit) & 1
            truth_table.append(val)
            
        # 2. Ubah ke bentuk ANF menggunakan Mobius Transform
        anf_table = mobius_transform(truth_table)
        
        # 3. Cari derajat tertinggi
        # Derajat adalah Hamming Weight terbesar dari index yang nilai ANF-nya 1
        current_bit_max_degree = 0
        for i in range(size):
            if anf_table[i] == 1:
                deg = hamming_weight(i)
                if deg > current_bit_max_degree:
                    current_bit_max_degree = deg
        
        # Update derajat maksimum global
        if current_bit_max_degree > max_degree:
            max_degree = current_bit_max_degree

    return max_degree