import React from 'react'
import ImageEncryptionInterface from './ImageEncryptionInterface'
import './Page.css'

const ImageEncryptionPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">Image Encryption</h1>
        <ImageEncryptionInterface />
      </div>
    </div>
  )
}

export default ImageEncryptionPage
