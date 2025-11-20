# analytics/sac.py

def hamming_weight(n):
    """Menghitung jumlah angka 1 dalam biner (popcount)."""
    c = 0
    while n > 0:
        c += 1
        n &= n - 1
    return c

def calc_sac_measure(sbox):
    """
    Menghitung Strict Avalanche Criterion (SAC).
    Idealnya nilainya mendekati 0.5.
    """
    n = 8
    size = 256
    
    # Matriks SAC 8x8 (8 bit input x 8 bit output)
    sac_matrix = [[0.0] * n for _ in range(n)]

    # Iterasi untuk setiap bit input yang akan di-flip (i)
    for i in range(n):
        input_mask = 1 << i
        
        # Iterasi untuk setiap kemungkinan input x
        for x in range(size):
            y1 = sbox[x]                # Output asli
            y2 = sbox[x ^ input_mask]   # Output setelah bit ke-i di-flip
            
            xor_diff = y1 ^ y2          # Perbedaan output
            
            # Iterasi untuk setiap bit output (j)
            for j in range(n):
                # Jika bit ke-j berubah (bernilai 1 di xor_diff), tambah counter
                if (xor_diff >> j) & 1:
                    sac_matrix[i][j] += 1

    # Normalisasi nilai menjadi probabilitas (0.0 - 1.0)
    total_sac = 0
    for i in range(n):
        for j in range(n):
            sac_matrix[i][j] /= size # Bagi dengan total input (256)
            total_sac += sac_matrix[i][j]

    # Mengembalikan rata-rata SAC (seharusnya ~0.5)
    avg_sac = total_sac / (n * n)
    return avg_sac