import streamlit as st
from PIL import Image
import io
import time

from image_engine.encoder import encrypt_image
from image_engine.decoder import decrypt_image

def render_image_ui():
    st.title("🖼️ Image Encryption")
    st.markdown("Amankan gambar Anda dengan enkripsi AES block-based.")

    engine_type = st.selectbox("Pilih Metode:", ["AES Standard", "AES S-Box44"])
    key = st.text_input("Masukkan Kunci Gambar (16 chars):", max_chars=16, type="password")

    uploaded_file = st.file_uploader("Upload Gambar (PNG/JPG)", type=["png", "jpg", "jpeg"])

    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption="Gambar Asli", use_column_width=True)

        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("🔒 Enkripsi Gambar"):
                if len(key) != 16:
                    st.error("Key wajib 16 karakter!")
                else:
                    with st.spinner('Memproses piksel...'):
                        use_sbox44 = engine_type == "AES S-Box44"
                        encrypted_img = encrypt_image(image, key, use_sbox44=use_sbox44)
                        st.session_state['enc_image'] = encrypted_img
                        st.session_state['enc_key'] = key
                        st.session_state['enc_use_sbox44'] = use_sbox44
                        st.success("Gambar terenkripsi!")

        with col2:
            if st.button("🔓 Dekripsi Gambar"):
                if 'enc_image' not in st.session_state:
                    st.error("Tidak ada gambar terenkripsi.")
                elif len(key) != 16:
                    st.error("Key wajib 16 karakter!")
                else:
                    try:
                        use_sbox44 = st.session_state.get('enc_use_sbox44', False)
                        decrypted_img = decrypt_image(
                            st.session_state['enc_image'], 
                            key, 
                            use_sbox44=use_sbox44
                        )
                        st.session_state['dec_image'] = decrypted_img
                        st.success("Gambar berhasil dipulihkan!")
                    except Exception as e:
                        st.error(f"Gagal mendekripsi: {e}")

        # Menampilkan hasil enkripsi jika ada
        if 'enc_image' in st.session_state:
            st.markdown("---")
            st.subheader("Hasil Enkripsi")
            st.image(st.session_state['enc_image'], caption=f"Encrypted with {engine_type}", use_column_width=True)
            
            # Tombol Download
            buf = io.BytesIO()
            st.session_state['enc_image'].save(buf, format="PNG")
            byte_im = buf.getvalue()
            
            st.download_button(
                label="⬇️ Download Encrypted Image",
                data=byte_im,
                file_name="encrypted_image.png",
                mime="image/png"
            )
        
        # Menampilkan hasil dekripsi jika ada
        if 'dec_image' in st.session_state:
            st.markdown("---")
            st.subheader("Hasil Dekripsi")
            st.image(st.session_state['dec_image'], caption="Decrypted Image", use_column_width=True)