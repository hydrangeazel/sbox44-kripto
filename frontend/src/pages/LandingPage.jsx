import React, { useEffect, useRef } from 'react'
import TextEncryption from './TextEncryption'
import SBoxModifier from './SBoxModifier'
import './LandingPage.css'

const LandingPage = () => {
  const homeRef = useRef(null)
  const deEncryptRef = useRef(null)
  const sboxMakerRef = useRef(null)
  const aboutRef = useRef(null)

  useEffect(() => {
    // Smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth'
    
    // Fade-in animation on load
    const heroContent = document.querySelector('.hero-content')
    if (heroContent) {
      setTimeout(() => {
        heroContent.style.opacity = '1'
        heroContent.style.transform = 'translateY(0)'
      }, 100)
    }

    // Fade-in for sections
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1'
          entry.target.style.transform = 'translateY(0)'
        }
      })
    }, observerOptions)

    const sections = document.querySelectorAll('.content-section')
    sections.forEach(section => {
      section.style.opacity = '0'
      section.style.transform = 'translateY(30px)'
      section.style.transition = 'opacity 0.8s ease, transform 0.8s ease'
      observer.observe(section)
    })

    return () => {
      sections.forEach(section => observer.unobserve(section))
    }
  }, [])

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section id="home" ref={homeRef} className="hero-section">
        {/* 3D Decorative Elements */}
        <div className="decorative-3d">
          <div className="deco-object deco-star purple-star">
            <div className="star-3d"></div>
          </div>
          <div className="deco-object deco-swirl green-swirl">
            <div className="swirl-3d"></div>
          </div>
          <div className="deco-object deco-cube pink-cube">
            <div className="cube-3d"></div>
          </div>
          <div className="deco-object deco-flower blue-flower">
            <div className="flower-3d"></div>
          </div>
        </div>

        <div className="hero-content fade-in">
          <h1 className="hero-headline">Is Your S-Box Strong Enough?</h1>
          
          <div className="blurred-text-blocks">
            <div className="blur-block">
              <span className="blur-text">Stop</span>
              <span className="reveal-text">Stop Guessing, Start Securing.</span>
            </div>
            <div className="blur-block">
              <span className="blur-text">Guessing</span>
              <span className="reveal-text">Stop Guessing, Start Securing.</span>
            </div>
            <div className="blur-block">
              <span className="blur-text">Start</span>
              <span className="reveal-text">Stop Guessing, Start Securing.</span>
            </div>
            <div className="blur-block">
              <span className="blur-text">Securing</span>
              <span className="reveal-text">Stop Guessing, Start Securing.</span>
            </div>
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
          <h2 className="section-title">De-Encrypt</h2>
          <TextEncryption />
        </div>
      </section>

      {/* S-Box Maker Section */}
      <section id="sbox-maker" ref={sboxMakerRef} className="content-section">
        <div className="section-container">
          <h2 className="section-title">S-Box Maker</h2>
          <SBoxModifier />
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="content-section about-section">
        <div className="section-container">
          <h2 className="section-title">About</h2>
          <div className="about-content">
            <div className="about-card">
              <h3>CRYPTER</h3>
              <p>
                CRYPTER adalah platform modern untuk analisis dan evaluasi S-Box kriptografi. 
                Platform ini memungkinkan Anda untuk menguji kekuatan S-Box Anda dengan berbagai 
                metrik keamanan yang komprehensif.
              </p>
            </div>
            <div className="about-card">
              <h3>Team Project</h3>
              <ul>
                <li>Rahima Ratna Dewanti / 2304130107</li>
                <li>Muthia Nis Tiadah / 2304130117</li>
                <li>Zulfa Mardlotillah / 2340130135</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default LandingPage

