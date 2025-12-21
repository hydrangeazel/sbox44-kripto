import streamlit as st
import numpy as np
import pandas as pd
import json
from aes_engine.utils import SBOX
from analytics import (
    calc_nl_measure, calc_sac_measure, calc_bic_nl_measure, calc_bic_sac_measure,
    calc_lap_measure, calc_dap_measure, calc_to_measure, calc_du_measure, calc_ad_measure,
    calc_ci_measure, check_sbox_basic_properties
)

# Matriks affine standar AES (8x8)
AES_AFFINE_MATRIX = [
    [1, 0, 0, 0, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 1, 1, 1, 1, 1]
]

# Konstanta affine standar AES (8-bit)
AES_AFFINE_CONSTANT = 0x63  # 01100011

def gmul_inverse(a):
    """
    Menghitung invers perkalian dalam GF(2^8) menggunakan eksponensial.
    a^(-1) = a^(254) karena order grup multiplikatif adalah 255.
    Menggunakan irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B).
    """
    if a == 0:
        return 0  # 0 tidak memiliki invers
    
    # a^(-1) = a^(254) = a^(255-1)
    # Kita hitung a^254 menggunakan fast exponentiation
    result = 1
    power = a
    exponent = 254
    
    while exponent > 0:
        if exponent & 1:
            result = _gf2_multiply(result, power)
        power = _gf2_multiply(power, power)
        exponent >>= 1
    
    return result & 0xFF

def _gf2_multiply(a, b):
    """
    Perkalian dalam GF(2^8) dengan irreducible polynomial x^8 + x^4 + x^3 + x + 1 (0x11B).
    """
    irr_poly = 0x11B  # x^8 + x^4 + x^3 + x + 1
    result = 0
    while b:
        if b & 1:
            result ^= a
        a <<= 1
        if a & 0x100:
            a ^= irr_poly
        b >>= 1
    return result & 0xFF

def matrix_determinant_mod2(matrix):
    """
    Menghitung determinan matriks 8x8 dalam GF(2) (mod 2).
    Menggunakan eliminasi Gauss.
    """
    mat = [row[:] for row in matrix]
    n = len(mat)
    det = 1
    
    for i in range(n):
        # Cari baris dengan 1 di kolom i
        pivot = -1
        for j in range(i, n):
            if mat[j][i] == 1:
                pivot = j
                break
        
        if pivot == -1:
            return 0  # Determinant = 0
        
        # Swap rows
        if pivot != i:
            mat[i], mat[pivot] = mat[pivot], mat[i]
            det = (det + 1) % 2  # Toggle sign (tapi di GF(2), -1 = 1)
        
        # Eliminasi
        for j in range(i + 1, n):
            if mat[j][i] == 1:
                for k in range(i, n):
                    mat[j][k] = (mat[j][k] + mat[i][k]) % 2
    
    return det

def is_matrix_balanced(matrix):
    """
    Memeriksa apakah matriks 8x8 balanced.
    Balanced berarti setiap baris memiliki jumlah 1 yang sama.
    """
    if len(matrix) != 8 or any(len(row) != 8 for row in matrix):
        return False
    
    # Hitung jumlah 1 di setiap baris
    row_weights = [sum(row) for row in matrix]
    
    # Semua baris harus memiliki weight yang sama
    return len(set(row_weights)) == 1

def is_matrix_bijective(matrix):
    """
    Memeriksa apakah matriks 8x8 bijective (invertible).
    Matriks bijective jika determinan mod 2 = 1.
    """
    det = matrix_determinant_mod2(matrix)
    return det == 1

def right_circular_shift(row):
    """
    Melakukan Right Circular Shift pada sebuah baris.
    Elemen terakhir dipindahkan ke posisi pertama.
    
    Contoh: [1, 1, 1, 0, 0, 0, 0, 0] -> [0, 1, 1, 1, 0, 0, 0, 0]
    """
    if len(row) == 0:
        return row
    return [row[-1]] + row[:-1]

def generate_affine_matrix_from_first_row(first_row):
    """
    Membangkitkan matriks affine 8x8 dari baris pertama menggunakan Right Circular Shift.
    
    Berdasarkan paper "AES S-box modification uses affine matrices exploration":
    - Row[0] = first_row (input)
    - Row[i] = RightCircularShift(Row[i-1]) untuk i = 1 sampai 7
    
    Args:
        first_row: List of 8 integers (0 or 1) representing the first row
    
    Returns:
        tuple: (matrix, is_valid, det, message)
        - matrix: 8x8 matrix (list of lists)
        - is_valid: True if determinant mod 2 == 1 (invertible), False otherwise
        - det: determinant value in GF(2) (0 or 1)
        - message: validation message
    """
    # Validasi input
    if not first_row or len(first_row) != 8:
        return None, False, 0, "Baris pertama harus memiliki tepat 8 elemen"
    
    # Validasi elemen harus 0 atau 1
    for i, val in enumerate(first_row):
        if val not in [0, 1]:
            return None, False, 0, f"Elemen ke-{i+1} harus 0 atau 1, ditemukan: {val}"
    
    # Bangun matriks menggunakan Right Circular Shift
    matrix = []
    current_row = list(first_row)  # Copy untuk menghindari modifikasi
    
    for i in range(8):
        matrix.append(list(current_row))
        if i < 7:  # Jangan shift pada iterasi terakhir
            current_row = right_circular_shift(current_row)
    
    # Validasi determinan dalam GF(2)
    det = matrix_determinant_mod2(matrix)
    is_valid = (det == 1)
    
    if is_valid:
        message = f"Matriks berhasil dibangkitkan. Determinan (mod 2) = {det} (Invertible/Valid)"
    else:
        message = f"Matriks dibangkitkan tetapi TIDAK VALID. Determinan (mod 2) = {det} (Singular/Non-invertible). S-box akan kehilangan sifat Bijective. Silakan ubah baris pertama."
    
    return matrix, is_valid, det, message

def validate_affine_matrix(matrix):
    """
    Validasi matriks affine 8x8.
    Returns: (is_valid, det, is_balanced, is_bijective, message)
    """
    if len(matrix) != 8:
        return False, 0, False, False, "Matriks harus berukuran 8x8"
    
    if any(len(row) != 8 for row in matrix):
        return False, 0, False, False, "Setiap baris harus memiliki 8 elemen"
    
    # Validasi elemen harus 0 atau 1
    for i in range(8):
        for j in range(8):
            if matrix[i][j] not in [0, 1]:
                return False, 0, False, False, f"Elemen di baris {i+1}, kolom {j+1} harus 0 atau 1"
    
    det = matrix_determinant_mod2(matrix)
    balanced = is_matrix_balanced(matrix)
    bijective = is_matrix_bijective(matrix)
    
    is_valid = balanced and bijective
    
    if is_valid:
        message = "Matriks valid: balanced dan bijective"
    else:
        issues = []
        if not balanced:
            issues.append("tidak balanced")
        if not bijective:
            issues.append("tidak bijective (determinan = 0)")
        message = f"Matriks tidak valid: {', '.join(issues)}"
    
    return is_valid, det, balanced, bijective, message

def apply_affine_transformation(x, matrix, constant):
    """
    Menerapkan transformasi affine: y = matrix * x + constant
    x: input byte (0-255)
    matrix: 8x8 binary matrix
    constant: 8-bit constant
    """
    # Konversi x ke vektor biner 8-bit
    x_vec = [(x >> i) & 1 for i in range(8)]
    
    # Perkalian matriks: matrix * x_vec
    y_vec = [0] * 8
    for i in range(8):
        for j in range(8):
            y_vec[i] ^= matrix[i][j] * x_vec[j]
    
    # Tambahkan konstanta (XOR dalam GF(2))
    const_vec = [(constant >> i) & 1 for i in range(8)]
    y_vec = [y_vec[i] ^ const_vec[i] for i in range(8)]
    
    # Konversi kembali ke byte
    y = 0
    for i in range(8):
        y |= (y_vec[i] << i)
    
    return y

def generate_sbox_from_affine(matrix, constant):
    """
    Membangun S-box dari matriks affine menggunakan proses AES:
    1. Hitung invers perkalian GF(2^8) untuk setiap input
    2. Terapkan transformasi affine
    3. Tambahkan konstanta
    """
    sbox = [0] * 256
    
    for x in range(256):
        # Langkah 1: Hitung invers perkalian GF(2^8)
        inv_x = gmul_inverse(x)
        
        # Langkah 2 & 3: Terapkan transformasi affine + konstanta
        sbox[x] = apply_affine_transformation(inv_x, matrix, constant)
    
    return sbox

def calculate_security_score(nl, sac, bic_nl, bic_sac):
    """
    Menghitung skor keamanan gabungan.
    Skor lebih tinggi = lebih baik.
    """
    # Normalisasi dan pembobotan
    # NL ideal: 112, semakin tinggi semakin baik
    nl_score = (nl / 112.0) * 100
    
    # SAC ideal: 0.5, semakin dekat 0.5 semakin baik
    sac_score = (1.0 - abs(sac - 0.5) * 2) * 100
    
    # BIC-NL ideal: tinggi, semakin tinggi semakin baik
    bic_nl_score = (bic_nl / 112.0) * 100
    
    # BIC-SAC ideal: 0, semakin rendah semakin baik
    bic_sac_score = max(0, (1.0 - bic_sac) * 100)
    
    # Skor gabungan (weighted average)
    total_score = (nl_score * 0.3 + sac_score * 0.3 + bic_nl_score * 0.2 + bic_sac_score * 0.2)
    
    return total_score

def render_sbox_modifier_ui():
    st.title("🔧 AES S-Box Modifier")
    st.markdown("Modul untuk membangun dan mengevaluasi kandidat S-box baru menggunakan matriks affine kustom.")
    
    # Tab untuk input matriks
    tab1, tab2 = st.tabs(["Input Matriks", "Pilih Matriks Standar"])
    
    matrix = None
    constant = AES_AFFINE_CONSTANT
    
    with tab1:
        st.subheader("Masukkan Matriks Affine 8×8")
        st.markdown("Masukkan matriks dalam format biner (0 atau 1).")
        
        # Input konstanta
        constant_input = st.text_input(
            "Konstanta 8-bit (hex):",
            value=f"0x{constant:02x}",
            help="Masukkan konstanta dalam format hex (contoh: 0x63)"
        )
        
        try:
            if constant_input.startswith("0x") or constant_input.startswith("0X"):
                constant = int(constant_input, 16)
            else:
                constant = int(constant_input, 16)
            constant = constant & 0xFF  # Pastikan 8-bit
        except:
            st.warning("Format konstanta tidak valid, menggunakan konstanta standar AES (0x63)")
            constant = AES_AFFINE_CONSTANT
        
        # Input matriks menggunakan text area atau input per elemen
        input_method = st.radio(
            "Metode Input:",
            ["Manual (Tabel)", "Text Area"],
            horizontal=True
        )
        
        if input_method == "Manual (Tabel)":
            st.markdown("**Masukkan matriks 8×8 (0 atau 1):**")
            matrix_input = []
            cols = st.columns(8)
            
            for i in range(8):
                row = []
                for j in range(8):
                    with cols[j]:
                        val = st.number_input(
                            f"R{i+1}C{j+1}",
                            min_value=0,
                            max_value=1,
                            value=1 if i == j else 0,
                            key=f"matrix_{i}_{j}",
                            step=1
                        )
                        row.append(int(val))
                matrix_input.append(row)
            matrix = matrix_input
        else:
            st.markdown("**Masukkan matriks dalam format text (8 baris, setiap baris 8 angka dipisahkan spasi):**")
            matrix_text = st.text_area(
                "Matriks (8×8):",
                value="1 0 0 0 1 1 1 1\n1 1 0 0 0 1 1 1\n1 1 1 0 0 0 1 1\n1 1 1 1 0 0 0 1\n1 1 1 1 1 0 0 0\n0 1 1 1 1 1 0 0\n0 0 1 1 1 1 1 0\n0 0 0 1 1 1 1 1",
                height=150,
                help="Setiap baris harus memiliki 8 angka (0 atau 1) dipisahkan spasi"
            )
            
            try:
                lines = matrix_text.strip().split('\n')
                if len(lines) != 8:
                    st.error("Matriks harus memiliki tepat 8 baris")
                else:
                    matrix = []
                    for line in lines:
                        row = [int(x.strip()) for x in line.split()]
                        if len(row) != 8:
                            st.error(f"Baris harus memiliki tepat 8 elemen: {line}")
                            matrix = None
                            break
                        matrix.append(row)
            except Exception as e:
                st.error(f"Error parsing matriks: {e}")
                matrix = None
    
    with tab2:
        st.subheader("Pilih Matriks Standar")
        st.markdown("Gunakan matriks affine standar AES atau matriks identitas.")
        
        matrix_option = st.selectbox(
            "Pilih Matriks:",
            ["Matriks Affine Standar AES", "Matriks Identitas"]
        )
        
        if matrix_option == "Matriks Affine Standar AES":
            matrix = AES_AFFINE_MATRIX
            st.code("\n".join([" ".join(map(str, row)) for row in matrix]))
        else:
            # Matriks identitas
            matrix = [[1 if i == j else 0 for j in range(8)] for i in range(8)]
            st.code("\n".join([" ".join(map(str, row)) for row in matrix]))
    
    # Validasi dan pembentukan S-box
    if matrix is not None:
        st.markdown("---")
        st.subheader("📋 Validasi Matriks")
        
        is_valid, det, is_balanced, is_bijective, message = validate_affine_matrix(matrix)
        
        col1, col2, col3, col4 = st.columns(4)
        
        with col1:
            if is_valid:
                st.success("✅ Valid")
            else:
                st.error("❌ Tidak Valid")
        
        with col2:
            st.metric("Determinan (mod 2)", det)
        
        with col3:
            if is_balanced:
                st.success("✅ Balanced")
            else:
                st.error("❌ Tidak Balanced")
        
        with col4:
            if is_bijective:
                st.success("✅ Bijective")
            else:
                st.error("❌ Tidak Bijective")
        
        st.info(f"**Status:** {message}")
        
        # Tampilkan matriks
        st.markdown("**Matriks Affine:**")
        df_matrix = pd.DataFrame(matrix, columns=[f"C{i+1}" for i in range(8)], index=[f"R{i+1}" for i in range(8)])
        st.dataframe(df_matrix, use_container_width=True)
        
        # Pembentukan S-box
        if is_valid:
            if st.button("🔨 Bangun S-Box Kandidat", type="primary"):
                with st.spinner("Membangun S-box kandidat..."):
                    candidate_sbox = generate_sbox_from_affine(matrix, constant)
                    
                    # Simpan ke session state
                    if 'candidate_sboxes' not in st.session_state:
                        st.session_state['candidate_sboxes'] = []
                    
                    candidate_id = len(st.session_state['candidate_sboxes'])
                    st.session_state['candidate_sboxes'].append({
                        'id': candidate_id,
                        'matrix': matrix,
                        'constant': constant,
                        'sbox': candidate_sbox,
                        'name': f"Kandidat {candidate_id + 1}"
                    })
                    
                    st.success(f"S-box kandidat berhasil dibuat! (ID: {candidate_id})")
                    st.rerun()
        else:
            st.warning("Matriks tidak valid. Perbaiki matriks sebelum membangun S-box.")
    
    # Tampilkan kandidat S-box yang sudah dibuat
    if 'candidate_sboxes' in st.session_state and len(st.session_state['candidate_sboxes']) > 0:
        st.markdown("---")
        st.subheader("📊 Kandidat S-Box")
        
        # Tampilkan daftar kandidat
        candidate_names = [f"{c['name']} (ID: {c['id']})" for c in st.session_state['candidate_sboxes']]
        selected_candidate_idx = st.selectbox(
            "Pilih Kandidat untuk Ditampilkan:",
            range(len(candidate_names)),
            format_func=lambda x: candidate_names[x]
        )
        
        selected_candidate = st.session_state['candidate_sboxes'][selected_candidate_idx]
        candidate_sbox = selected_candidate['sbox']
        
        # Tampilkan S-box dalam format 16×16
        st.markdown(f"**S-Box: {selected_candidate['name']}**")
        
        # Format tabel 16×16
        sbox_table = []
        for i in range(16):
            row = []
            for j in range(16):
                idx = i * 16 + j
                row.append(f"{candidate_sbox[idx]:02x}")
            sbox_table.append(row)
        
        df_sbox = pd.DataFrame(
            sbox_table,
            columns=[f"{i:x}" for i in range(16)],
            index=[f"{i:x}" for i in range(16)]
        )
        st.dataframe(df_sbox, use_container_width=True)
        
        # Tampilkan dalam format JSON
        with st.expander("📄 Lihat S-Box dalam Format JSON"):
            sbox_json = {
                "name": selected_candidate['name'],
                "matrix": selected_candidate['matrix'],
                "constant": hex(selected_candidate['constant']),
                "sbox": candidate_sbox
            }
            st.json(sbox_json)
            
            # Tombol download JSON
            json_str = json.dumps(sbox_json, indent=2)
            st.download_button(
                label="💾 Download JSON",
                data=json_str,
                file_name=f"sbox_{selected_candidate['name'].lower().replace(' ', '_')}.json",
                mime="application/json"
            )
        
        # Evaluasi keamanan
        st.markdown("---")
        st.subheader("🔒 Evaluasi Keamanan")
        
        if st.button("🧪 Jalankan Pengujian Keamanan", type="primary"):
            with st.spinner("Menghitung metrik keamanan..."):
                # 1. Basic Properties: Bijective & Balanced
                basic_props_candidate = check_sbox_basic_properties(candidate_sbox)
                basic_props_standard = check_sbox_basic_properties(SBOX)
                
                # 2. Hitung metrik untuk kandidat
                nl_candidate = calc_nl_measure(candidate_sbox)
                sac_candidate = calc_sac_measure(candidate_sbox)
                bic_nl_candidate = calc_bic_nl_measure(candidate_sbox)
                bic_sac_candidate = calc_bic_sac_measure(candidate_sbox)
                lap_candidate = calc_lap_measure(candidate_sbox)
                dap_candidate = calc_dap_measure(candidate_sbox)
                du_candidate = calc_du_measure(candidate_sbox)
                ad_candidate = calc_ad_measure(candidate_sbox)
                to_candidate = calc_to_measure(candidate_sbox)
                ci_candidate = calc_ci_measure(candidate_sbox)
                
                # 3. Hitung metrik untuk AES standar
                nl_standard = calc_nl_measure(SBOX)
                sac_standard = calc_sac_measure(SBOX)
                bic_nl_standard = calc_bic_nl_measure(SBOX)
                bic_sac_standard = calc_bic_sac_measure(SBOX)
                lap_standard = calc_lap_measure(SBOX)
                dap_standard = calc_dap_measure(SBOX)
                du_standard = calc_du_measure(SBOX)
                ad_standard = calc_ad_measure(SBOX)
                to_standard = calc_to_measure(SBOX)
                ci_standard = calc_ci_measure(SBOX)
                
                # Hitung skor keamanan
                score_candidate = calculate_security_score(nl_candidate, sac_candidate, bic_nl_candidate, bic_sac_candidate)
                score_standard = calculate_security_score(nl_standard, sac_standard, bic_nl_standard, bic_sac_standard)
                
                # Simpan hasil evaluasi
                selected_candidate['metrics'] = {
                    'is_bijective': basic_props_candidate['is_bijective'],
                    'is_balanced': basic_props_candidate['is_balanced'],
                    'nl': nl_candidate,
                    'sac': sac_candidate,
                    'bic_nl': bic_nl_candidate,
                    'bic_sac': bic_sac_candidate,
                    'lap': lap_candidate,
                    'dap': dap_candidate,
                    'du': du_candidate,
                    'ad': ad_candidate,
                    'to': to_candidate,
                    'ci': ci_candidate,
                    'score': score_candidate
                }
                
                # Tampilkan dashboard
                st.markdown("### 📈 Dashboard Metrik Keamanan")
                
                metrics_data = {
                    'Metrik': [
                        'Bijective', 'Balanced',
                        'Non-Linearity (NL)', 'SAC', 'BIC-NL', 'BIC-SAC',
                        'LAP', 'DAP', 'DU', 'AD', 'TO', 'CI',
                        'Skor Keamanan'
                    ],
                    'AES Standard': [
                        '✅ Ya' if basic_props_standard['is_bijective'] else '❌ Tidak',
                        '✅ Ya' if basic_props_standard['is_balanced'] else '❌ Tidak',
                        f"{nl_standard}",
                        f"{sac_standard:.4f}",
                        f"{bic_nl_standard}",
                        f"{bic_sac_standard:.4f}",
                        f"{lap_standard:.6f}",
                        f"{dap_standard:.6f}",
                        f"{du_standard}",
                        f"{ad_standard}",
                        f"{to_standard:.6f}",
                        f"{ci_standard}",
                        f"{score_standard:.2f}"
                    ],
                    selected_candidate['name']: [
                        '✅ Ya' if basic_props_candidate['is_bijective'] else '❌ Tidak',
                        '✅ Ya' if basic_props_candidate['is_balanced'] else '❌ Tidak',
                        f"{nl_candidate}",
                        f"{sac_candidate:.4f}",
                        f"{bic_nl_candidate}",
                        f"{bic_sac_candidate:.4f}",
                        f"{lap_candidate:.6f}",
                        f"{dap_candidate:.6f}",
                        f"{du_candidate}",
                        f"{ad_candidate}",
                        f"{to_candidate:.6f}",
                        f"{ci_candidate}",
                        f"{score_candidate:.2f}"
                    ]
                }
                
                df_metrics = pd.DataFrame(metrics_data)
                st.dataframe(df_metrics, use_container_width=True)
                
                # Visualisasi perbandingan
                st.markdown("#### 📊 Grafik Perbandingan")
                
                comparison_data = pd.DataFrame({
                    'Metrik': ['NL', 'SAC', 'BIC-NL', 'BIC-SAC', 'DU', 'AD', 'CI'],
                    'AES Standard': [nl_standard, sac_standard, bic_nl_standard, bic_sac_standard, du_standard, ad_standard, ci_standard],
                    selected_candidate['name']: [nl_candidate, sac_candidate, bic_nl_candidate, bic_sac_candidate, du_candidate, ad_candidate, ci_candidate]
                })
                
                st.bar_chart(comparison_data.set_index('Metrik'))
                
                # Analisis dan peringkat
                st.markdown("---")
                st.subheader("🏆 Analisis dan Peringkat Keamanan")
                
                # Peringkat berdasarkan skor
                if score_candidate > score_standard:
                    st.success(f"🎯 **{selected_candidate['name']} memiliki skor keamanan lebih tinggi** ({score_candidate:.2f} vs {score_standard:.2f})")
                    winner = selected_candidate['name']
                elif score_candidate < score_standard:
                    st.info(f"🎯 **AES Standard memiliki skor keamanan lebih tinggi** ({score_standard:.2f} vs {score_candidate:.2f})")
                    winner = "AES Standard"
                else:
                    st.info("🎯 **Kedua S-box memiliki skor keamanan yang sama**")
                    winner = "Seri"
                
                # Analisis detail per metrik
                st.markdown("**Analisis Detail:**")
                
                # NL
                if nl_candidate > nl_standard:
                    st.write(f"✅ **Non-Linearity:** {selected_candidate['name']} lebih baik ({nl_candidate} vs {nl_standard})")
                elif nl_candidate < nl_standard:
                    st.write(f"⚠️ **Non-Linearity:** AES Standard lebih baik ({nl_standard} vs {nl_candidate})")
                else:
                    st.write(f"➖ **Non-Linearity:** Keduanya sama ({nl_candidate})")
                
                # SAC
                sac_diff_candidate = abs(sac_candidate - 0.5)
                sac_diff_standard = abs(sac_standard - 0.5)
                if sac_diff_candidate < sac_diff_standard:
                    st.write(f"✅ **SAC:** {selected_candidate['name']} lebih dekat ke ideal 0.5 (selisih: {sac_diff_candidate:.4f} vs {sac_diff_standard:.4f})")
                elif sac_diff_candidate > sac_diff_standard:
                    st.write(f"⚠️ **SAC:** AES Standard lebih dekat ke ideal 0.5 (selisih: {sac_diff_standard:.4f} vs {sac_diff_candidate:.4f})")
                else:
                    st.write(f"➖ **SAC:** Keduanya sama dekat ke ideal 0.5")
                
                # BIC-NL
                if bic_nl_candidate > bic_nl_standard:
                    st.write(f"✅ **BIC-NL:** {selected_candidate['name']} lebih baik ({bic_nl_candidate} vs {bic_nl_standard})")
                elif bic_nl_candidate < bic_nl_standard:
                    st.write(f"⚠️ **BIC-NL:** AES Standard lebih baik ({bic_nl_standard} vs {bic_nl_candidate})")
                else:
                    st.write(f"➖ **BIC-NL:** Keduanya sama ({bic_nl_candidate})")
                
                # BIC-SAC
                if bic_sac_candidate < bic_sac_standard:
                    st.write(f"✅ **BIC-SAC:** {selected_candidate['name']} lebih baik ({bic_sac_candidate:.4f} vs {bic_sac_standard:.4f}, semakin rendah semakin baik)")
                elif bic_sac_candidate > bic_sac_standard:
                    st.write(f"⚠️ **BIC-SAC:** AES Standard lebih baik ({bic_sac_standard:.4f} vs {bic_sac_candidate:.4f}, semakin rendah semakin baik)")
                else:
                    st.write(f"➖ **BIC-SAC:** Keduanya sama ({bic_sac_candidate:.4f})")
                
                # DU
                if du_candidate < du_standard:
                    st.write(f"✅ **Differential Uniformity (DU):** {selected_candidate['name']} lebih baik ({du_candidate} vs {du_standard}, semakin rendah semakin baik)")
                elif du_candidate > du_standard:
                    st.write(f"⚠️ **Differential Uniformity (DU):** AES Standard lebih baik ({du_standard} vs {du_candidate}, semakin rendah semakin baik)")
                else:
                    st.write(f"➖ **Differential Uniformity (DU):** Keduanya sama ({du_candidate})")
                
                # AD
                if ad_candidate > ad_standard:
                    st.write(f"✅ **Algebraic Degree (AD):** {selected_candidate['name']} lebih baik ({ad_candidate} vs {ad_standard}, semakin tinggi semakin baik)")
                elif ad_candidate < ad_standard:
                    st.write(f"⚠️ **Algebraic Degree (AD):** AES Standard lebih baik ({ad_standard} vs {ad_candidate}, semakin tinggi semakin baik)")
                else:
                    st.write(f"➖ **Algebraic Degree (AD):** Keduanya sama ({ad_candidate})")
                
                # CI
                if ci_candidate > ci_standard:
                    st.write(f"✅ **Correlation Immunity (CI):** {selected_candidate['name']} lebih baik ({ci_candidate} vs {ci_standard}, semakin tinggi semakin baik)")
                elif ci_candidate < ci_standard:
                    st.write(f"⚠️ **Correlation Immunity (CI):** AES Standard lebih baik ({ci_standard} vs {ci_candidate}, semakin tinggi semakin baik)")
                else:
                    st.write(f"➖ **Correlation Immunity (CI):** Keduanya sama ({ci_candidate})")
        
        # Jika sudah ada evaluasi, tampilkan hasil
        if 'metrics' in selected_candidate:
            st.markdown("---")
            st.subheader("📊 Hasil Evaluasi Tersimpan")
            metrics = selected_candidate['metrics']
            
            col1, col2, col3, col4, col5 = st.columns(5)
            with col1:
                st.metric("NL", metrics['nl'])
            with col2:
                st.metric("SAC", f"{metrics['sac']:.4f}")
            with col3:
                st.metric("BIC-NL", metrics['bic_nl'])
            with col4:
                st.metric("BIC-SAC", f"{metrics['bic_sac']:.4f}")
            with col5:
                st.metric("Skor", f"{metrics['score']:.2f}")
        
        # Perbandingan semua kandidat
        if len(st.session_state['candidate_sboxes']) > 1:
            st.markdown("---")
            st.subheader("📊 Perbandingan Semua Kandidat")
            
            if st.button("🔄 Bandingkan Semua Kandidat"):
                with st.spinner("Mengevaluasi semua kandidat..."):
                    # Evaluasi semua kandidat yang belum dievaluasi
                    for candidate in st.session_state['candidate_sboxes']:
                        if 'metrics' not in candidate:
                            sbox = candidate['sbox']
                            candidate['metrics'] = {
                                'nl': calc_nl_measure(sbox),
                                'sac': calc_sac_measure(sbox),
                                'bic_nl': calc_bic_nl_measure(sbox),
                                'bic_sac': calc_bic_sac_measure(sbox)
                            }
                            candidate['metrics']['score'] = calculate_security_score(
                                candidate['metrics']['nl'],
                                candidate['metrics']['sac'],
                                candidate['metrics']['bic_nl'],
                                candidate['metrics']['bic_sac']
                            )
                    
                    # Evaluasi AES standard
                    standard_metrics = {
                        'nl': calc_nl_measure(SBOX),
                        'sac': calc_sac_measure(SBOX),
                        'bic_nl': calc_bic_nl_measure(SBOX),
                        'bic_sac': calc_bic_sac_measure(SBOX)
                    }
                    standard_metrics['score'] = calculate_security_score(
                        standard_metrics['nl'],
                        standard_metrics['sac'],
                        standard_metrics['bic_nl'],
                        standard_metrics['bic_sac']
                    )
                    
                    # Buat tabel perbandingan
                    comparison_rows = []
                    for candidate in st.session_state['candidate_sboxes']:
                        m = candidate['metrics']
                        comparison_rows.append({
                            'S-Box': candidate['name'],
                            'NL': m['nl'],
                            'SAC': f"{m['sac']:.4f}",
                            'BIC-NL': m['bic_nl'],
                            'BIC-SAC': f"{m['bic_sac']:.4f}",
                            'Skor': f"{m['score']:.2f}"
                        })
                    
                    # Tambahkan AES standard
                    comparison_rows.append({
                        'S-Box': 'AES Standard',
                        'NL': standard_metrics['nl'],
                        'SAC': f"{standard_metrics['sac']:.4f}",
                        'BIC-NL': standard_metrics['bic_nl'],
                        'BIC-SAC': f"{standard_metrics['bic_sac']:.4f}",
                        'Skor': f"{standard_metrics['score']:.2f}"
                    })
                    
                    df_comparison = pd.DataFrame(comparison_rows)
                    # Sort berdasarkan skor (konversi string ke float untuk sorting)
                    df_comparison['_sort_score'] = df_comparison['Skor'].astype(float)
                    df_comparison = df_comparison.sort_values('_sort_score', ascending=False)
                    df_comparison = df_comparison.drop('_sort_score', axis=1)
                    st.dataframe(df_comparison, use_container_width=True)
                    
                    # Tentukan kandidat terbaik
                    best_candidate = max(
                        st.session_state['candidate_sboxes'],
                        key=lambda c: c['metrics']['score']
                    )
                    
                    if best_candidate['metrics']['score'] > standard_metrics['score']:
                        st.success(f"🏆 **Kandidat Terbaik:** {best_candidate['name']} dengan skor {best_candidate['metrics']['score']:.2f}")
                    else:
                        st.info(f"🏆 **Kandidat Terbaik:** AES Standard dengan skor {standard_metrics['score']:.2f}")
        
        # Tombol hapus kandidat
        if st.button("🗑️ Hapus Kandidat Terpilih", type="secondary"):
            st.session_state['candidate_sboxes'].pop(selected_candidate_idx)
            st.rerun()
        
        # Tombol hapus semua
        if st.button("🗑️ Hapus Semua Kandidat", type="secondary"):
            st.session_state['candidate_sboxes'] = []
            st.rerun()

