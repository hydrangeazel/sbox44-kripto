import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import './SBoxModifier.css'

const API_BASE_URL = '/api'

const AES_AFFINE_MATRIX = [
  [1, 0, 0, 0, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 1, 1, 1],
  [1, 1, 1, 0, 0, 0, 1, 1],
  [1, 1, 1, 1, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 1, 1, 1, 1]
]

const SBoxModifier = () => {
  const [matrix, setMatrix] = useState(AES_AFFINE_MATRIX)
  const [constant, setConstant] = useState('0x63')
  const [inputMethod, setInputMethod] = useState('manual')
  const [matrixText, setMatrixText] = useState('')
  const [validation, setValidation] = useState(null)
  const [firstRow, setFirstRow] = useState([1, 1, 1, 0, 0, 0, 0, 0])
  const [generatedMatrix, setGeneratedMatrix] = useState(null)
  const [generationStatus, setGenerationStatus] = useState(null)
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [standardMetrics, setStandardMetrics] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [displayFormat, setDisplayFormat] = useState('hex') // 'hex' or 'dec'
  const candidateIdCounter = useRef(0)

  useEffect(() => {
    loadDefaultMatrix()
    loadStandardMetrics()
  }, [])

  const loadDefaultMatrix = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/default-matrix`)
      setMatrix(response.data.matrix)
      setConstant(`0x${response.data.constant.toString(16).padStart(2, '0')}`)
    } catch (error) {
      console.error('Error loading default matrix:', error)
      setError('Gagal memuat matriks default. Menggunakan matriks standar.')
    }
  }

  const loadStandardMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/standard-metrics`)
      setStandardMetrics(response.data)
    } catch (error) {
      console.error('Error loading standard metrics:', error)
      setError('Gagal memuat metrik standar. Beberapa fitur mungkin tidak tersedia.')
    }
  }

  const handleMatrixChange = (row, col, value) => {
    const newMatrix = matrix.map((r, rIdx) =>
      rIdx === row ? r.map((c, cIdx) => (cIdx === col ? parseInt(value) : c)) : r
    )
    setMatrix(newMatrix)
  }

  const handleMatrixTextChange = (text) => {
    setMatrixText(text)
    try {
      const lines = text.trim().split('\n')
      if (lines.length === 8) {
        const newMatrix = lines.map(line =>
          line.trim().split(/\s+/).map(x => parseInt(x))
        )
        if (newMatrix.every(row => row.length === 8 && row.every(v => v === 0 || v === 1))) {
          setMatrix(newMatrix)
        }
      }
    } catch (e) {
      // Invalid format, ignore
    }
  }

  const validateMatrix = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/validate-matrix`, { matrix })
      setValidation(response.data)
      if (response.data.is_valid) {
        setSuccess('Matriks valid! Anda dapat membangun S-box kandidat.')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat memvalidasi matriks'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const generateMatrixFromFirstRow = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setGenerationStatus(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/generate-matrix`, { first_row: firstRow })
      setGeneratedMatrix(response.data.matrix)
      setGenerationStatus(response.data)
      
      if (response.data.is_valid) {
        setSuccess('Matriks berhasil dibangkitkan dan valid!')
        setMatrix(response.data.matrix)
        // Auto-validate the generated matrix
        const validateResponse = await axios.post(`${API_BASE_URL}/validate-matrix`, { matrix: response.data.matrix })
        setValidation(validateResponse.data)
      } else {
        setError(response.data.message || 'Matriks dibangkitkan tetapi tidak valid (determinan = 0). Silakan ubah baris pertama.')
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat membangkitkan matriks'
      setError(errorMsg)
      setGeneratedMatrix(null)
      setGenerationStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFirstRowChange = (index, value) => {
    const newFirstRow = [...firstRow]
    newFirstRow[index] = parseInt(value) || 0
    setFirstRow(newFirstRow)
  }

  const generateSBox = async () => {
    if (!validation?.is_valid) {
      setError('Matriks harus valid terlebih dahulu!')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      // Parse constant value properly
      let constValue
      if (constant.startsWith('0x') || constant.startsWith('0X')) {
        constValue = parseInt(constant, 16)
      } else {
        constValue = parseInt(constant, 16)
      }
      
      if (isNaN(constValue)) {
        throw new Error('Format konstanta tidak valid. Gunakan format hex (contoh: 0x63)')
      }
      
      const response = await axios.post(`${API_BASE_URL}/generate-sbox`, {
        matrix,
        constant: constValue & 0xFF
      })

      const newCandidate = {
        id: candidateIdCounter.current++,
        name: `Kandidat ${candidates.length + 1}`,
        matrix: response.data.matrix,
        constant: response.data.constant,
        sbox: response.data.sbox
      }

      setCandidates(prev => [...prev, newCandidate])
      setSelectedCandidate(newCandidate)
      setSuccess(`S-box kandidat "${newCandidate.name}" berhasil dibuat!`)
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat membangun S-box'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const evaluateSecurity = async (sbox) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate-security`, { sbox })
      return response.data
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Terjadi kesalahan saat mengevaluasi keamanan'
      setError(errorMsg)
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!selectedCandidate) {
      setError('Pilih kandidat terlebih dahulu!')
      return
    }

    const metricsData = await evaluateSecurity(selectedCandidate.sbox)
    if (metricsData) {
      setMetrics(metricsData)
      // Update candidate with metrics using functional update
      setCandidates(prev => prev.map(c =>
        c.id === selectedCandidate.id ? { ...c, metrics: metricsData } : c
      ))
      setSelectedCandidate(prev => prev ? { ...prev, metrics: metricsData } : null)
      setSuccess('Evaluasi keamanan selesai!')
    }
  }

  const formatSBoxTable = (sbox, format = 'hex') => {
    const table = []
    for (let i = 0; i < 16; i++) {
      const row = []
      for (let j = 0; j < 16; j++) {
        const value = sbox[i * 16 + j]
        if (format === 'hex') {
          row.push(value.toString(16).padStart(2, '0').toUpperCase())
        } else {
          row.push(value.toString())
        }
      }
      table.push(row)
    }
    return table
  }

  // Auto-hide messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="sbox-modifier">
      <h1>🔧 AES S-Box Modifier</h1>
      <p className="subtitle">Modul untuk membangun dan mengevaluasi kandidat S-box baru menggunakan matriks affine kustom.</p>

      {/* Error/Success Messages */}
      {error && (
        <div className="validation-message" style={{ background: 'rgba(213, 105, 137, 0.2)', borderLeft: '4px solid #D56989' }}>
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="validation-message" style={{ background: 'rgba(194, 220, 128, 0.2)', borderLeft: '4px solid #C2DC80' }}>
          <strong>✅ Sukses:</strong> {success}
        </div>
      )}

      {/* Input Section */}
      <div className="section">
        <h2>Input Matriks Affine 8×8</h2>
        
        <div className="input-group">
          <label>Konstanta 8-bit (hex):</label>
          <input
            type="text"
            value={constant}
            onChange={(e) => setConstant(e.target.value)}
            placeholder="0x63"
          />
        </div>

        <div className="tabs">
          <button
            className={inputMethod === 'manual' ? 'active' : ''}
            onClick={() => setInputMethod('manual')}
          >
            Manual (Tabel)
          </button>
          <button
            className={inputMethod === 'text' ? 'active' : ''}
            onClick={() => setInputMethod('text')}
          >
            Text Area
          </button>
          <button
            className={inputMethod === 'generator' ? 'active' : ''}
            onClick={() => setInputMethod('generator')}
          >
            Matrix Generator
          </button>
          <button
            className={inputMethod === 'standard' ? 'active' : ''}
            onClick={() => {
              setInputMethod('standard')
              setMatrix(AES_AFFINE_MATRIX)
            }}
          >
            Matriks Standar AES
          </button>
        </div>

        {inputMethod === 'manual' && (
          <div className="matrix-input">
            <table className="matrix-table">
              <thead>
                <tr>
                  <th></th>
                  {[...Array(8)].map((_, i) => (
                    <th key={i}>C{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    <th>R{rowIdx + 1}</th>
                    {row.map((val, colIdx) => (
                      <td key={colIdx}>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          value={val}
                          onChange={(e) => handleMatrixChange(rowIdx, colIdx, e.target.value)}
                          className="matrix-cell"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inputMethod === 'text' && (
          <div className="text-input">
            <textarea
              value={matrixText || matrix.map(r => r.join(' ')).join('\n')}
              onChange={(e) => {
                setMatrixText(e.target.value)
                handleMatrixTextChange(e.target.value)
              }}
              rows={8}
              placeholder="1 0 0 0 1 1 1 1&#10;1 1 0 0 0 1 1 1&#10;..."
            />
          </div>
        )}

        {inputMethod === 'generator' && (
          <div className="matrix-generator">
            <div className="generator-info">
              <h3>🔧 Affine Matrix Generator</h3>
              <p>
                Masukkan baris pertama (8 bit). Matriks akan dibangkitkan menggunakan <strong>Right Circular Shift</strong>.
                <br />
                <em>Berdasarkan paper: "AES S-box modification uses affine matrices exploration"</em>
              </p>
              <p>
                <strong>Contoh (K4 Matrix dari paper):</strong> <code>[1, 1, 1, 0, 0, 0, 0, 0]</code>
              </p>
            </div>
            
            <div className="first-row-input">
              <label>Baris Pertama (8 bit, 0 atau 1):</label>
              <div className="first-row-grid">
                {firstRow.map((val, idx) => (
                  <input
                    key={idx}
                    type="number"
                    min="0"
                    max="1"
                    value={val}
                    onChange={(e) => handleFirstRowChange(idx, e.target.value)}
                    className="first-row-cell"
                    placeholder={idx.toString()}
                  />
                ))}
              </div>
            </div>

            <div className="button-group">
              <button 
                onClick={generateMatrixFromFirstRow} 
                disabled={loading} 
                className="btn-primary"
              >
                {loading ? 'Membangkitkan...' : '🔨 Bangkitkan Matriks'}
              </button>
            </div>

            {generationStatus && (
              <div className={`generation-result ${generationStatus.is_valid ? 'valid' : 'invalid'}`}>
                <h4>Hasil Pembangkitan:</h4>
                <p><strong>Status:</strong> {generationStatus.is_valid ? '✅ Valid' : '❌ Tidak Valid'}</p>
                <p><strong>Determinan (mod 2):</strong> {generationStatus.determinant}</p>
                <p><strong>Pesan:</strong> {generationStatus.message}</p>
              </div>
            )}

            {generatedMatrix && (
              <div className="generated-matrix-display">
                <h4>Matriks yang Dibangkitkan (8×8):</h4>
                <div className="matrix-preview">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th></th>
                        {[...Array(8)].map((_, i) => (
                          <th key={i}>C{i + 1}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generatedMatrix.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          <th>R{rowIdx + 1}</th>
                          {row.map((val, colIdx) => (
                            <td key={colIdx}>{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {generationStatus?.is_valid && (
                  <div className="button-group">
                    <button 
                      onClick={() => {
                        setMatrix(generatedMatrix)
                        setInputMethod('manual')
                        setSuccess('Matriks berhasil dimuat ke editor!')
                      }} 
                      className="btn-primary"
                    >
                      ✅ Gunakan Matriks Ini
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {inputMethod === 'standard' && (
          <div className="standard-matrix">
            <pre>{matrix.map(r => r.join(' ')).join('\n')}</pre>
          </div>
        )}

        <div className="button-group">
          <button onClick={validateMatrix} disabled={loading} className="btn-primary">
            {loading ? 'Memvalidasi...' : 'Validasi Matriks'}
          </button>
        </div>
      </div>

      {/* Validation Results */}
      {validation && (
        <div className="section">
          <h2>📋 Hasil Validasi</h2>
          <div className="validation-results">
            <div className={`validation-item ${validation.is_valid ? 'valid' : 'invalid'}`}>
              <span className="validation-label">Status:</span>
              <span className="validation-value">
                {validation.is_valid ? '✅ Valid' : '❌ Tidak Valid'}
              </span>
            </div>
            <div className="validation-item">
              <span className="validation-label">Determinan (mod 2):</span>
              <span className="validation-value">{validation.determinant}</span>
            </div>
            <div className={`validation-item ${validation.is_balanced ? 'valid' : 'invalid'}`}>
              <span className="validation-label">Balanced:</span>
              <span className="validation-value">
                {validation.is_balanced ? '✅ Ya' : '❌ Tidak'}
              </span>
            </div>
            <div className={`validation-item ${validation.is_bijective ? 'valid' : 'invalid'}`}>
              <span className="validation-label">Bijective:</span>
              <span className="validation-value">
                {validation.is_bijective ? '✅ Ya' : '❌ Tidak'}
              </span>
            </div>
            <div className="validation-message">
              <strong>Pesan:</strong> {validation.message}
            </div>
          </div>

          {validation.is_valid && (
            <button
              onClick={generateSBox}
              disabled={loading}
              className="btn-primary btn-generate"
            >
              {loading ? 'Membangun...' : '🔨 Bangun S-Box Kandidat'}
            </button>
          )}
        </div>
      )}

      {/* Candidates Section */}
      {candidates.length > 0 && (
        <div className="section">
          <h2>📊 Kandidat S-Box</h2>
          
          <div className="candidate-selector">
            <label>Pilih Kandidat:</label>
            <select
              value={selectedCandidate?.id ?? ''}
              onChange={(e) => {
                const candidate = candidates.find(c => c.id === parseInt(e.target.value))
                setSelectedCandidate(candidate)
                setMetrics(candidate?.metrics || null)
              }}
            >
              {candidates.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {selectedCandidate && (
            <>
              <div className="sbox-display">
                <h3>S-Box: {selectedCandidate.name}</h3>
                
                {/* Display Format Toggle */}
                <div className="display-format-toggle">
                  <label>Format Tampilan:</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="displayFormat"
                        value="hex"
                        checked={displayFormat === 'hex'}
                        onChange={(e) => setDisplayFormat(e.target.value)}
                      />
                      <span>Hexadecimal (HEX)</span>
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="displayFormat"
                        value="dec"
                        checked={displayFormat === 'dec'}
                        onChange={(e) => setDisplayFormat(e.target.value)}
                      />
                      <span>Decimal (DEC)</span>
                    </label>
                  </div>
                </div>

                <div className="sbox-table-container">
                  <table className="sbox-table">
                    <thead>
                      <tr>
                        <th></th>
                        {[...Array(16)].map((_, i) => (
                          <th key={i}>{i.toString(16).toUpperCase()}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {formatSBoxTable(selectedCandidate.sbox, displayFormat).map((row, i) => (
                        <tr key={i}>
                          <th>{i.toString(16).toUpperCase()}</th>
                          {row.map((cell, j) => (
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="json-display">
                  <details>
                    <summary>📄 Lihat S-Box dalam Format JSON</summary>
                    <pre>{JSON.stringify({
                      name: selectedCandidate.name,
                      matrix: selectedCandidate.matrix,
                      constant: `0x${selectedCandidate.constant.toString(16).padStart(2, '0')}`,
                      sbox: selectedCandidate.sbox
                    }, null, 2)}</pre>
                  </details>
                </div>
              </div>

              <div className="button-group">
                <button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="btn-primary"
                >
                  {loading ? 'Menghitung...' : '🧪 Jalankan Pengujian Keamanan'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Metrics Display */}
      {metrics && standardMetrics && (
        <div className="section">
          <h2>🔒 Evaluasi Keamanan</h2>
          
          <div className="metrics-dashboard">
            <h3>📈 Dashboard Metrik Keamanan</h3>
            <table className="metrics-table">
              <thead>
                <tr>
                  <th>Metrik</th>
                  <th>AES Standard</th>
                  <th>{selectedCandidate?.name || 'Kandidat'}</th>
                </tr>
              </thead>
              <tbody>
                {/* Basic Properties */}
                <tr>
                  <td><strong>Bijective</strong></td>
                  <td>{standardMetrics.is_bijective ? '✅ Ya' : '❌ Tidak'}</td>
                  <td>{metrics.is_bijective ? '✅ Ya' : '❌ Tidak'}</td>
                </tr>
                <tr>
                  <td><strong>Balanced</strong></td>
                  <td>{standardMetrics.is_balanced ? '✅ Ya' : '❌ Tidak'}</td>
                  <td>{metrics.is_balanced ? '✅ Ya' : '❌ Tidak'}</td>
                </tr>
                {/* Existing Metrics */}
                <tr>
                  <td>Non-Linearity (NL)</td>
                  <td>{standardMetrics.nl}</td>
                  <td>{metrics.nl}</td>
                </tr>
                <tr>
                  <td>SAC</td>
                  <td>{standardMetrics.sac.toFixed(4)}</td>
                  <td>{metrics.sac.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>BIC-NL</td>
                  <td>{standardMetrics.bic_nl}</td>
                  <td>{metrics.bic_nl}</td>
                </tr>
                <tr>
                  <td>BIC-SAC</td>
                  <td>{standardMetrics.bic_sac.toFixed(4)}</td>
                  <td>{metrics.bic_sac.toFixed(4)}</td>
                </tr>
                {/* New Metrics */}
                <tr>
                  <td>Linear Approximation Probability (LAP)</td>
                  <td>{standardMetrics.lap?.toFixed(6) || '-'}</td>
                  <td>{metrics.lap?.toFixed(6) || '-'}</td>
                </tr>
                <tr>
                  <td>Differential Approximation Probability (DAP)</td>
                  <td>{standardMetrics.dap?.toFixed(6) || '-'}</td>
                  <td>{metrics.dap?.toFixed(6) || '-'}</td>
                </tr>
                <tr>
                  <td>Differential Uniformity (DU)</td>
                  <td>{standardMetrics.du ?? '-'}</td>
                  <td>{metrics.du ?? '-'}</td>
                </tr>
                <tr>
                  <td>Algebraic Degree (AD)</td>
                  <td>{standardMetrics.ad ?? '-'}</td>
                  <td>{metrics.ad ?? '-'}</td>
                </tr>
                <tr>
                  <td>Transparency Order (TO)</td>
                  <td>{standardMetrics.to?.toFixed(6) || '-'}</td>
                  <td>{metrics.to?.toFixed(6) || '-'}</td>
                </tr>
                <tr>
                  <td>Correlation Immunity (CI)</td>
                  <td>{standardMetrics.ci ?? '-'}</td>
                  <td>{metrics.ci ?? '-'}</td>
                </tr>
                <tr>
                  <td><strong>Skor Keamanan</strong></td>
                  <td><strong>{standardMetrics.score.toFixed(2)}</strong></td>
                  <td><strong>{metrics.score.toFixed(2)}</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="analysis">
              <h3>🏆 Analisis dan Peringkat Keamanan</h3>
              {metrics.score > standardMetrics.score ? (
                <div className="analysis-success">
                  🎯 <strong>{selectedCandidate?.name}</strong> memiliki skor keamanan lebih tinggi 
                  ({metrics.score.toFixed(2)} vs {standardMetrics.score.toFixed(2)})
                </div>
              ) : metrics.score < standardMetrics.score ? (
                <div className="analysis-info">
                  🎯 <strong>AES Standard</strong> memiliki skor keamanan lebih tinggi 
                  ({standardMetrics.score.toFixed(2)} vs {metrics.score.toFixed(2)})
                </div>
              ) : (
                <div className="analysis-info">
                  🎯 Kedua S-box memiliki skor keamanan yang sama
                </div>
              )}

              <div className="analysis-detail">
                <h4>Analisis Detail:</h4>
                <ul>
                  <li>
                    <strong>Non-Linearity:</strong>{' '}
                    {metrics.nl > standardMetrics.nl ? '✅' : metrics.nl < standardMetrics.nl ? '⚠️' : '➖'}{' '}
                    {metrics.nl > standardMetrics.nl 
                      ? `${selectedCandidate?.name} lebih baik (${metrics.nl} vs ${standardMetrics.nl})`
                      : metrics.nl < standardMetrics.nl
                      ? `AES Standard lebih baik (${standardMetrics.nl} vs ${metrics.nl})`
                      : `Keduanya sama (${metrics.nl})`}
                  </li>
                  <li>
                    <strong>SAC:</strong>{' '}
                    {Math.abs(metrics.sac - 0.5) < Math.abs(standardMetrics.sac - 0.5) ? '✅' 
                      : Math.abs(metrics.sac - 0.5) > Math.abs(standardMetrics.sac - 0.5) ? '⚠️' : '➖'}{' '}
                    {Math.abs(metrics.sac - 0.5) < Math.abs(standardMetrics.sac - 0.5)
                      ? `${selectedCandidate?.name} lebih dekat ke ideal 0.5`
                      : Math.abs(metrics.sac - 0.5) > Math.abs(standardMetrics.sac - 0.5)
                      ? `AES Standard lebih dekat ke ideal 0.5`
                      : `Keduanya sama dekat ke ideal 0.5`}
                  </li>
                  <li>
                    <strong>BIC-NL:</strong>{' '}
                    {metrics.bic_nl > standardMetrics.bic_nl ? '✅' 
                      : metrics.bic_nl < standardMetrics.bic_nl ? '⚠️' : '➖'}{' '}
                    {metrics.bic_nl > standardMetrics.bic_nl
                      ? `${selectedCandidate?.name} lebih baik (${metrics.bic_nl} vs ${standardMetrics.bic_nl})`
                      : metrics.bic_nl < standardMetrics.bic_nl
                      ? `AES Standard lebih baik (${standardMetrics.bic_nl} vs ${metrics.bic_nl})`
                      : `Keduanya sama (${metrics.bic_nl})`}
                  </li>
                  <li>
                    <strong>BIC-SAC:</strong>{' '}
                    {metrics.bic_sac < standardMetrics.bic_sac ? '✅' 
                      : metrics.bic_sac > standardMetrics.bic_sac ? '⚠️' : '➖'}{' '}
                    {metrics.bic_sac < standardMetrics.bic_sac
                      ? `${selectedCandidate?.name} lebih baik (${metrics.bic_sac.toFixed(4)} vs ${standardMetrics.bic_sac.toFixed(4)}, semakin rendah semakin baik)`
                      : metrics.bic_sac > standardMetrics.bic_sac
                      ? `AES Standard lebih baik (${standardMetrics.bic_sac.toFixed(4)} vs ${metrics.bic_sac.toFixed(4)}, semakin rendah semakin baik)`
                      : `Keduanya sama (${metrics.bic_sac.toFixed(4)})`}
                  </li>
                  {metrics.du && standardMetrics.du && (
                    <li>
                      <strong>Differential Uniformity (DU):</strong>{' '}
                      {metrics.du < standardMetrics.du ? '✅' 
                        : metrics.du > standardMetrics.du ? '⚠️' : '➖'}{' '}
                      {metrics.du < standardMetrics.du
                        ? `${selectedCandidate?.name} lebih baik (${metrics.du} vs ${standardMetrics.du}, semakin rendah semakin baik)`
                        : metrics.du > standardMetrics.du
                        ? `AES Standard lebih baik (${standardMetrics.du} vs ${metrics.du}, semakin rendah semakin baik)`
                        : `Keduanya sama (${metrics.du})`}
                    </li>
                  )}
                  {metrics.ad && standardMetrics.ad && (
                    <li>
                      <strong>Algebraic Degree (AD):</strong>{' '}
                      {metrics.ad > standardMetrics.ad ? '✅' 
                        : metrics.ad < standardMetrics.ad ? '⚠️' : '➖'}{' '}
                      {metrics.ad > standardMetrics.ad
                        ? `${selectedCandidate?.name} lebih baik (${metrics.ad} vs ${standardMetrics.ad}, semakin tinggi semakin baik)`
                        : metrics.ad < standardMetrics.ad
                        ? `AES Standard lebih baik (${standardMetrics.ad} vs ${metrics.ad}, semakin tinggi semakin baik)`
                        : `Keduanya sama (${metrics.ad})`}
                    </li>
                  )}
                  {metrics.ci !== undefined && standardMetrics.ci !== undefined && (
                    <li>
                      <strong>Correlation Immunity (CI):</strong>{' '}
                      {metrics.ci > standardMetrics.ci ? '✅' 
                        : metrics.ci < standardMetrics.ci ? '⚠️' : '➖'}{' '}
                      {metrics.ci > standardMetrics.ci
                        ? `${selectedCandidate?.name} lebih baik (${metrics.ci} vs ${standardMetrics.ci}, semakin tinggi semakin baik)`
                        : metrics.ci < standardMetrics.ci
                        ? `AES Standard lebih baik (${standardMetrics.ci} vs ${metrics.ci}, semakin tinggi semakin baik)`
                        : `Keduanya sama (${metrics.ci})`}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison of All Candidates */}
      {candidates.length > 1 && candidates.every(c => c.metrics) && (
        <div className="section">
          <h2>📊 Perbandingan Semua Kandidat</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>S-Box</th>
                <th>NL</th>
                <th>SAC</th>
                <th>BIC-NL</th>
                <th>BIC-SAC</th>
                <th>DU</th>
                <th>AD</th>
                <th>CI</th>
                <th>Skor</th>
              </tr>
            </thead>
            <tbody>
              {[...candidates, { name: 'AES Standard', metrics: standardMetrics }]
                .sort((a, b) => (b.metrics?.score || 0) - (a.metrics?.score || 0))
                .map((c, idx) => (
                  <tr key={idx} className={c.name === 'AES Standard' ? 'standard-row' : ''}>
                    <td><strong>{c.name}</strong></td>
                    <td>{c.metrics?.nl || '-'}</td>
                    <td>{c.metrics?.sac?.toFixed(4) || '-'}</td>
                    <td>{c.metrics?.bic_nl || '-'}</td>
                    <td>{c.metrics?.bic_sac?.toFixed(4) || '-'}</td>
                    <td>{c.metrics?.du ?? '-'}</td>
                    <td>{c.metrics?.ad ?? '-'}</td>
                    <td>{c.metrics?.ci ?? '-'}</td>
                    <td><strong>{c.metrics?.score?.toFixed(2) || '-'}</strong></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SBoxModifier

