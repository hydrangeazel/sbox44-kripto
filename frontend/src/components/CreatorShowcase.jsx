import React, { useState, useRef } from 'react'
import './CreatorShowcase.css'

const CreatorShowcase = () => {
  const [playingStates, setPlayingStates] = useState([false, false, false])
  const audioRefs = [useRef(null), useRef(null), useRef(null)]

  const creators = [
    {
      name: 'Rahima Ratna Dewanti',
      nim: '2304130107',
      avatar: '/avatars/rahima.png', // Place your image at public/avatars/rahima.png
      audio: '/audio/rahima.mp3' // Place your audio at public/audio/rahima.mp3 (or set to null if no audio)
    },
    {
      name: 'Muthia Nis Tiadah',
      nim: '2304130117',
      avatar: '/avatars/muthia.png', // Place your image at public/avatars/muthia.png
      audio: '/audio/muthia.mp3' // Place your audio at public/audio/muthia.mp3 (or set to null if no audio)
    },
    {
      name: 'Zulfa Mardlotillah',
      nim: '2340130135',
      avatar: '/avatars/zulfa.jpg', // Place your image at public/avatars/zulfa.jpg
      audio: '/audio/zulfa.mp3' // Place your audio at public/audio/zulfa.mp3 (or set to null if no audio)
    }
  ]

  const togglePlay = (index) => {
    const newPlayingStates = [...playingStates]
    const isPlaying = newPlayingStates[index]
    
    // Stop all other audio
    audioRefs.forEach((audioRef, i) => {
      if (i !== index && audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
        newPlayingStates[i] = false
      }
    })

    if (audioRefs[index].current) {
      if (isPlaying) {
        audioRefs[index].current.pause()
        newPlayingStates[index] = false
        setPlayingStates(newPlayingStates)
      } else {
        // Play audio - state will be set to true in onPlay handler
        audioRefs[index].current.play().catch((error) => {
          console.error('Error playing audio:', error)
          newPlayingStates[index] = false
          setPlayingStates(newPlayingStates)
        })
        // Don't set state here - let onPlay handler do it
      }
    } else {
      // If no audio, just toggle the rotation
      newPlayingStates[index] = !isPlaying
      setPlayingStates(newPlayingStates)
    }
  }

  const handleLove = (index) => {
    // Love button functionality
    console.log(`Loved ${creators[index].name}`)
  }

  const handleEdit = (index) => {
    // Edit button functionality
    console.log(`Edit ${creators[index].name}`)
  }

  return (
    <section className="creator-showcase">
      <h2 className="creator-title">Created by</h2>
      <div className="creator-cards">
        {creators.map((creator, index) => (
          <div key={index} className="creator-card">
            <div className="card-overlay"></div>
            <div className="card-content">
              <div className="avatar-container">
                <img
                  src={creator.avatar}
                  alt={index === 0 ? 'Rahima Avatar' : creator.name}
                  className={`creator-avatar ${playingStates[index] ? 'playing' : ''}`}
                  style={{
                    animation: playingStates[index] ? 'rotate 3s linear infinite' : 'none'
                  }}
                  onError={(e) => {
                    // Fallback to placeholder if image not found
                    e.target.src = `https://via.placeholder.com/200/D56989/FFFFFF?text=${creator.name.split(' ').map(n => n[0]).join('')}`
                  }}
                />
                <div className="creator-info">
                  <p className="creator-name">{creator.name}</p>
                  <p className="creator-nim">{creator.nim}</p>
                </div>
              </div>
              <div className="card-controls">
                <button
                  className="control-btn love-btn"
                  onClick={() => handleLove(index)}
                  aria-label="Love"
                >
                  ❤️
                </button>
                <button
                  className="control-btn play-btn"
                  onClick={() => togglePlay(index)}
                  aria-label={playingStates[index] ? 'Pause' : 'Play'}
                >
                  {playingStates[index] ? '⏸' : '▶'}
                </button>
                <button
                  className="control-btn edit-btn"
                  onClick={() => handleEdit(index)}
                  aria-label="Edit"
                >
                  ✏️
                </button>
              </div>
            </div>
            {creator.audio && (
              <audio
                ref={audioRefs[index]}
                src={creator.audio}
                onEnded={() => {
                  const newStates = [...playingStates]
                  newStates[index] = false
                  setPlayingStates(newStates)
                }}
                onPause={() => {
                  const newStates = [...playingStates]
                  newStates[index] = false
                  setPlayingStates(newStates)
                }}
                onPlay={() => {
                  console.log(`Audio ${index} started playing`)
                  const newStates = [...playingStates]
                  newStates[index] = true
                  setPlayingStates(newStates)
                }}
                onError={(e) => {
                  console.error(`Audio ${index} error:`, e)
                  const newStates = [...playingStates]
                  newStates[index] = false
                  setPlayingStates(newStates)
                }}
              />
            )}
          </div>
        ))}
      </div> 
      <h3>With luv</h3>
    </section>
  )
}

export default CreatorShowcase

