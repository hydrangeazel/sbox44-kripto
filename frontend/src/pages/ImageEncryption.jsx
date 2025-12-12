import React, { useState, useRef } from 'react'
import axios from 'axios'
import './Page.css'
import './ImageEncryption.css'

const API_BASE_URL = '/api'

const ImageEncryption = () => {
  const [engineType, setEngineType] = useState('standard')
  const [key, setKey] = useState('')
  const [originalImage, setOriginalImage] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [encryptedImage, setEncryptedImage] = useState(null)
  const [decryptedImage, setDecryptedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [useSbox44, setUseSbox44] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('File harus berupa gambar (PNG/JPG)')
        return
      }
      setOriginalFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setOriginalImage(event.target.result)
        setEncryptedImage(null)
        setDecryptedImage(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEncrypt = async () => {
    if (!originalImage) {
      setError('Upload gambar terlebih dahulu!')
      return
    }
    if (key.length !== 16) {
      setError('Key wajib 16 karakter!')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const formData = new FormData()
      formData.append('image', originalFile)
      formData.append('key', key)
      formData.append('use_sbox44', engineType === 'sbox44' ? 'true' : 'false')

      const apiResponse = await axios.post(`${API_BASE_URL}/encrypt-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setEncryptedImage(`data:image/png;base64,${apiResponse.data.image_b64}`)
      setUseSbox44(engineType === 'sbox44')
      setSuccess('Gambar terenkripsi!')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Gagal mengenkripsi gambar')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!encryptedImage) {
      setError('Tidak ada gambar terenkripsi.')
      return
    }
    if (key.length !== 16) {
      setError('Key wajib 16 karakter!')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Convert base64 to blob
      const response = await fetch(encryptedImage)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('image', blob, 'encrypted_image.png')
      formData.append('key', key)
      formData.append('use_sbox44', useSbox44 ? 'true' : 'false')

      const apiResponse = await axios.post(`${API_BASE_URL}/decrypt-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setDecryptedImage(`data:image/png;base64,${apiResponse.data.image_b64}`)
      setSuccess('Gambar berhasil dipulihkan!')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Gagal mendekripsi gambar')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = (imageData, filename) => {
    const link = document.createElement('a')
    link.href = imageData
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Auto-hide messages
  React.useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="page image-encryption">
      <h1>🖼️ Image Encryption</h1>
      <p>Amankan gambar Anda dengan enkripsi AES block-based.</p>

      {error && (
        <div className="message error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="message success">
          <strong>✅ Sukses:</strong> {success}
        </div>
      )}

      <div className="image-controls">
        <div className="control-group">
          <label>Pilih Metode:</label>
          <select
            value={engineType}
            onChange={(e) => setEngineType(e.target.value)}
            className="control-input"
          >
            <option value="standard">AES Standard</option>
            <option value="sbox44">AES S-Box44</option>
          </select>
        </div>

        <div className="control-group">
          <label>Masukkan Kunci Gambar (16 chars):</label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            maxLength={16}
            placeholder="Masukkan kunci 16 karakter"
            className="control-input"
          />
          {key && key.length !== 16 && (
            <span className="warning">Key harus tepat 16 karakter!</span>
          )}
        </div>

        <div className="control-group file-upload">
          <label>Upload Gambar (PNG/JPG):</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileChange}
            className="file-input"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            📁 Pilih File
          </button>
        </div>
      </div>

      {originalImage && (
        <div className="image-section">
          <h3>Gambar Asli</h3>
          <div className="image-container">
            <img src={originalImage} alt="Original" className="preview-image" />
          </div>
          <div className="button-group">
            <button
              onClick={handleEncrypt}
              disabled={loading || key.length !== 16}
              className="btn-primary"
            >
              {loading ? 'Memproses...' : '🔒 Enkripsi Gambar'}
            </button>
          </div>
        </div>
      )}

      {encryptedImage && (
        <div className="image-section">
          <h3>Hasil Enkripsi</h3>
          <div className="image-container">
            <img src={encryptedImage} alt="Encrypted" className="preview-image" />
          </div>
          <div className="button-group">
            <button
              onClick={handleDecrypt}
              disabled={loading || key.length !== 16}
              className="btn-primary"
            >
              {loading ? 'Memproses...' : '🔓 Dekripsi Gambar'}
            </button>
            <button
              onClick={() => handleDownload(encryptedImage, 'encrypted_image.png')}
              className="btn-secondary"
            >
              ⬇️ Download Encrypted Image
            </button>
          </div>
        </div>
      )}

      {decryptedImage && (
        <div className="image-section">
          <h3>Hasil Dekripsi</h3>
          <div className="image-container">
            <img src={decryptedImage} alt="Decrypted" className="preview-image" />
          </div>
          <div className="button-group">
            <button
              onClick={() => handleDownload(decryptedImage, 'decrypted_image.png')}
              className="btn-secondary"
            >
              ⬇️ Download Decrypted Image
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageEncryption
