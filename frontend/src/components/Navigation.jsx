import React, { useState, useEffect, useRef } from 'react'
import './Navigation.css'

const Navigation = () => {
  const [activeSection, setActiveSection] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navRef = useRef(null)

  const menuItems = [
    { id: 'home', label: 'Home', section: 'home' },
    { id: 'de-encrypt', label: 'De-Encrypt', section: 'de-encrypt' },
    { id: 'sbox-maker', label: 'S-Box Maker', section: 'sbox-maker' },
    { id: 'about', label: 'About', section: 'about' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sections = menuItems.map(item => document.getElementById(item.section))
      const scrollPosition = window.scrollY + 100

      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i] && sections[i].offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id)
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setIsMenuOpen(false)
    }
  }

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => scrollToSection('home')}>
          <span className="brand-icon">🔐</span>
          <span className="brand-text">CRYPTER</span>
        </div>
        <button 
          className="hamburger-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          {menuItems.map((item) => (
            <li key={item.id} className="navbar-item">
              <button
                onClick={() => scrollToSection(item.section)}
                className={`navbar-link ${activeSection === item.section ? 'active' : ''}`}
              >
                <span className="navbar-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation

