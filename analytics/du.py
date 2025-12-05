def calc_du_measure(sbox):
    """
    Menghitung Differential Uniformity (DU).
    DU adalah nilai maksimum terbesar dalam Difference Distribution Table (DDT),
    tidak termasuk kasus input difference = 0.
    
    Semakin KECIL nilai DU, semakin tahan terhadap Differential Cryptanalysis.
    Untuk S-box 8-bit yang baik, target DU biasanya 4 (seperti AES).
    """
    size = 256
    # Buat tabel DDT 256x256 diisi 0
    ddt = [[0] * size for _ in range(size)]
    
    # Isi DDT
    # Kita iterasi semua kemungkinan input (x) dan perbedaan input (delta_x)
    for x in range(size):
        for delta_x in range(1, size): # delta_x tidak boleh 0
            y1 = sbox[x]
            y2 = sbox[x ^ delta_x] # Input kedua adalah x XOR delta_x
            
            delta_y = y1 ^ y2 # Perbedaan output
            
            ddt[delta_x][delta_y] += 1
            
    # Cari nilai maksimum di seluruh tabel
    max_count = 0
    
    for delta_x in range(1, size):
        for delta_y in range(size):
            if ddt[delta_x][delta_y] > max_count:
                max_count = ddt[delta_x][delta_y]
                
    # Hasilnya adalah integer (Contoh: 4, 6, 8, dst)
    return max_count