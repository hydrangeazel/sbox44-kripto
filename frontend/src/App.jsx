import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import LandingPage from './pages/LandingPage'
import TextEncryptionPage from './pages/TextEncryptionPage'
import SBoxModifierPage from './pages/SBoxModifierPage'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/de-encrypt" element={<TextEncryptionPage />} />
          <Route path="/sbox-maker" element={<SBoxModifierPage />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

