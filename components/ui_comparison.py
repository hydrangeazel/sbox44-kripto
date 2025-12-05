import streamlit as st
import pandas as pd
import numpy as np
import time
from aes_engine.modes import AESModes
from analytics import (
    calc_nl_measure, calc_sac_measure, calc_bic_nl_measure,
    calc_bic_sac_measure, calc_lap_measure, calc_dap_measure, 
    calc_to_measure
)
from aes_engine.utils import SBOX
import json
import os
import base64

def load_sbox44():
    """Memuat S-box44 dari file JSON"""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(current_dir, '..', 'assets', 'sbox44.json')
    try:
        with open(json_path, 'r') as f:
            data = json.load(f)
            sbox_values = data.get('sbox44') or data.get('sbox')
            if not sbox_values or len(sbox_values) != 256:
                return None
            return sbox_values
    except:
        return None

def encrypt_data(data_type, data, key, is_sbox44, output_format):
    cipher = AESModes(key, use_sbox44=is_sbox44)
    
    if data_type == "Text":
        if is_sbox44:
            encrypted = cipher.encrypt_cbc(data, "vektorinisial123")
        else:
            encrypted = cipher.encrypt_ecb(data)

        if output_format == "Hex":
            return encrypted.hex()
        else:  # Base64
            return base64.b64encode(encrypted).decode()

    else:
        return f"Image encrypted with {'S-Box44' if is_sbox44 else 'Standard'}"

def get_metrics(is_sbox44):
    """Menghitung metrik kriptografi untuk S-box"""
    sbox = load_sbox44() if is_sbox44 else SBOX
    
    if sbox is None:
        return [0, 0.0, 0, 0]
    
    start_time = time.time()
    nl_val = calc_nl_measure(sbox)
    sac_val = calc_sac_measure(sbox)
    bic_nl_val = calc_bic_nl_measure(sbox)
    bic_sac_val = calc_bic_sac_measure(sbox)
    lap_val = calc_lap_measure(sbox)
    dap_val = calc_dap_measure(sbox)
    to_val = calc_to_measure(sbox)
    elapsed_time = (time.time() - start_time) * 1000  # dalam ms
    
    return [nl_val, sac_val, bic_nl_val, bic_sac_val, lap_val, dap_val, to_val, int(elapsed_time)]


def render_comparison_ui():
    st.title("⚖️ Performance Comparison")
    st.markdown("Perbandingan langsung antara **AES Standard** dan **AES S-Box44** berdasarkan data input.")

    # Pilihan Input Data
    comparison_data_type = st.radio(
        "Pilih Tipe Data untuk Perbandingan:",
        ["Text", "Image"],
        horizontal=True
    )
    
    st.markdown("---")

    # --- INPUT DAN KEY ---
    col_input, col_key = st.columns([3, 1])

    with col_input:
        if comparison_data_type == "Text":
            data_input = st.text_area("Input Plaintext untuk Perbandingan:", height=100, value="Perbandingan ini menggunakan custom S-Box44.", placeholder="Masukkan plaintext unik Anda di sini...")
        else:
            # Karena Streamlit tidak bisa mengambil file upload tanpa me-render halaman, 
            # kita gunakan placeholder untuk input gambar dalam mode perbandingan.
            data_input = st.text_input("Input Key Path/Identifier Gambar:", value="sample_image_512x512.png")
            st.caption("Fungsi ini mengasumsikan gambar sudah di-load di memori/disk (Tugas Person 3).")

    with col_key:
        key = st.text_input("Masukkan Kunci (16 Karakter):", max_chars=16, type="password", value="a1b2c3d4e5f67890")
    
    if len(key) != 16:
        st.warning("Kunci wajib 16 karakter untuk menjalankan perbandingan.")
        return # Hentikan rendering jika kunci salah

    if st.button("🚀 Jalankan Analisis Perbandingan"):
        st.session_state['run_comparison'] = True
        st.session_state['comp_input'] = data_input
        st.session_state['comp_key'] = key
        st.session_state['comp_type'] = comparison_data_type

    # CIPHERTEXT OPTION
    output_format = st.selectbox(
    "Format Output Ciphertext:",
    ["Hex", "Base64"],
    index=0
    )
    
    # --- HASIL PERBANDINGAN ---
    
    if st.session_state.get('run_comparison'):
        st.markdown("## Hasil Enkripsi dan Metrik")
        
        # 1. Tampilan Visual/Ciphertext
        col_std_out, col_s44_out = st.columns(2)
        
        with col_std_out:
            st.info("AES Standard")
            
            try:
                output_std = encrypt_data(st.session_state['comp_type'], st.session_state['comp_input'], st.session_state['comp_key'], False, output_format)
                
                if st.session_state['comp_type'] == "Text":
                    st.code(output_std, language="text")
                else:
                    st.write(output_std)
            except Exception as e:
                st.error(f"Error: {e}")


        with col_s44_out:
            st.success("AES S-Box44 (Custom)")
            
            try:
                output_s44 = encrypt_data(st.session_state['comp_type'], st.session_state['comp_input'], st.session_state['comp_key'], True, output_format)
                
                if st.session_state['comp_type'] == "Text":
                    st.code(output_s44, language="text")
                else:
                    st.write(output_s44)
            except Exception as e:
                st.error(f"Error: {e}")

        st.markdown("---")
        
        # 2. Tampilan Metrik Kriptografi (Tabel & Grafik)
        st.subheader("📊 Cryptographic Metrics Analysis")
        
        # Hitung Metrics
        with st.spinner('Menghitung metrik kriptografi...'):
            metrics_std = get_metrics(False)
            metrics_s44 = get_metrics(True)

        data = {
            'Metric': ['Non-Linearity (Ideal 112)', 'SAC (Ideal 0.5)', 'BIC-NL', 'BIC-SAC', 'LAP (Ideal 0.5)', 'DAP (Ideal 0.5)', 'TO (Ideal 0.0)', 'Encryption Time (ms)'],
            'AES Standard': metrics_std,
            'AES S-Box44': metrics_s44
        }
        df = pd.DataFrame(data)
        st.table(df)

        # Visualisasi Data (Opsional)
        st.markdown("#### Waktu Eksekusi")
        time_chart_data = pd.DataFrame({
            'Engine': ['AES Standard', 'AES S-Box44'],
            'Time (ms)': [metrics_std[3], metrics_s44[3]]
        }).set_index('Engine')
        st.bar_chart(time_chart_data)

        st.markdown("---")
        st.markdown("**Analisis Metrik**")
        
        # === AUTO CONCLUSION BASED ON REAL METRICS ===
        nl_std, sac_std, bic_nl_std, bic_sac_std, lap_std, dap_std, to_std, t_std = metrics_std
        nl_s44, sac_s44, bic_nl_s44, bic_sac_s44, lap_s44, dap_s44, to_s44, t_s44 = metrics_s44
        
        st.markdown("**Non-Linearity**")
        if nl_std > nl_s44:
            st.write("AES Standard menunjukkan non-linearity lebih tinggi, sehingga potensi ketahanannya terhadap serangan linier lebih baik.")
        elif nl_std < nl_s44:
            st.write("AES S-Box44 memiliki non-linearity lebih tinggi, yang mengindikasikan ketahanan lebih baik terhadap serangan linier.")
        else:
            st.write("Kedua metode memiliki non-linearity yang sama.")
            
        conclusion = [] # kesimpulan otomatis

        # Non-linearity
        if nl_std > nl_s44:
            st.write("AES Standard menunjukkan non-linearity lebih tinggi, sehingga potensi ketahanannya terhadap serangan linier lebih baik.")
        elif nl_std < nl_s44:
            st.write("AES S-Box44 memiliki non-linearity lebih tinggi, yang mengindikasikan ketahanan lebih baik terhadap serangan linier.")
        else:
            st.write("Kedua metode memiliki non-linearity yang sama.")

        # SAC
        if sac_std > sac_s44:
            st.write("AES Standard menunjukkan SAC lebih tinggi, sehingga difusinya sedikit lebih baik.")
        elif sac_std < sac_s44:
            st.write("AES S-Box44 memiliki SAC lebih tinggi, yang mengindikasikan difusinya lebih optimal.")
        else:
            st.write("Kedua metode memiliki SAC yang sama.")

        # BIC-NL
        if bic_nl_std > bic_nl_s44:
            st.write("AES Standard menunjukkan BIC-NL lebih tinggi, sehingga potensi ketahanannya terhadap serangan linier lebih baik.")
        elif bic_nl_std < bic_nl_s44:
            st.write("AES S-Box44 memiliki BIC-NL lebih tinggi, yang mengindikasikan ketahanan lebih baik terhadap serangan linier.")
        else:
            st.write("Kedua metode memiliki BIC-NL yang sama.")

        # LAP
        if lap_std > lap_s44:
            st.write("AES Standard menunjukkan LAP lebih tinggi, sehingga stabilitasnya terhadap perubahan bit input lebih baik.")
        elif lap_std < lap_s44:
            st.write("AES S-Box44 memiliki LAP lebih tinggi, yang mengindikasikan stabilitasnya lebih baik terhadap perubahan bit input.")
        else:
            st.write("Kedua metode memiliki LAP yang sama.")

        # DAP
        if dap_std > dap_s44:
            st.write("AES Standard menunjukkan DAP lebih tinggi, sehingga difusi idealnya lebih baik.")
        elif dap_std < dap_s44:
            st.write("AES S-Box44 memiliki DAP lebih tinggi, yang mengindikasikan difusi idealnya lebih baik.")
        else:
            st.write("Kedua metode memiliki DAP yang sama.")

        # Execution Time
        if t_std < t_s44:
            st.write(f"Waktu enkripsi AES Standard lebih cepat (selisih {t_s44 - t_std} ms).")
        elif t_std > t_s44:
            st.write(f"Waktu enkripsi AES S-Box44 lebih cepat (selisih {t_std - t_s44} ms).")
        else:
            st.write("Kedua metode memiliki waktu enkripsi yang sama.")

        st.markdown("### 🔍 Kesimpulan Otomatis Berdasarkan Metrik")
        for c in conclusion:
            st.write("• " + c)

        # TO
        if to_std > to_s44:
            st.write("AES Standard menunjukkan TO lebih tinggi, sehingga transparansi lebih baik.")
        elif to_std < to_s44:
            st.write("AES S-Box44 memiliki TO lebih tinggi, yang mengindikasikan transparansi lebih baik.")
        else:
            st.write("Kedua metode memiliki TO yang sama.")

        # Ringkasan final opsional
        if nl_s44 > nl_std and abs(sac_s44 - 0.5) < abs(sac_std - 0.5):
            final_summary = "⛳ Secara keseluruhan, AES S-Box44 menunjukkan keunggulan yang lebih kuat dalam aspek keamanan."
        elif t_std < t_s44:
            final_summary = "⚡ AES Standard lebih unggul dari sisi kecepatan sehingga cocok untuk implementasi real-time."
        else:
            final_summary = "🔁 Kedua mesin memiliki kelebihan masing-masing dan pemilihan tergantung kebutuhan sistem."

        st.success(final_summary)