import React, { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import CreatorShowcase from '../components/CreatorShowcase'
import './LandingPage.css'

const LandingPage = () => {
  const navigate = useNavigate()
  const homeRef = useRef(null)
  const deEncryptRef = useRef(null)
  const sboxMakerRef = useRef(null)
  const aboutRef = useRef(null)
  const deEncryptIntroRef = useRef(null)
  const sboxMakerIntroRef = useRef(null)

  useEffect(() => {
    // Fade-in animation on load
    const heroContent = document.querySelector('.hero-content')
    if (heroContent) {
      requestAnimationFrame(() => {
        heroContent.style.opacity = '1'
        heroContent.style.transform = 'translateY(0)'
      })
    }

    // Fade-in for sections with optimized IntersectionObserver
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            entry.target.style.opacity = '1'
            entry.target.style.transform = 'translateY(0)'
          })
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll('.content-section')
    sections.forEach(section => {
      section.style.opacity = '0'
      section.style.transform = 'translateY(30px)'
      section.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
      observer.observe(section)
    })

    return () => {
      sections.forEach(section => observer.unobserve(section))
    }
  }, [])

  const scrollToSection = (ref) => {
    if (ref.current) {
      const offsetTop = ref.current.offsetTop - 100 // Account for navbar height
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      })
    }
  }

  const handleDeEncryptStart = () => {
    if (deEncryptIntroRef.current) {
      deEncryptIntroRef.current.style.opacity = '0'
      deEncryptIntroRef.current.style.transform = 'translateY(-20px)'
    }
    setTimeout(() => {
      navigate('/de-encrypt')
    }, 300)
  }

  const handleSBoxMakerStart = () => {
    if (sboxMakerIntroRef.current) {
      sboxMakerIntroRef.current.style.opacity = '0'
      sboxMakerIntroRef.current.style.transform = 'translateY(-20px)'
    }
    setTimeout(() => {
      navigate('/sbox-maker')
    }, 300)
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="home" ref={homeRef} className="hero-section">
        {/* 3D Decorative Elements */}
        <div className="decorative-3d">
          <div className="deco-object deco-star purple-star">
            <img 
              src="/decorations/star.png" 
              alt="Star decoration" 
              className="deco-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <div className="deco-object deco-swirl green-swirl">
            <img 
              src="/decorations/swirl.png" 
              alt="Swirl decoration" 
              className="deco-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <div className="deco-object deco-cube pink-cube">
            <img 
              src="/decorations/cube.png" 
              alt="Cube decoration" 
              className="deco-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
          <div className="deco-object deco-flower blue-flower">
            <img 
              src="/decorations/flower.png" 
              alt="Flower decoration" 
              className="deco-image"
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
          </div>
        </div>

        <div className="hero-content fade-in">
          <h1 className="hero-headline">Is Your S-Box Strong Enough?</h1>
          
          <div className="blurred-text-block">
            <span className="censored-text">Stop Guessing, Start Securing.</span>
            <span className="reveal-text">Stop Guessing, Start Securing.</span>
          </div>
          
          <button 
            className="cta-button"
            onClick={() => scrollToSection(deEncryptRef)}
          >
            Start now
          </button>
        </div>
      </section>

      {/* De-Encrypt Section */}
      <section id="de-encrypt" ref={deEncryptRef} className="content-section">
        <div className="section-container">
          <div ref={deEncryptIntroRef} className="feature-intro">
            <div className="feature-intro-container">
              <div className="feature-intro-left">
                <h2 className="feature-intro-title">De-Encrypt</h2>
                <p className="feature-intro-subtitle">
                  Encrypt and decrypt text and images using AES encryption with both standard 
                  and custom S-Box44 variants. Test the security of your cryptographic implementations.
                </p>
                <button 
                  className="feature-start-button"
                  onClick={handleDeEncryptStart}
                >
                  Start
                </button>
              </div>
              <div className="feature-intro-right">
                <div className="feature-intro-card feature-intro-card-deencrypt">
                  <img 
                    src="/features/de-encrypt.png" 
                    alt="De-Encrypt Feature" 
                    className="feature-intro-image"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* S-Box Maker Section */}
      <section id="sbox-maker" ref={sboxMakerRef} className="content-section">
        <div className="section-container">
          <div ref={sboxMakerIntroRef} className="feature-intro">
            <div className="feature-intro-container">
              <div className="feature-intro-left">
                <h2 className="feature-intro-title">S-Box Maker</h2>
                <p className="feature-intro-subtitle">
                  Create and evaluate new S-box candidates using custom affine matrices
                </p>
                <button 
                  className="feature-start-button"
                  onClick={handleSBoxMakerStart}
                >
                  Start
                </button>
              </div>
              <div className="feature-intro-right">
                <div className="feature-intro-card feature-intro-card-sboxmaker">
                  <img 
                    src="/features/sbox-maker.png" 
                    alt="S-Box Maker Feature" 
                    className="feature-intro-image"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="content-section about-section">
        <div className="section-container">
          <h2 className="section-title">About</h2>
          
          <div className="about-content">
            <div className="about-card about-description">
              <h3>What is CRYPTER?</h3>
              <p>
                CRYPTER is a modern web platform designed for comprehensive analysis and evaluation 
                of cryptographic S-Boxes. Our platform empowers researchers, developers, and security 
                professionals to test and validate the strength of their S-Box implementations using 
                industry-standard cryptographic metrics.
              </p>
            </div>

            <div className="about-card about-purpose">
              <h3>Purpose</h3>
              <p>
                The primary goal of CRYPTER is to provide an accessible, user-friendly interface for 
                S-Box security analysis. We aim to bridge the gap between complex cryptographic theory 
                and practical implementation, making it easier for users to understand and improve 
                their cryptographic systems.
              </p>
            </div>

            <div className="about-card about-features">
              <h3>Main Features</h3>
              <ul className="features-list">
                <li>Text Encryption & Decryption with AES (Standard and S-Box44 variants)</li>
                <li>Image Encryption & Decryption capabilities</li>
                <li>Custom S-Box Builder with affine transformation support</li>
                <li>Comprehensive Security Metrics Analysis (NL, SAC, BIC-NL, BIC-SAC)</li>
                <li>Real-time S-Box Comparison Tool</li>
                <li>Interactive Visualization of Cryptographic Properties</li>
              </ul>
            </div>
          </div>

          <CreatorShowcase />
        </div>
      </section>
    </div>
  )
}

export default LandingPage

