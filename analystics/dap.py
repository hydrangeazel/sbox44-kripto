# analytics/dap.py

def calc_dap_measure(sbox):
    """
    Menghitung Differential Approximation Probability (DAP) maksimum.
    Membuat Difference Distribution Table (DDT) dan mencari entry terbesar.
    """
    size = 256
    # DDT matrix 256x256 diisi 0
    ddt = [[0] * size for _ in range(size)]
    
    # Isi DDT
    # Baris mewakili perbedaan input (delta_x)
    # Kolom mewakili perbedaan output (delta_y)
    for x in range(size):
        for delta_x in range(size):
            y1 = sbox[x]
            y2 = sbox[x ^ delta_x] # Input kedua bedanya delta_x
            
            delta_y = y1 ^ y2 # Perbedaan output
            
            ddt[delta_x][delta_y] += 1
            
    # Cari nilai maksimum di tabel DDT
    # Kita abaikan baris delta_x = 0 (karena delta_y pasti 0, count pasti 256)
    max_diff_prob = 0
    
    for delta_x in range(1, size): # Mulai dari 1
        for delta_y in range(size):
            if ddt[delta_x][delta_y] > max_diff_prob:
                max_diff_prob = ddt[delta_x][delta_y]
                
    # Hitung probabilitasnya = Count Terbesar / Total Kemungkinan Input
    return max_diff_prob / size