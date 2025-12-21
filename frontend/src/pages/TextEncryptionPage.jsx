import React from 'react'
import TextEncryption from './TextEncryption'
import './Page.css'

const TextEncryptionPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">De-Encrypt</h1>
        <TextEncryption />
      </div>
    </div>
  )
}

export default TextEncryptionPage

