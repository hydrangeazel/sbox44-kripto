import streamlit as st
from components.ui_text import render_text_ui
from components.ui_image import render_image_ui
from components.ui_comparison import render_comparison_ui

# Konfigurasi Halaman
st.set_page_config(
    page_title="Encryption Decryption Using Different AES S-Box",
    page_icon="🔐",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Fungsi untuk memuat CSS local
def local_css(file_name):
    with open(file_name) as f:
        st.markdown(f'<style>{f.read()}</style>', unsafe_allow_html=True)

# Load CSS
local_css("assets/ui.css")

# Sidebar Navigasi
st.sidebar.title("🔐 AES Crypto Tool")
st.sidebar.markdown("---")
menu = st.sidebar.radio(
    "Pilih Mode:",
    ("Text Encryption", "Image Encryption", "S-Box Comparison")
)

st.sidebar.markdown("---")
st.sidebar.info(
    """
    **Team Project**
    - Rahima Ratna Dewanti/2304130107
    - Muthia Nis Tiadah/2304130117
    - Zulfa Mardlotillah/2340130135
    """
)

# Routing Halaman
if menu == "Text Encryption":
    render_text_ui()
elif menu == "Image Encryption":
    render_image_ui()
elif menu == "S-Box Comparison":
    render_comparison_ui()