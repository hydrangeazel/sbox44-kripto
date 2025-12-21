import React, { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import './ImageEncryptionInterface.css'

const API_BASE_URL = '/api'

const ImageEncryptionInterface = () => {
  const [mode, setMode] = useState('ECB')
  const [algorithm, setAlgorithm] = useState('standard')
  const [key, setKey] = useState('')
  const [originalImage, setOriginalImage] = useState(null)
  const [originalFile, setOriginalFile] = useState(null)
  const [encryptedImage, setEncryptedImage] = useState(null)
  const [decryptedImage, setDecryptedImage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)
  const dropZoneRef = useRef(null)

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setOriginalImage(event.target.result)
        setEncryptedImage(null)
        setDecryptedImage(null)
        setMetrics(null)
      }
      reader.readAsDataURL(file)
      setError(null)
    } else {
      setError('File harus berupa gambar (PNG/JPG)')
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setOriginalImage(event.target.result)
        setEncryptedImage(null)
        setDecryptedImage(null)
        setMetrics(null)
      }
      reader.readAsDataURL(file)
      setError(null)
    } else {
      setError('File harus berupa gambar (PNG/JPG)')
    }
  }, [])

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
    setMetrics(null)

    try {
      const formData = new FormData()
      formData.append('image', originalFile)
      formData.append('key', key)
      formData.append('use_sbox44', algorithm === 'sbox44' ? 'true' : 'false')
      formData.append('mode', mode.toLowerCase())

      const apiResponse = await axios.post(`${API_BASE_URL}/encrypt-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setEncryptedImage(`data:image/png;base64,${apiResponse.data.image_b64}`)
      
      // Fetch metrics if available
      if (apiResponse.data.metrics) {
        setMetrics(apiResponse.data.metrics)
      } else {
        // Try to fetch metrics separately
        try {
          const metricsResponse = await axios.post(`${API_BASE_URL}/image-metrics`, {
            original_image: originalImage,
            encrypted_image: `data:image/png;base64,${apiResponse.data.image_b64}`
          })
          setMetrics(metricsResponse.data)
        } catch (metricsError) {
          console.warn('Metrics not available:', metricsError)
        }
      }
      
      setSuccess('Gambar berhasil dienkripsi!')
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
      const response = await fetch(encryptedImage)
      const blob = await response.blob()
      
      const formData = new FormData()
      formData.append('image', blob, 'encrypted_image.png')
      formData.append('key', key)
      formData.append('use_sbox44', algorithm === 'sbox44' ? 'true' : 'false')
      formData.append('mode', mode.toLowerCase())

      const apiResponse = await axios.post(`${API_BASE_URL}/decrypt-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setDecryptedImage(`data:image/png;base64,${apiResponse.data.image_b64}`)
      setSuccess('Gambar berhasil didekripsi!')
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
    <div className="image-encryption-interface">
      <div className="image-encryption-container">
        <h1 className="image-encryption-title">Image Encryption & Decryption</h1>
        
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

        {/* Controls Section */}
        <div className="image-encryption-controls">
          <div className="control-group">
            <label>Mode:</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="control-input"
            >
              <option value="ECB">ECB (Electronic Codebook)</option>
              <option value="CBC">CBC (Cipher Block Chaining)</option>
              <option value="CFB">CFB (Cipher Feedback)</option>
            </select>
          </div>

          <div className="control-group">
            <label>Algorithm:</label>
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
              className="control-input"
            >
              <option value="standard">AES Standard</option>
              <option value="sbox44">AES S-Box44</option>
            </select>
          </div>

          <div className="control-group">
            <label>Key (16 characters):</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={16}
              placeholder="Enter 16-character key"
              className="control-input"
            />
            {key && key.length !== 16 && (
              <span className="warning">Key must be exactly 16 characters!</span>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="image-encryption-grid">
          {/* Left: Upload Panel */}
          <div className="image-encryption-column upload-column">
            <h2 className="column-title">Upload Image</h2>
            <div
              ref={dropZoneRef}
              className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleFileChange}
                className="file-input"
              />
              {originalImage ? (
                <div className="upload-preview">
                  <img src={originalImage} alt="Original" className="preview-image" />
                  <button
                    className="change-image-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      fileInputRef.current?.click()
                    }}
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <div className="upload-icon">📁</div>
                  <p className="upload-text">Drag & drop image here</p>
                  <p className="upload-subtext">or click to browse</p>
                  <p className="upload-hint">Supports PNG, JPG (Grayscale & RGB)</p>
                </div>
              )}
            </div>
            <div className="action-buttons">
              <button
                onClick={handleEncrypt}
                disabled={loading || !originalImage || key.length !== 16}
                className="btn-primary"
              >
                {loading ? 'Processing...' : '🔒 Encrypt Image'}
              </button>
              <button
                onClick={handleDecrypt}
                disabled={loading || !encryptedImage || key.length !== 16}
                className="btn-primary"
              >
                {loading ? 'Processing...' : '🔓 Decrypt Image'}
              </button>
            </div>
          </div>

          {/* Right: Output Preview */}
          <div className="image-encryption-column output-column">
            <h2 className="column-title">Encrypted Output</h2>
            <div className="output-preview">
              {encryptedImage ? (
                <div className="output-image-container">
                  <img src={encryptedImage} alt="Encrypted" className="preview-image" />
                  <div className="output-actions">
                    <button
                      onClick={() => handleDownload(encryptedImage, 'encrypted_image.png')}
                      className="btn-secondary"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="output-placeholder">
                  <div className="placeholder-icon">🔐</div>
                  <p className="placeholder-text">Encrypted image will appear here</p>
                </div>
              )}
            </div>
            {decryptedImage && (
              <div className="decrypted-section">
                <h3 className="decrypted-title">Decrypted Image</h3>
                <div className="output-image-container">
                  <img src={decryptedImage} alt="Decrypted" className="preview-image" />
                  <div className="output-actions">
                    <button
                      onClick={() => handleDownload(decryptedImage, 'decrypted_image.png')}
                      className="btn-secondary"
                    >
                      ⬇️ Download
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metrics Section */}
        {metrics && (
          <div className="metrics-section">
            <h3 className="metrics-title">Security Analysis Metrics</h3>
            <div className="metrics-grid">
              {metrics.npcr !== undefined && (
                <div className="metric-item">
                  <div className="metric-label">NPCR</div>
                  <div className="metric-value">{metrics.npcr?.toFixed(4) || 'N/A'}</div>
                  <div className="metric-description">Number of Pixel Change Rate</div>
                </div>
              )}
              {metrics.uaci !== undefined && (
                <div className="metric-item">
                  <div className="metric-label">UACI</div>
                  <div className="metric-value">{metrics.uaci?.toFixed(4) || 'N/A'}</div>
                  <div className="metric-description">Unified Average Changing Intensity</div>
                </div>
              )}
              {metrics.correlation !== undefined && (
                <div className="metric-item">
                  <div className="metric-label">Correlation</div>
                  <div className="metric-value">{metrics.correlation?.toFixed(4) || 'N/A'}</div>
                  <div className="metric-description">Correlation Coefficient</div>
                </div>
              )}
              {metrics.entropy !== undefined && (
                <div className="metric-item">
                  <div className="metric-label">Entropy</div>
                  <div className="metric-value">{metrics.entropy?.toFixed(4) || 'N/A'}</div>
                  <div className="metric-description">Information Entropy</div>
                </div>
              )}
              {metrics.histogram_uniformity !== undefined && (
                <div className="metric-item">
                  <div className="metric-label">Histogram Uniformity</div>
                  <div className="metric-value">{metrics.histogram_uniformity?.toFixed(4) || 'N/A'}</div>
                  <div className="metric-description">Histogram Distribution Uniformity</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ImageEncryptionInterface

