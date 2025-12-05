import base64
import streamlit as st

from aes_engine.modes import AESModes


def _get_default_state():
    if 'text_crypto' not in st.session_state:
        st.session_state['text_crypto'] = None


def render_text_ui():
    _get_default_state()

    st.title("📝 Text Encryption")
    st.markdown("Enkripsi dan dekripsi pesan teks menggunakan AES.")

    engine_type = st.selectbox("Pilih Metode Enkripsi:", ["AES Standard", "AES S-Box44 (Custom)"])
    mode = st.selectbox("Pilih Mode Operasi:", ["ECB", "CBC"])

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Input")
        plaintext = st.text_area("Masukkan Plaintext:", height=150, placeholder="Ketik pesan rahasia di sini...")
        key = st.text_input("Masukkan Kunci (16 Karakter):", max_chars=16, type="password")

        iv = ""
        if mode == "CBC":
            iv = st.text_input("Masukkan IV (16 Karakter):", max_chars=16, type="password")

        if key and len(key) != 16:
            st.warning("Key harus tepat 16 karakter untuk AES-128!")
        if mode == "CBC" and iv and len(iv) != 16:
            st.warning("IV harus tepat 16 karakter.")

        if st.button("🔒 Enkripsi Teks"):
            if not plaintext:
                st.error("Plaintext belum diisi.")
                return
            if len(key) != 16:
                st.error("Key wajib 16 karakter.")
                return
            if mode == "CBC" and len(iv) != 16:
                st.error("Mode CBC membutuhkan IV 16 karakter.")
                return

            try:
                use_sbox44 = engine_type == "AES S-Box44 (Custom)"
                cipher = AESModes(key, use_sbox44=use_sbox44)
                if mode == "ECB":
                    ciphertext_bytes = cipher.encrypt_ecb(plaintext)
                    iv_to_store = None
                else:
                    ciphertext_bytes = cipher.encrypt_cbc(plaintext, iv)
                    iv_to_store = iv

                st.session_state['text_crypto'] = {
                    'cipher_bytes': ciphertext_bytes,
                    'cipher_hex': ciphertext_bytes.hex(),
                    'cipher_b64': base64.b64encode(ciphertext_bytes).decode('utf-8'),
                    'plaintext': plaintext,
                    'key': key,
                    'mode': mode,
                    'iv': iv_to_store,
                    'use_sbox44': use_sbox44,
                }
                st.success("Enkripsi berhasil dijalankan!")
            except Exception as exc:
                st.error(f"Gagal mengenkripsi: {exc}")

    with col2:
        st.subheader("Output (Ciphertext)")
        crypto_state = st.session_state.get('text_crypto')
        cipher_textarea_value = crypto_state['cipher_hex'] if crypto_state else ''
        st.text_area("Ciphertext (Hex)", value=cipher_textarea_value, height=150, disabled=True)

        if crypto_state:
            st.caption(f"Base64: {crypto_state['cipher_b64']}")

        if st.button("🔓 Dekripsi Teks"):
            if not crypto_state:
                st.error("Belum ada ciphertext yang terenkripsi di sesi ini.")
                return
            if len(key) != 16:
                st.error("Key wajib 16 karakter untuk mendekripsi.")
                return
            if key != crypto_state['key']:
                st.warning("Key saat ini berbeda dengan key yang digunakan saat enkripsi.")

            try:
                cipher = AESModes(key, use_sbox44=crypto_state['use_sbox44'])
                if crypto_state['mode'] == "ECB":
                    decrypted = cipher.decrypt_ecb(crypto_state['cipher_bytes'])
                else:
                    decrypted = cipher.decrypt_cbc(crypto_state['cipher_bytes'], crypto_state['iv'])
                st.info(f"Hasil Dekripsi: **{decrypted.decode('utf-8', errors='ignore')}**")
            except Exception as exc:
                st.error(f"Gagal mendekripsi: {exc}")

    if st.session_state.get('text_crypto'):
        st.markdown("---")
        st.subheader("📊 Quick Analysis")
        stored = st.session_state['text_crypto']
        m1, m2, m3 = st.columns(3)
        m1.metric("Panjang Plaintext", len(stored['plaintext']))
        m2.metric("Panjang Ciphertext (byte)", len(stored['cipher_bytes']))
        m3.metric("Engine", "S-Box44" if stored['use_sbox44'] else "Standard")