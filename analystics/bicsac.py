# analytics/bicsac.py

def calc_bic_sac_measure(sbox):
    """
    Menghitung Bit Independence Criterion untuk SAC (BIC-SAC).
    Mengukur rata-rata koefisien korelasi antar pasangan bit avalanche vector.
    Nilai ideal mendekati 0 (tidak ada korelasi).
    """
    n = 8
    size = 256
    total_bic_sac = 0.0
    pair_count = 0

    # Iterasi setiap bit input yang di-flip (i)
    for i in range(n):
        input_mask = 1 << i
        
        # Siapkan vektor avalanche untuk setiap bit output
        # aval_vectors[j] berisi list perubahan bit ke-j untuk semua input x
        aval_vectors = [[0] * size for _ in range(n)]
        
        for x in range(size):
            y1 = sbox[x]
            y2 = sbox[x ^ input_mask]
            diff = y1 ^ y2
            
            for bit in range(n):
                aval_vectors[bit][x] = (diff >> bit) & 1

        # Hitung korelasi antar pasangan bit output (j, k)
        for j in range(n):
            for k in range(j + 1, n):
                # Hitung koefisien korelasi Pearson untuk vektor j dan k
                # correlation = cov(j, k) / (std_dev(j) * std_dev(k))
                # Karena ini binary (Bernoulli), bisa disederhanakan, tapi kita pakai hitungan manual:
                
                count_00 = 0
                count_01 = 0
                count_10 = 0
                count_11 = 0
                
                for x in range(size):
                    bj = aval_vectors[j][x]
                    bk = aval_vectors[k][x]
                    
                    if bj == 0 and bk == 0: count_00 += 1
                    elif bj == 0 and bk == 1: count_01 += 1
                    elif bj == 1 and bk == 0: count_10 += 1
                    elif bj == 1 and bk == 1: count_11 += 1
                
                # Total samples
                N = size
                
                # Eksipektasi (Mean)
                mean_j = sum(aval_vectors[j]) / N
                mean_k = sum(aval_vectors[k]) / N
                
                # Covariance
                covariance = 0.0
                var_j = 0.0
                var_k = 0.0
                
                for x in range(size):
                    val_j = aval_vectors[j][x] - mean_j
                    val_k = aval_vectors[k][x] - mean_k
                    covariance += val_j * val_k
                    var_j += val_j ** 2
                    var_k += val_k ** 2
                
                # Menghindari pembagian dengan nol
                if var_j == 0 or var_k == 0:
                    correlation = 0
                else:
                    correlation = covariance / ((var_j * var_k) ** 0.5)
                
                total_bic_sac += abs(correlation) # Kita ambil nilai absolutnya
                pair_count += 1

    return total_bic_sac / pair_count