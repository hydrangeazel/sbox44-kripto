import React from 'react'
import SBoxModifier from './SBoxModifier'
import './Page.css'

const SBoxModifierPage = () => {
  return (
    <div className="page-container">
      <div className="page-content">
        <h1 className="page-title">S-Box Maker</h1>
        <SBoxModifier />
      </div>
    </div>
  )
}

export default SBoxModifierPage

