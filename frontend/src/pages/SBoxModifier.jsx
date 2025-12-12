import React, { useState, useEffect } from 'react'
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
  const [candidates, setCandidates] = useState([])
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [metrics, setMetrics] = useState(null)
  const [standardMetrics, setStandardMetrics] = useState(null)
  const [loading, setLoading] = useState(false)

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
    }
  }

  const loadStandardMetrics = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/standard-metrics`)
      setStandardMetrics(response.data)
    } catch (error) {
      console.error('Error loading standard metrics:', error)
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
    try {
      const response = await axios.post(`${API_BASE_URL}/validate-matrix`, { matrix })
      setValidation(response.data)
    } catch (error) {
      alert('Error validating matrix: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const generateSBox = async () => {
    if (!validation?.is_valid) {
      alert('Matriks harus valid terlebih dahulu!')
      return
    }

    setLoading(true)
    try {
      const constValue = constant.startsWith('0x') 
        ? parseInt(constant, 16) 
        : parseInt(constant, 16)
      
      const response = await axios.post(`${API_BASE_URL}/generate-sbox`, {
        matrix,
        constant: constValue & 0xFF
      })

      const newCandidate = {
        id: candidates.length,
        name: `Kandidat ${candidates.length + 1}`,
        matrix: response.data.matrix,
        constant: response.data.constant,
        sbox: response.data.sbox
      }

      setCandidates([...candidates, newCandidate])
      setSelectedCandidate(newCandidate)
      alert('S-box kandidat berhasil dibuat!')
    } catch (error) {
      alert('Error generating S-box: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const evaluateSecurity = async (sbox) => {
    setLoading(true)
    try {
      const response = await axios.post(`${API_BASE_URL}/evaluate-security`, { sbox })
      return response.data
    } catch (error) {
      alert('Error evaluating security: ' + (error.response?.data?.error || error.message))
      return null
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!selectedCandidate) return

    const metricsData = await evaluateSecurity(selectedCandidate.sbox)
    if (metricsData) {
      setMetrics(metricsData)
      // Update candidate with metrics
      setCandidates(candidates.map(c =>
        c.id === selectedCandidate.id ? { ...c, metrics: metricsData } : c
      ))
      setSelectedCandidate({ ...selectedCandidate, metrics: metricsData })
    }
  }

  const formatSBoxTable = (sbox) => {
    const table = []
    for (let i = 0; i < 16; i++) {
      const row = []
      for (let j = 0; j < 16; j++) {
        row.push(sbox[i * 16 + j].toString(16).padStart(2, '0'))
      }
      table.push(row)
    }
    return table
  }

  return (
    <div className="sbox-modifier">
      <h1>🔧 AES S-Box Modifier</h1>
      <p className="subtitle">Modul untuk membangun dan mengevaluasi kandidat S-box baru menggunakan matriks affine kustom.</p>

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
                      {formatSBoxTable(selectedCandidate.sbox).map((row, i) => (
                        <tr key={i}>
                          <th>{i.toString(16).toUpperCase()}</th>
                          {row.map((cell, j) => (
                            <td key={j}>{cell.toUpperCase()}</td>
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

