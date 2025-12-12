import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './Page.css'
import './SBoxComparison.css'

const API_BASE_URL = '/api'

const SBoxComparison = () => {
  const [dataType, setDataType] = useState('text')
  const [plaintext, setPlaintext] = useState('Perbandingan ini menggunakan custom S-Box44.')
  const [key, setKey] = useState('a1b2c3d4e5f67890')
  const [outputFormat, setOutputFormat] = useState('Hex')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [standardOutput, setStandardOutput] = useState(null)
  const [sbox44Output, setSbox44Output] = useState(null)
  const [standardMetrics, setStandardMetrics] = useState(null)
  const [sbox44Metrics, setSbox44Metrics] = useState(null)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [])

  const loadMetrics = async () => {
    try {
      const [stdResponse, s44Response] = await Promise.all([
        axios.get(`${API_BASE_URL}/compare-metrics?use_sbox44=false`),
        axios.get(`${API_BASE_URL}/compare-metrics?use_sbox44=true`)
      ])
      setStandardMetrics(stdResponse.data)
      setSbox44Metrics(s44Response.data)
    } catch (error) {
      console.error('Error loading metrics:', error)
    }
  }

  const handleCompare = async () => {
    if (!plaintext) {
      setError('Input plaintext diperlukan untuk perbandingan.')
      return
    }
    if (key.length !== 16) {
      setError('Kunci wajib 16 karakter untuk menjalankan perbandingan.')
      return
    }

    setLoading(true)
    setError(null)
    setHasRun(false)

    try {
      const [stdResponse, s44Response] = await Promise.all([
        axios.post(`${API_BASE_URL}/compare-encrypt`, {
          plaintext,
          key,
          use_sbox44: false,
          output_format: outputFormat
        }),
        axios.post(`${API_BASE_URL}/compare-encrypt`, {
          plaintext,
          key,
          use_sbox44: true,
          output_format: outputFormat
        })
      ])

      setStandardOutput(stdResponse.data.ciphertext)
      setSbox44Output(s44Response.data.ciphertext)
      setHasRun(true)
    } catch (error) {
      setError(error.response?.data?.error || error.message || 'Gagal menjalankan perbandingan')
    } finally {
      setLoading(false)
    }
  }

  // Auto-hide messages
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const getComparisonText = (metric, stdVal, s44Val, ideal, higherIsBetter = true) => {
    if (stdVal === s44Val) {
      return `Kedua metode memiliki ${metric} yang sama.`
    }
    
    let stdBetter
    if (higherIsBetter) {
      stdBetter = stdVal > s44Val
    } else {
      // For metrics where closer to ideal is better (like SAC, LAP, DAP)
      const stdDiff = Math.abs(stdVal - ideal)
      const s44Diff = Math.abs(s44Val - ideal)
      stdBetter = stdDiff < s44Diff
    }
    
    if (stdBetter) {
      if (higherIsBetter) {
        return `AES Standard menunjukkan ${metric} lebih tinggi (${stdVal} vs ${s44Val}), sehingga potensi ketahanannya lebih baik.`
      } else {
        return `AES Standard menunjukkan ${metric} lebih dekat ke ideal ${ideal} (selisih: ${Math.abs(stdVal - ideal).toFixed(4)} vs ${Math.abs(s44Val - ideal).toFixed(4)}).`
      }
    } else {
      if (higherIsBetter) {
        return `AES S-Box44 memiliki ${metric} lebih tinggi (${s44Val} vs ${stdVal}), yang mengindikasikan ketahanan lebih baik.`
      } else {
        return `AES S-Box44 memiliki ${metric} lebih dekat ke ideal ${ideal} (selisih: ${Math.abs(s44Val - ideal).toFixed(4)} vs ${Math.abs(stdVal - ideal).toFixed(4)}).`
      }
    }
  }

  return (
    <div className="page sbox-comparison">
      <h1>⚖️ Performance Comparison</h1>
      <p>Perbandingan langsung antara <strong>AES Standard</strong> dan <strong>AES S-Box44</strong> berdasarkan data input.</p>

      {error && (
        <div className="message error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}

      <div className="comparison-controls">
        <div className="control-group">
          <label>Pilih Tipe Data untuk Perbandingan:</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                value="text"
                checked={dataType === 'text'}
                onChange={(e) => setDataType(e.target.value)}
              />
              <span>Text</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="image"
                checked={dataType === 'image'}
                onChange={(e) => setDataType(e.target.value)}
              />
              <span>Image</span>
            </label>
          </div>
        </div>

        {dataType === 'text' && (
          <div className="control-group full-width">
            <label>Input Plaintext untuk Perbandingan:</label>
            <textarea
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              placeholder="Masukkan plaintext unik Anda di sini..."
              rows={4}
              className="text-input"
            />
          </div>
        )}

        <div className="control-group">
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
            <span className="warning">Kunci wajib 16 karakter untuk menjalankan perbandingan.</span>
          )}
        </div>

        <div className="control-group">
          <label>Format Output Ciphertext:</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="control-input"
          >
            <option value="Hex">Hex</option>
            <option value="Base64">Base64</option>
          </select>
        </div>

        <button
          onClick={handleCompare}
          disabled={loading || key.length !== 16}
          className="btn-primary btn-compare"
        >
          {loading ? 'Menjalankan Analisis...' : '🚀 Jalankan Analisis Perbandingan'}
        </button>
      </div>

      {hasRun && (standardOutput || sbox44Output) && (
        <div className="comparison-results">
          <h2>Hasil Enkripsi dan Metrik</h2>
          
          <div className="output-comparison">
            <div className="output-column">
              <div className="output-header standard">
                <h3>AES Standard</h3>
              </div>
              <div className="output-content">
                <pre className="ciphertext-output">{standardOutput || 'N/A'}</pre>
              </div>
            </div>

            <div className="output-column">
              <div className="output-header sbox44">
                <h3>AES S-Box44 (Custom)</h3>
              </div>
              <div className="output-content">
                <pre className="ciphertext-output">{sbox44Output || 'N/A'}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {standardMetrics && sbox44Metrics && (
        <div className="metrics-section">
          <h2>📊 Cryptographic Metrics Analysis</h2>
          
          <div className="metrics-table-container">
            <table className="comparison-metrics-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>AES Standard</th>
                  <th>AES S-Box44</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Non-Linearity (Ideal 112)</td>
                  <td>{standardMetrics.nl}</td>
                  <td>{sbox44Metrics.nl}</td>
                </tr>
                <tr>
                  <td>SAC (Ideal 0.5)</td>
                  <td>{standardMetrics.sac.toFixed(4)}</td>
                  <td>{sbox44Metrics.sac.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>BIC-NL</td>
                  <td>{standardMetrics.bic_nl}</td>
                  <td>{sbox44Metrics.bic_nl}</td>
                </tr>
                <tr>
                  <td>BIC-SAC</td>
                  <td>{standardMetrics.bic_sac.toFixed(4)}</td>
                  <td>{sbox44Metrics.bic_sac.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>LAP (Ideal 0.5)</td>
                  <td>{standardMetrics.lap.toFixed(4)}</td>
                  <td>{sbox44Metrics.lap.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>DAP (Ideal 0.5)</td>
                  <td>{standardMetrics.dap.toFixed(4)}</td>
                  <td>{sbox44Metrics.dap.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>TO (Ideal 0.0)</td>
                  <td>{standardMetrics.to.toFixed(4)}</td>
                  <td>{sbox44Metrics.to.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>DU (Ideal 4)</td>
                  <td>{standardMetrics.du.toFixed(4)}</td>
                  <td>{sbox44Metrics.du.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>AD (Ideal 7)</td>
                  <td>{standardMetrics.ad.toFixed(4)}</td>
                  <td>{sbox44Metrics.ad.toFixed(4)}</td>
                </tr>
                <tr>
                  <td>Encryption Time (ms)</td>
                  <td>{standardMetrics.time_ms}</td>
                  <td>{sbox44Metrics.time_ms}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="analysis-section">
            <h3>🔍 Analisis Metrik</h3>
            
            <div className="analysis-item">
              <h4>Non-Linearity</h4>
              <p>{getComparisonText('Non-Linearity', standardMetrics.nl, sbox44Metrics.nl, 112, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>SAC</h4>
              <p>{getComparisonText('SAC', standardMetrics.sac, sbox44Metrics.sac, 0.5, false)}</p>
            </div>

            <div className="analysis-item">
              <h4>BIC-SAC</h4>
              <p>{standardMetrics.bic_sac < sbox44Metrics.bic_sac ? 
                `AES Standard memiliki BIC-SAC lebih rendah (${standardMetrics.bic_sac.toFixed(4)} vs ${sbox44Metrics.bic_sac.toFixed(4)}, semakin rendah semakin baik).` :
                standardMetrics.bic_sac > sbox44Metrics.bic_sac ?
                `AES S-Box44 memiliki BIC-SAC lebih rendah (${sbox44Metrics.bic_sac.toFixed(4)} vs ${standardMetrics.bic_sac.toFixed(4)}, semakin rendah semakin baik).` :
                `Kedua metode memiliki BIC-SAC yang sama.`}</p>
            </div>

            <div className="analysis-item">
              <h4>TO</h4>
              <p>{standardMetrics.to < sbox44Metrics.to ? 
                `AES Standard memiliki TO lebih rendah (${standardMetrics.to.toFixed(4)} vs ${sbox44Metrics.to.toFixed(4)}, semakin rendah semakin baik).` :
                standardMetrics.to > sbox44Metrics.to ?
                `AES S-Box44 memiliki TO lebih rendah (${sbox44Metrics.to.toFixed(4)} vs ${standardMetrics.to.toFixed(4)}, semakin rendah semakin baik).` :
                `Kedua metode memiliki TO yang sama.`}</p>
            </div>

            <div className="analysis-item">
              <h4>DU</h4>
              <p>{getComparisonText('DU', standardMetrics.du, sbox44Metrics.du, 4, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>AD</h4>
              <p>{getComparisonText('AD', standardMetrics.ad, sbox44Metrics.ad, 7, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>BIC-NL</h4>
              <p>{getComparisonText('BIC-NL', standardMetrics.bic_nl, sbox44Metrics.bic_nl, 112, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>LAP</h4>
              <p>{getComparisonText('LAP', standardMetrics.lap, sbox44Metrics.lap, 0.5, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>DAP</h4>
              <p>{getComparisonText('DAP', standardMetrics.dap, sbox44Metrics.dap, 0.5, true)}</p>
            </div>

            <div className="analysis-item">
              <h4>Waktu Eksekusi</h4>
              {standardMetrics.time_ms < sbox44Metrics.time_ms ? (
                <p>Waktu enkripsi AES Standard lebih cepat (selisih {sbox44Metrics.time_ms - standardMetrics.time_ms} ms).</p>
              ) : standardMetrics.time_ms > sbox44Metrics.time_ms ? (
                <p>Waktu enkripsi AES S-Box44 lebih cepat (selisih {standardMetrics.time_ms - sbox44Metrics.time_ms} ms).</p>
              ) : (
                <p>Kedua metode memiliki waktu enkripsi yang sama.</p>
              )}
            </div>

            <div className="conclusion">
              <h3>🎯 Kesimpulan Otomatis Berdasarkan Metrik</h3>
              {sbox44Metrics.nl > standardMetrics.nl && Math.abs(sbox44Metrics.sac - 0.5) < Math.abs(standardMetrics.sac - 0.5) ? (
                <p className="conclusion-text success">
                  ⛳ Secara keseluruhan, AES S-Box44 menunjukkan keunggulan yang lebih kuat dalam aspek keamanan.
                </p>
              ) : standardMetrics.time_ms < sbox44Metrics.time_ms ? (
                <p className="conclusion-text info">
                  ⚡ AES Standard lebih unggul dari sisi kecepatan sehingga cocok untuk implementasi real-time.
                </p>
              ) : (
                <p className="conclusion-text info">
                  🔁 Kedua mesin memiliki kelebihan masing-masing dan pemilihan tergantung kebutuhan sistem.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SBoxComparison
