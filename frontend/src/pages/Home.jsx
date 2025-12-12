import React from 'react'
import { Link } from 'react-router-dom'
import './Home.css'

const Home = () => {
  return (
    <div className="home">
      <div className="home-hero">
        <h1 className="home-title">🔐 AES Crypto Tool</h1>
        <p className="home-subtitle">
          Aplikasi enkripsi dan dekripsi menggunakan AES dengan S-Box kustom
        </p>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📝</div>
          <h3>Text Encryption</h3>
          <p>Enkripsi dan dekripsi teks menggunakan AES Standard atau AES S-Box44</p>
          <Link to="/text" className="feature-link">
            Mulai →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🖼️</div>
          <h3>Image Encryption</h3>
          <p>Enkripsi dan dekripsi gambar dengan berbagai mode AES</p>
          <Link to="/image" className="feature-link">
            Mulai →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">⚖️</div>
          <h3>S-Box Comparison</h3>
          <p>Bandingkan performa antara AES Standard dan AES S-Box44</p>
          <Link to="/comparison" className="feature-link">
            Mulai →
          </Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔧</div>
          <h3>AES S-Box Modifier</h3>
          <p>Buat dan evaluasi kandidat S-box baru menggunakan matriks affine kustom</p>
          <Link to="/sbox-modifier" className="feature-link">
            Mulai →
          </Link>
        </div>
      </div>

      <div className="home-info">
        <h2>Team Project</h2>
        <ul>
          <li>Rahima Ratna Dewanti / 2304130107</li>
          <li>Muthia Nis Tiadah / 2304130117</li>
          <li>Zulfa Mardlotillah / 2340130135</li>
        </ul>
      </div>
    </div>
  )
}

export default Home

