import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import Home from './pages/Home'
import TextEncryption from './pages/TextEncryption'
import ImageEncryption from './pages/ImageEncryption'
import SBoxComparison from './pages/SBoxComparison'
import SBoxModifier from './pages/SBoxModifier'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/text" element={<TextEncryption />} />
            <Route path="/image" element={<ImageEncryption />} />
            <Route path="/comparison" element={<SBoxComparison />} />
            <Route path="/sbox-modifier" element={<SBoxModifier />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App

