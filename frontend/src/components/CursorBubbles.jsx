import React, { useEffect, useState, useRef } from 'react'
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
  const lastBubblePositionRef = useRef({ x: null, y: null })
  const timeoutRefs = useRef([])

  useEffect(() => {
    const maxBubbles = 20 // Maximum number of bubbles to keep on screen
    const throttleDelay = 100 // Minimum time between bubbles (ms)
    const minDistance = 25 // Minimum distance in pixels before creating new bubble

    const handleMouseMove = (e) => {
      const now = Date.now()
      const timeSinceLastBubble = now - lastBubbleTimeRef.current
      
      // Calculate distance from last bubble position
      let distanceFromLastBubble = Infinity
      if (lastBubblePositionRef.current.x !== null && lastBubblePositionRef.current.y !== null) {
        const dx = e.clientX - lastBubblePositionRef.current.x
        const dy = e.clientY - lastBubblePositionRef.current.y
        distanceFromLastBubble = Math.sqrt(dx * dx + dy * dy)
      }
      
      // Create bubble only if enough time has passed OR mouse has moved enough distance
      // This prevents dense stacking during slow movement while allowing bubbles during fast movement
      if (timeSinceLastBubble < throttleDelay && distanceFromLastBubble < minDistance) {
        return
      }
      
      lastBubbleTimeRef.current = now

      // Add random position offset (±5px) to prevent perfect line formation
      const offsetX = (Math.random() - 0.5) * 10 // -5 to +5
      const offsetY = (Math.random() - 0.5) * 10 // -5 to +5

      const newBubble = {
        id: bubbleIdRef.current++,
        x: e.clientX + offsetX,
        y: e.clientY + offsetY,
        size: Math.random() * 25 + 15, // Random size between 15-40px (more natural range)
        color: getRandomColor(),
        delay: Math.random() * 0.2, // Random delay for animation
        highlightX: Math.random() * 30 + 20, // Random highlight position (20-50% from top)
        highlightY: Math.random() * 30 + 20, // Random highlight position (20-50% from left)
      }

      // Update last bubble position for distance calculation
      lastBubblePositionRef.current = { x: e.clientX, y: e.clientY }

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
            '--bubble-color': bubble.color,
            '--highlight-x': `${bubble.highlightX}%`,
            '--highlight-y': `${bubble.highlightY}%`,
            animationDelay: `${bubble.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default CursorBubbles

