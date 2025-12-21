import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './Navigation.css'

const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeSection, setActiveSection] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navRef = useRef(null)

  const menuItems = [
    { id: 'home', label: 'Home', path: '/', section: 'home' },
    { id: 'de-encrypt', label: 'De-Encrypt', path: '/de-encrypt', section: 'de-encrypt' },
    { id: 'sbox-maker', label: 'S-box Maker', path: '/sbox-maker', section: 'sbox-maker' },
    { id: 'about', label: 'About', path: '/', section: 'about' }
  ]

  useEffect(() => {
    // Update active section based on current route
    if (location.pathname === '/') {
      let ticking = false
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            const sections = menuItems.map(item => document.getElementById(item.section))
            const scrollPosition = window.scrollY + 150

            for (let i = sections.length - 1; i >= 0; i--) {
              if (sections[i] && sections[i].offsetTop <= scrollPosition) {
                setActiveSection(sections[i].id)
                break
              }
            }
            ticking = false
          })
          ticking = true
        }
      }

      window.addEventListener('scroll', handleScroll, { passive: true })
      handleScroll()
      return () => window.removeEventListener('scroll', handleScroll)
    } else {
      // Set active based on route
      const currentItem = menuItems.find(item => item.path === location.pathname)
      if (currentItem) {
        setActiveSection(currentItem.id)
      } else {
        setActiveSection('home')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleNavigation = (item) => {
    if (item.path === '/') {
      // For home and about, scroll to section if on home page
      if (location.pathname === '/') {
        const section = document.getElementById(item.section)
        if (section) {
          const offsetTop = section.offsetTop - 100
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          })
        }
      } else {
        // Navigate to home first, then scroll
        navigate('/')
        setTimeout(() => {
          const section = document.getElementById(item.section)
          if (section) {
            const offsetTop = section.offsetTop - 100
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    } else {
      navigate(item.path)
    }
    setIsMenuOpen(false)
  }

  const scrollToSection = (sectionId) => {
    if (location.pathname === '/') {
      const section = document.getElementById(sectionId)
      if (section) {
        const offsetTop = section.offsetTop - 100
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        })
      }
    } else {
      navigate('/')
      setTimeout(() => {
        const section = document.getElementById(sectionId)
        if (section) {
          const offsetTop = section.offsetTop - 100
          window.scrollTo({
            top: offsetTop,
            behavior: 'smooth'
          })
        }
      }, 100)
    }
  }

  return (
    <nav className="navbar" ref={navRef}>
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => scrollToSection('home')}>
          <img 
            src="/logo.png" 
            alt="CRYPTER Logo" 
            className="navbar-logo"
            onError={(e) => {
              // Fallback to emoji if logo image doesn't exist
              e.target.style.display = 'none'
              const fallback = e.target.nextElementSibling
              if (fallback) {
                fallback.style.display = 'block'
              }
            }}
          />
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
                onClick={() => handleNavigation(item)}
                className={`navbar-link ${activeSection === item.section ? 'active' : ''}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default Navigation

