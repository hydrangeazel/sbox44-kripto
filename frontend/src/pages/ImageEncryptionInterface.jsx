import React, { useState, useRef, useCallback } from 'react'
import axios from 'axios'
import './ImageEncryptionInterface.css'

const API_BASE_URL = '/api'

// Helper function to load image and get pixel data
const loadImagePixels = (imageSrc) => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve(imageData)
    }
    img.onerror = reject
    img.src = imageSrc
  })
}

// Calculate Entropy
const calculateEntropy = (imageData) => {
  const pixels = imageData.data
  const histogram = new Array(256).fill(0)
  let totalPixels = 0

  // Count pixel values (using grayscale: average of RGB)
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const gray = Math.round((r + g + b) / 3)
    histogram[gray]++
    totalPixels++
  }

  // Calculate entropy
  let entropy = 0
  for (let i = 0; i < 256; i++) {
    if (histogram[i] > 0) {
      const probability = histogram[i] / totalPixels
      entropy -= probability * Math.log2(probability)
    }
  }

  return entropy
}

// Calculate NPCR (Number of Pixel Change Rate)
const calculateNPCR = (originalData, encryptedData) => {
  if (originalData.width !== encryptedData.width || originalData.height !== encryptedData.height) {
    return null
  }

  const originalPixels = originalData.data
  const encryptedPixels = encryptedData.data
  let differentPixels = 0
  let totalPixels = originalData.width * originalData.height

  // Compare pixel by pixel
  for (let i = 0; i < originalPixels.length; i += 4) {
    const origR = originalPixels[i]
    const origG = originalPixels[i + 1]
    const origB = originalPixels[i + 2]
    
    const encR = encryptedPixels[i]
    const encG = encryptedPixels[i + 1]
    const encB = encryptedPixels[i + 2]

    // Check if pixel is different
    if (origR !== encR || origG !== encG || origB !== encB) {
      differentPixels++
    }
  }

  // NPCR as percentage
  return differentPixels / totalPixels
}

// Calculate UACI (Unified Average Changing Intensity)
const calculateUACI = (originalData, encryptedData) => {
  if (originalData.width !== encryptedData.width || originalData.height !== encryptedData.height) {
    return null
  }

  const originalPixels = originalData.data
  const encryptedPixels = encryptedData.data
  let totalDifference = 0
  let totalPixels = originalData.width * originalData.height

  // Calculate average intensity difference
  for (let i = 0; i < originalPixels.length; i += 4) {
    const origR = originalPixels[i]
    const origG = originalPixels[i + 1]
    const origB = originalPixels[i + 2]
    const origGray = (origR + origG + origB) / 3
    
    const encR = encryptedPixels[i]
    const encG = encryptedPixels[i + 1]
    const encB = encryptedPixels[i + 2]
    const encGray = (encR + encG + encB) / 3

    totalDifference += Math.abs(origGray - encGray)
  }

  // UACI as percentage (normalized by 255)
  return (totalDifference / totalPixels) / 255
}

// Calculate Correlation Coefficients
const calculateCorrelation = (imageData, direction = 'horizontal') => {
  const pixels = imageData.data
  const width = imageData.width
  const height = imageData.height
  const pairs = []

  // Get adjacent pixel pairs based on direction
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let nextX = x
      let nextY = y

      if (direction === 'horizontal' && x < width - 1) {
        nextX = x + 1
        nextY = y
      } else if (direction === 'vertical' && y < height - 1) {
        nextX = x
        nextY = y + 1
      } else if (direction === 'diagonal' && x < width - 1 && y < height - 1) {
        nextX = x + 1
        nextY = y + 1
      } else {
        continue
      }

      const idx1 = (y * width + x) * 4
      const idx2 = (nextY * width + nextX) * 4

      const gray1 = (pixels[idx1] + pixels[idx1 + 1] + pixels[idx1 + 2]) / 3
      const gray2 = (pixels[idx2] + pixels[idx2 + 1] + pixels[idx2 + 2]) / 3

      pairs.push({ x: gray1, y: gray2 })
    }
  }

  if (pairs.length === 0) return 0

  // Calculate mean
  const meanX = pairs.reduce((sum, p) => sum + p.x, 0) / pairs.length
  const meanY = pairs.reduce((sum, p) => sum + p.y, 0) / pairs.length

  // Calculate correlation coefficient
  let numerator = 0
  let sumSqX = 0
  let sumSqY = 0

  for (const pair of pairs) {
    const diffX = pair.x - meanX
    const diffY = pair.y - meanY
    numerator += diffX * diffY
    sumSqX += diffX * diffX
    sumSqY += diffY * diffY
  }

  const denominator = Math.sqrt(sumSqX * sumSqY)
  if (denominator === 0) return 0

  return numerator / denominator
}

// Calculate Histogram Uniformity
const calculateHistogramUniformity = (imageData) => {
  const pixels = imageData.data
  const histogram = new Array(256).fill(0)
  let totalPixels = 0

  // Build histogram
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const gray = Math.round((r + g + b) / 3)
    histogram[gray]++
    totalPixels++
  }

  // Calculate expected frequency (uniform distribution)
  const expectedFreq = totalPixels / 256

  // Calculate chi-square statistic for uniformity
  let chiSquare = 0
  for (let i = 0; i < 256; i++) {
    const observed = histogram[i]
    const expected = expectedFreq
    if (expected > 0) {
      chiSquare += Math.pow(observed - expected, 2) / expected
    }
  }

  // Normalize to 0-1 range (lower is more uniform)
  // Using inverse of normalized chi-square
  const maxChiSquare = totalPixels * 255 // theoretical maximum
  const uniformity = 1 - (chiSquare / maxChiSquare)

  return Math.max(0, Math.min(1, uniformity))
}

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

      const encryptedImageData = `data:image/png;base64,${apiResponse.data.image_b64}`
      setEncryptedImage(encryptedImageData)
      
      // Calculate metrics client-side
      try {
        // Load both images
        const [originalPixels, encryptedPixels] = await Promise.all([
          loadImagePixels(originalImage),
          loadImagePixels(encryptedImageData)
        ])

        // Calculate Entropy for encrypted image
        const entropy = calculateEntropy(encryptedPixels)

        // Calculate NPCR
        const npcr = calculateNPCR(originalPixels, encryptedPixels)

        // Calculate UACI
        const uaci = calculateUACI(originalPixels, encryptedPixels)

        // Calculate Correlation Coefficients for encrypted image
        const correlationHorizontal = calculateCorrelation(encryptedPixels, 'horizontal')
        const correlationVertical = calculateCorrelation(encryptedPixels, 'vertical')
        const correlationDiagonal = calculateCorrelation(encryptedPixels, 'diagonal')

        // Calculate Histogram Uniformity for encrypted image
        const histogramUniformity = calculateHistogramUniformity(encryptedPixels)

        // Set metrics
        const calculatedMetrics = {
          entropy: entropy,
          npcr: npcr,
          uaci: uaci,
          correlation_horizontal: correlationHorizontal,
          correlation_vertical: correlationVertical,
          correlation_diagonal: correlationDiagonal,
          histogram_uniformity: histogramUniformity,
          // Keep any metrics from API if available (will override calculated ones)
          ...(apiResponse.data.metrics || {})
        }

        setMetrics(calculatedMetrics)
      } catch (metricsError) {
        console.warn('Error calculating metrics:', metricsError)
        // Still try to use API metrics if available
        if (apiResponse.data.metrics) {
          setMetrics(apiResponse.data.metrics)
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

        {/* Metrics Analysis Section */}
        {metrics && (
          <div className="metrics-analysis-section">
            {/* Floating Blob Ornaments */}
            <div className="metrics-blobs">
              <div className="metrics-blob blob-1"></div>
              <div className="metrics-blob blob-2"></div>
              <div className="metrics-blob blob-3"></div>
            </div>

            {/* Title Section */}
            <div className="metrics-header">
              <h2 className="metrics-main-title">Security Metrics Results</h2>
              <p className="metrics-subtitle">
                Comprehensive cryptographic evaluation metrics reflecting the quality and strength of image encryption
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-dashboard-grid">
              {/* NPCR Card */}
              {metrics.npcr !== undefined && (
                <div className="metric-card npcr-card">
                  <div className="metric-card-header">
                    <div className="metric-name">
                      NPCR
                      <span className="metric-tooltip" data-tooltip="Number of Pixel Change Rate: Measures the percentage of different pixels between original and encrypted images. Higher values indicate better encryption quality.">
                        ℹ️
                      </span>
                    </div>
                  </div>
                  <div className="metric-visual">
                    <div className="metric-badge" style={{ '--value': `${Math.min(metrics.npcr * 100, 100)}%` }}>
                      <span className="badge-value">{(metrics.npcr * 100).toFixed(2)}%</span>
                    </div>
                    <div className="metric-progress-bar">
                      <div 
                        className="metric-progress-fill" 
                        style={{ width: `${Math.min(metrics.npcr * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="metric-description">Number of Pixel Change Rate</div>
                </div>
              )}

              {/* UACI Card */}
              {metrics.uaci !== undefined && (
                <div className="metric-card uaci-card">
                  <div className="metric-card-header">
                    <div className="metric-name">
                      UACI
                      <span className="metric-tooltip" data-tooltip="Unified Average Changing Intensity: Measures the average intensity difference between original and encrypted images. Ideal value is around 33.46%.">
                        ℹ️
                      </span>
                    </div>
                  </div>
                  <div className="metric-visual">
                    <div className="metric-badge" style={{ '--value': `${Math.min(metrics.uaci * 100, 100)}%` }}>
                      <span className="badge-value">{(metrics.uaci * 100).toFixed(2)}%</span>
                    </div>
                    <div className="metric-progress-bar">
                      <div 
                        className="metric-progress-fill" 
                        style={{ width: `${Math.min(metrics.uaci * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="metric-description">Unified Average Changing Intensity</div>
                </div>
              )}

              {/* Entropy Card */}
              {metrics.entropy !== undefined && (
                <div className="metric-card entropy-card">
                  <div className="metric-card-header">
                    <div className="metric-name">
                      Entropy
                      <span className="metric-tooltip" data-tooltip="Information Entropy: Measures the randomness and unpredictability of the encrypted image. Higher entropy (closer to 8) indicates better encryption.">
                        ℹ️
                      </span>
                    </div>
                  </div>
                  <div className="metric-visual">
                    <div className="entropy-gauge">
                      <svg className="gauge-svg" viewBox="0 0 200 120">
                        <path
                          className="gauge-track"
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          fill="none"
                          stroke="rgba(213, 105, 137, 0.2)"
                          strokeWidth="12"
                        />
                        <path
                          className="gauge-fill"
                          d="M 20 100 A 80 80 0 0 1 180 100"
                          fill="none"
                          stroke="url(#entropyGradient)"
                          strokeWidth="12"
                          strokeDasharray={`${(metrics.entropy / 8) * 251.2} 251.2`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="entropyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#D56989" />
                            <stop offset="50%" stopColor="#EA9CAF" />
                            <stop offset="100%" stopColor="#C2DC80" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="gauge-value">{metrics.entropy?.toFixed(4) || 'N/A'}</div>
                      <div className="gauge-label">/ 8.0</div>
                    </div>
                  </div>
                  <div className="metric-description">Information Entropy</div>
                </div>
              )}

              {/* Correlation Coefficients Card */}
              {(metrics.correlation_horizontal !== undefined || metrics.correlation_vertical !== undefined || metrics.correlation_diagonal !== undefined || metrics.correlation !== undefined) && (
                <div className="metric-card correlation-card">
                  <div className="metric-card-header">
                    <div className="metric-name">
                      Correlation Coefficients
                      <span className="metric-tooltip" data-tooltip="Measures the correlation between adjacent pixels. Lower values (closer to 0) indicate better encryption by breaking pixel correlations.">
                        ℹ️
                      </span>
                    </div>
                  </div>
                  <div className="metric-visual">
                    <div className="correlation-bars">
                      {metrics.correlation_horizontal !== undefined && (
                        <div className="correlation-bar-item">
                          <span className="bar-label">Horizontal</span>
                          <div className="correlation-bar-container">
                            <div 
                              className="correlation-bar" 
                              style={{ width: `${Math.abs(metrics.correlation_horizontal) * 100}%` }}
                            ></div>
                          </div>
                          <span className="bar-value">{metrics.correlation_horizontal?.toFixed(4)}</span>
                        </div>
                      )}
                      {metrics.correlation_vertical !== undefined && (
                        <div className="correlation-bar-item">
                          <span className="bar-label">Vertical</span>
                          <div className="correlation-bar-container">
                            <div 
                              className="correlation-bar" 
                              style={{ width: `${Math.abs(metrics.correlation_vertical) * 100}%` }}
                            ></div>
                          </div>
                          <span className="bar-value">{metrics.correlation_vertical?.toFixed(4)}</span>
                        </div>
                      )}
                      {metrics.correlation_diagonal !== undefined && (
                        <div className="correlation-bar-item">
                          <span className="bar-label">Diagonal</span>
                          <div className="correlation-bar-container">
                            <div 
                              className="correlation-bar" 
                              style={{ width: `${Math.abs(metrics.correlation_diagonal) * 100}%` }}
                            ></div>
                          </div>
                          <span className="bar-value">{metrics.correlation_diagonal?.toFixed(4)}</span>
                        </div>
                      )}
                      {metrics.correlation !== undefined && !metrics.correlation_horizontal && !metrics.correlation_vertical && !metrics.correlation_diagonal && (
                        <div className="correlation-bar-item">
                          <span className="bar-label">Overall</span>
                          <div className="correlation-bar-container">
                            <div 
                              className="correlation-bar" 
                              style={{ width: `${Math.abs(metrics.correlation) * 100}%` }}
                            ></div>
                          </div>
                          <span className="bar-value">{metrics.correlation?.toFixed(4)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="metric-description">Pixel Correlation Analysis</div>
                </div>
              )}

              {/* Histogram Uniformity Card */}
              {metrics.histogram_uniformity !== undefined && (
                <div className="metric-card histogram-card">
                  <div className="metric-card-header">
                    <div className="metric-name">
                      Histogram Uniformity
                      <span className="metric-tooltip" data-tooltip="Measures how uniformly distributed the pixel values are in the encrypted image. Higher uniformity indicates better encryption.">
                        ℹ️
                      </span>
                    </div>
                  </div>
                  <div className="metric-visual">
                    <div className="histogram-visualization">
                      {originalImage && encryptedImage && (
                        <div className="histogram-comparison">
                          <div className="histogram-preview">
                            <div className="histogram-label">Original</div>
                            <div className="histogram-placeholder">📊</div>
                          </div>
                          <div className="histogram-preview">
                            <div className="histogram-label">Encrypted</div>
                            <div className="histogram-placeholder">📊</div>
                          </div>
                        </div>
                      )}
                      <div className="uniformity-value">{metrics.histogram_uniformity?.toFixed(4) || 'N/A'}</div>
                    </div>
                  </div>
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

