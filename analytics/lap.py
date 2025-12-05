# analytics/lap.py

def calc_lap_measure(sbox):
    """
    Menghitung Linear Approximation Probability (LAP) maksimum.
    Membuat Linear Approximation Table (LAT) dan mencari bias terbesar.
    """
    n = 8
    size = 256
    max_bias = 0
    
    # a adalah mask input, b adalah mask output
    # Kita iterasi semua kemungkinan kombinasi linear (kecuali 0)
    # Note: Algoritma ini O(2^2n), agak berat tapi akurat untuk 8-bit.
    
    for a in range(1, size):
        for b in range(1, size):
            match_count = 0
            
            for x in range(size):
                y = sbox[x]
                
                # Hitung dot product (parity bit)
                # input_parity = a • x
                # output_parity = b • y
                
                input_parity = bin(x & a).count('1') % 2
                output_parity = bin(y & b).count('1') % 2
                
                if input_parity == output_parity:
                    match_count += 1
            
            # Hitung bias: |match_count - half_size| / size
            # Kita cari bias absolut terbesar
            bias = abs(match_count - (size / 2))
            if bias > max_bias:
                max_bias = bias

    # Kembalikan probabilitas maksimum (Bias / Size)
    # Atau bisa juga dikali 2 untuk representasi bias standar (maks 0.5)
    # Di sini kita return probabilitas deviasi-nya.
    return max_bias / size