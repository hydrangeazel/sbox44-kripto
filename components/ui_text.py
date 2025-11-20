import streamlit as st
import time

# TODO: Nanti Import engine dari Person 1 di sini
# from aes_engine.aes_standard import encrypt_text, decrypt_text
# from aes_engine.aes_sbox44 import encrypt_text_sbox44

def render_text_ui():
    st.title("📝 Text Encryption")
    st.markdown("Enkripsi dan dekripsi pesan teks menggunakan AES.")

    # Pilihan Engine
    engine_type = st.selectbox("Pilih Metode Enkripsi:", ["AES Standard", "AES S-Box44 (Custom)"])

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Input")
        plaintext = st.text_area("Masukkan Plaintext:", height=150, placeholder="Ketik pesan rahasia di sini...")
        key = st.text_input("Masukkan Kunci (16 Karakter):", max_chars=16, type="password")
        
        # Validasi Key sederhana
        if key and len(key) < 16:
            st.warning("Key harus 16 karakter untuk AES-128!")

        if st.button("🔒 Enkripsi Teks"):
            if not plaintext or len(key) != 16:
                st.error("Mohon lengkapi teks dan kunci (16 char).")
            else:
                with st.spinner('Mengenkripsi...'):
                    time.sleep(0.5) # Simulasi loading
                    
                    # --- MOCK LOGIC (Ganti dengan fungsi backend nanti) ---
                    if engine_type == "AES Standard":
                        ciphertext = f"[STD-ENC] {plaintext[::-1]}" # Contoh: Membalik teks
                    else:
                        ciphertext = f"[S44-ENC] {plaintext[::-1]}"
                    # ------------------------------------------------------
                    
                    st.session_state['last_ciphertext'] = ciphertext
                    st.success("Enkripsi Berhasil!")

    with col2:
        st.subheader("Output (Ciphertext)")
        result = st.session_state.get('last_ciphertext', '')
        st.text_area("Hasil Enkripsi:", value=result, height=150, disabled=True)
        
        if st.button("🔓 Dekripsi Teks"):
            if not result or len(key) != 16:
                st.error("Belum ada ciphertext atau kunci salah.")
            else:
                # --- MOCK LOGIC ---
                decrypted = result.replace("[STD-ENC] ", "").replace("[S44-ENC] ", "")[::-1]
                # ------------------
                st.info(f"Hasil Dekripsi: **{decrypted}**")

    # Panel Analisis Sederhana (Placeholder untuk tugas Person 1)
    if st.session_state.get('last_ciphertext'):
        st.markdown("---")
        st.subheader("📊 Quick Analysis")
        m1, m2, m3 = st.columns(3)
        m1.metric("Panjang Karakter", len(plaintext))
        m2.metric("Entropy (Bit)", "4.25") # Data dummy
        m3.metric("Waktu Eksekusi", "0.045ms")