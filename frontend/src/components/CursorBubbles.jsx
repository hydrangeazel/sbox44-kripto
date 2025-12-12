import React, { useEffect, useState, useRef, useCallback } from 'react'
import './CursorBubbles.css'

// Move colors outside component to avoid recreation
const BUBBLE_COLORS = [
  'rgba(194, 220, 128, 0.7)', // soft green - more visible
  'rgba(234, 156, 175, 0.7)', // pink pastel - more visible
  'rgba(213, 105, 137, 0.7)', // deep rose - more visible
  'rgba(243, 238, 241, 0.8)', // light pastel - more visible
]

const getRandomColor = () => {
  return BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)]
}

const CursorBubbles = () => {
  const [bubbles, setBubbles] = useState([])
  const bubbleIdRef = useRef(0)
  const lastBubbleTimeRef = useRef(0)
  const timeoutRefs = useRef([])

  useEffect(() => {
    const maxBubbles = 20 // Maximum number of bubbles to keep on screen
    const throttleDelay = 50 // Minimum time between bubbles (ms)

    const handleMouseMove = (e) => {
      const now = Date.now()
      
      // Throttle bubble creation
      if (now - lastBubbleTimeRef.current < throttleDelay) {
        return
      }
      
      lastBubbleTimeRef.current = now

      const newBubble = {
        id: bubbleIdRef.current++,
        x: e.clientX,
        y: e.clientY,
        size: Math.random() * 50 + 30, // Random size between 30-80px (larger)
        color: getRandomColor(),
        delay: Math.random() * 0.2, // Random delay for animation
      }

      setBubbles((prev) => {
        const updated = [...prev, newBubble]
        // Keep only the last maxBubbles bubbles
        return updated.slice(-maxBubbles)
      })

      // Remove bubble after animation completes
      const timeoutId = setTimeout(() => {
        setBubbles((prev) => prev.filter((b) => b.id !== newBubble.id))
        timeoutRefs.current = timeoutRefs.current.filter(id => id !== timeoutId)
      }, 2000)
      timeoutRefs.current.push(timeoutId)
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      // Cleanup all pending timeouts
      timeoutRefs.current.forEach(timeoutId => clearTimeout(timeoutId))
      timeoutRefs.current = []
    }
  }, [])

  return (
    <div className="cursor-bubbles-container">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="cursor-bubble"
          style={{
            left: `${bubble.x}px`,
            top: `${bubble.y}px`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            background: bubble.color,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default CursorBubbles

