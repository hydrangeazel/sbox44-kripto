import React, { useState } from 'react'
import axios from 'axios'
import './Page.css'
import './TextEncryption.css'

const API_BASE_URL = '/api'

const TextEncryption = () => {
  const [engineType, setEngineType] = useState('standard')
  const [mode, setMode] = useState('ECB')
  const [plaintext, setPlaintext] = useState('')
  const [key, setKey] = useState('')
  const [iv, setIv] = useState('')
  const [ciphertext, setCiphertext] = useState('')
  const [ciphertextB64, setCiphertextB64] = useState('')
  const [decryptedText, setDecryptedText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [cryptoState, setCryptoState] = useState(null)

  const handleEncrypt = async () => {
    if (!plaintext) {
      setError('Plaintext belum diisi.')
      return
    }
    if (key.length !== 16) {
      setError('Key wajib 16 karakter.')
      return
    }
    if (mode === 'CBC' && iv.length !== 16) {
      setError('Mode CBC membutuhkan IV 16 karakter.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/encrypt-text`, {
        plaintext,
        key,
        mode,
        iv: mode === 'CBC' ? iv : '',
        use_sbox44: engineType === 'sbox44'
      })

      setCiphertext(response.data.ciphertext_hex)
      setCiphertextB64(response.data.ciphertext_b64)
      setCryptoState({
        ciphertext_hex: response.data.ciphertext_hex,
        ciphertext_b64: response.data.ciphertext_b64,
        plaintext,
        key,
        mode,
        iv: mode === 'CBC' ? iv : null,
        use_sbox44: engineType === 'sbox44'
      })
      setSuccess('Enkripsi berhasil dijalankan!')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Gagal mengenkripsi')
    } finally {
      setLoading(false)
    }
  }

  const handleDecrypt = async () => {
    if (!cryptoState) {
      setError('Belum ada ciphertext yang terenkripsi di sesi ini.')
      return
    }
    if (key.length !== 16) {
      setError('Key wajib 16 karakter untuk mendekripsi.')
      return
    }
    if (key !== cryptoState.key) {
      setError('Key saat ini berbeda dengan key yang digunakan saat enkripsi.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await axios.post(`${API_BASE_URL}/decrypt-text`, {
        ciphertext_hex: cryptoState.ciphertext_hex,
        key,
        mode: cryptoState.mode,
        iv: cryptoState.iv || '',
        use_sbox44: cryptoState.use_sbox44
      })

      setDecryptedText(response.data.plaintext)
      setSuccess('Dekripsi berhasil!')
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Gagal mendekripsi')
    } finally {
      setLoading(false)
    }
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
    <div className="page text-encryption">
      <h1>📝 Text Encryption</h1>
      <p>Enkripsi dan dekripsi pesan teks menggunakan AES.</p>

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

      <div className="encryption-controls">
        <div className="control-group">
          <label>Pilih Metode Enkripsi:</label>
          <select
            value={engineType}
            onChange={(e) => setEngineType(e.target.value)}
            className="control-input"
          >
            <option value="standard">AES Standard</option>
            <option value="sbox44">AES S-Box44 (Custom)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Pilih Mode Operasi:</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="control-input"
          >
            <option value="ECB">ECB</option>
            <option value="CBC">CBC</option>
          </select>
        </div>
      </div>

      <div className="encryption-grid">
        <div className="encryption-column">
          <h2>Input</h2>
          
          <div className="input-group">
            <label>Masukkan Plaintext:</label>
            <textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Ketik pesan rahasia di sini..."
              rows={6}
              className="text-input"
            />
          </div>

          <div className="input-group">
            <label>Masukkan Kunci (16 Karakter):</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={16}
              placeholder="Masukkan kunci 16 karakter"
              className="control-input"
            />
            {key && key.length !== 16 && (
              <span className="warning">Key harus tepat 16 karakter untuk AES-128!</span>
            )}
          </div>

          {mode === 'CBC' && (
            <div className="input-group">
              <label>Masukkan IV (16 Karakter):</label>
              <input
                type="password"
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                maxLength={16}
                placeholder="Masukkan IV 16 karakter"
                className="control-input"
              />
              {iv && iv.length !== 16 && (
                <span className="warning">IV harus tepat 16 karakter.</span>
              )}
            </div>
          )}

          <button
            onClick={handleEncrypt}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Mengenkripsi...' : '🔒 Enkripsi Teks'}
          </button>
        </div>

        <div className="encryption-column">
          <h2>Output (Ciphertext)</h2>
          
          <div className="input-group">
            <label>Ciphertext (Hex):</label>
            <textarea
              value={ciphertext}
              readOnly
              rows={6}
              className="text-input"
              placeholder="Hasil enkripsi akan muncul di sini..."
            />
          </div>

          {ciphertextB64 && (
            <div className="input-group">
              <label>Base64:</label>
              <input
                type="text"
                value={ciphertextB64}
                readOnly
                className="control-input"
              />
            </div>
          )}

          <button
            onClick={handleDecrypt}
            disabled={loading || !cryptoState}
            className="btn-primary"
          >
            {loading ? 'Mendekripsi...' : '🔓 Dekripsi Teks'}
          </button>

          {decryptedText && (
            <div className="decrypted-result">
              <label>Hasil Dekripsi:</label>
              <div className="decrypted-text">{decryptedText}</div>
            </div>
          )}
        </div>
      </div>

      {cryptoState && (
        <div className="analysis-section">
          <h3>📊 Quick Analysis</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <span className="metric-label">Panjang Plaintext:</span>
              <span className="metric-value">{cryptoState.plaintext.length}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Panjang Ciphertext (byte):</span>
              <span className="metric-value">{cryptoState.ciphertext_hex.length / 2}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Engine:</span>
              <span className="metric-value">{cryptoState.use_sbox44 ? 'S-Box44' : 'Standard'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TextEncryption
