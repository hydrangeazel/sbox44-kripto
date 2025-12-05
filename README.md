# SBox44-Kripto

Proyek enkripsi dan dekripsi menggunakan AES dengan S-Box kustom (S-Box44).

## Deskripsi

Aplikasi web berbasis Streamlit untuk enkripsi/dekripsi teks dan gambar menggunakan AES dengan dua varian:
- **AES Standard**: Menggunakan S-box standar AES
- **AES S-Box44**: Menggunakan S-box kustom (S-Box44)

## Fitur

- ✅ Enkripsi dan dekripsi teks dengan mode ECB dan CBC
- ✅ Enkripsi dan dekripsi gambar
- ✅ Perbandingan performa antara AES Standard dan AES S-Box44
- ✅ Analisis metrik kriptografi (NL, SAC, BIC-NL, BIC-SAC, LAP, DAP)

## Instalasi

1. Clone repository ini
2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Menjalankan Aplikasi

```bash
streamlit run app.py
```

## Struktur Proyek

```
SBox44-Kripto/
├── aes_engine/          # Engine AES (standard dan S-Box44)
├── analytics/           # Fungsi analisis kriptografi
├── components/          # Komponen UI Streamlit
├── image_engine/        # Engine enkripsi/dekripsi gambar
├── assets/              # File assets (CSS, S-Box44 JSON)
├── app.py              # Aplikasi utama
└── requirements.txt    # Dependencies
```

## Tim

- Rahima Ratna Dewanti/2304130107
- Muthia Nis Tiadah/2304130117
- Zulfa Mardlotillah/2340130135