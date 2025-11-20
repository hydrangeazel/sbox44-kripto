import streamlit as st
import pandas as pd
import numpy as np

def render_comparison_ui():
    st.title("⚖️ Performance Comparison")
    st.markdown("Perbandingan langsung antara **AES Standard** dan **AES S-Box44**.")

    # Tab Navigasi
    tab1, tab2 = st.tabs(["📊 Metrics Analysis", "👀 Visual Comparison"])

    with tab1:
        st.subheader("Cryptographic Metrics")
        
        # --- MOCK DATA (Nanti ambil dari analytics/ Person 1) ---
        data = {
            'Metric': ['Non-Linearity', 'SAC (Avalanche)', 'BIC-NL', 'Encryption Time (ms)'],
            'AES Standard': [112, 0.498, 112, 120],
            'AES S-Box44': [110, 0.502, 108, 125]
        }
        df = pd.DataFrame(data)
        st.table(df)

        # Chart Perbandingan
        st.subheader("Avalanche Effect Comparison")
        chart_data = pd.DataFrame(
            np.random.rand(20, 2), # Dummy data random
            columns=['AES Standard', 'AES S-Box44']
        )
        st.line_chart(chart_data)
        st.caption("Grafik di atas menunjukkan penyebaran bit (Avalanche Effect) per round.")

    with tab2:
        st.subheader("Visual Ciphertext Comparison")
        test_input = st.text_input("Test Input untuk Perbandingan:", value="Universitas Dian Nuswantoro")
        
        col_std, col_custom = st.columns(2)
        
        with col_std:
            st.info("AES Standard")
            # Mock result
            st.code("a1 b2 c3 d4 ... (Hex)", language="text")
            st.metric("Confusion Score", "98%")

        with col_custom:
            st.success("AES S-Box44")
            # Mock result
            st.code("x9 y8 z7 w6 ... (Hex)", language="text")
            st.metric("Confusion Score", "99%")
            
        st.markdown("---")
        st.markdown("**Kesimpulan Sementara:**")
        st.markdown("""
        S-Box44 menunjukkan karakteristik SAC yang mendekati ideal (0.5) namun dengan waktu eksekusi yang sedikit lebih lama dibandingkan standar.
        """)