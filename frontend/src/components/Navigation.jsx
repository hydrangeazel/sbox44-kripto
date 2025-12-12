import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Navigation.css'

const Navigation = () => {
  const location = useLocation()

  const menuItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/text', label: 'Text Encryption', icon: '📝' },
    { path: '/image', label: 'Image Encryption', icon: '🖼️' },
    { path: '/comparison', label: 'S-Box Comparison', icon: '⚖️' },
    { path: '/sbox-modifier', label: 'AES S-Box Modifier', icon: '🔧' }
  ]

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">🔐</span>
          <span className="brand-text">AES Crypto Tool</span>
        </div>
        <ul className="navbar-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="navbar-item">
              <Link
                to={item.path}
                className={`navbar-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="navbar-icon">{item.icon}</span>
                <span className="navbar-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation

