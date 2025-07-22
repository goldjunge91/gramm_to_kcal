'use client'
import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'

// --- Physics Constants ---
const SCHNITZEL_SIZE = 120
const WALL_BOUNCINESS = 0.9 // How much energy is kept after a wall bounce
const AIR_FRICTION = 0.797 // Slows the schnitzel down over time
const MOUSE_BOUNCE_SPEED = 10 // The speed the schnitzel gets after a mouse bounce
const MAX_SPEED = 16 // Maximum speed

export default function FlyingSchnitzel() {
  const schnitzelRef = useRef<HTMLImageElement>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const mousePos = useRef({ x: -1, y: -1 })
  // Ref to prevent the schnitzel from getting "stuck" to the mouse
  const isCollidingWithMouse = useRef(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Set up the mouse listener once
  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      mousePos.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // The main animation loop
  useEffect(() => {
    if (!mounted || !schnitzelRef.current)
      return

    // --- Initial State ---
    let x = Math.random() * (window.innerWidth - SCHNITZEL_SIZE)
    let y = Math.random() * (window.innerHeight - SCHNITZEL_SIZE)

    const startAngle = Math.random() * 2 * Math.PI
    const startSpeed = 6
    let dx = Math.cos(startAngle) * startSpeed
    let dy = Math.sin(startAngle) * startSpeed

    let rotation = 0
    let animationFrameId: number

    function move() {
      if (!schnitzelRef.current)
        return

      // --- Physics Calculations ---
      const schnitzelCenterX = x + SCHNITZEL_SIZE / 2
      const schnitzelCenterY = y + SCHNITZEL_SIZE / 2

      // 1. Mouse Collision (New, Truly Random Logic)
      const distanceX = schnitzelCenterX - mousePos.current.x
      const distanceY = schnitzelCenterY - mousePos.current.y
      const distance = Math.hypot(distanceX, distanceY)
      const collisionRadius = SCHNITZEL_SIZE / 2

      if (distance < collisionRadius) {
        if (!isCollidingWithMouse.current) {
          isCollidingWithMouse.current = true

          // --- New Random Bounce Logic ---
          // This logic creates a completely new, random direction on every hit.

          // 1. Generate a new, completely random angle (0 to 360 degrees).
          const newRandomAngle = Math.random() * 2 * Math.PI

          // 2. Set the new velocity based on the random angle and a fixed bounce speed.
          // This ensures a strong, visible change in direction.
          dx = Math.cos(newRandomAngle) * MOUSE_BOUNCE_SPEED
          dy = Math.sin(newRandomAngle) * MOUSE_BOUNCE_SPEED
        }
      }
      else {
        isCollidingWithMouse.current = false // Reset when the mouse is clear
      }

      // 2. Wall Collision
      if (x <= 0) {
        x = 0
        dx = Math.abs(dx) * WALL_BOUNCINESS
      }
      else if (x >= window.innerWidth - SCHNITZEL_SIZE) {
        x = window.innerWidth - SCHNITZEL_SIZE
        dx = -Math.abs(dx) * WALL_BOUNCINESS
      }
      if (y <= 0) {
        y = 0
        dy = Math.abs(dy) * WALL_BOUNCINESS
      }
      else if (y >= window.innerHeight - SCHNITZEL_SIZE) {
        y = window.innerHeight - SCHNITZEL_SIZE
        dy = -Math.abs(dy) * WALL_BOUNCINESS
      }

      // 3. Apply Air Friction & Speed Limits
      dx *= AIR_FRICTION
      dy *= AIR_FRICTION

      const speed = Math.hypot(dx, dy)
      if (speed > MAX_SPEED) {
        dx = (dx / speed) * MAX_SPEED
        dy = (dy / speed) * MAX_SPEED
      }

      // --- Update Position & Rotation ---
      x += dx
      y += dy
      rotation += dx * 0.4 // Spin based on horizontal movement

      // --- Apply Styles ---
      schnitzelRef.current.style.left = `${x}px`
      schnitzelRef.current.style.top = `${y}px`
      schnitzelRef.current.style.transform = `rotate(${rotation}deg)`

      animationFrameId = requestAnimationFrame(move)
    }

    animationFrameId = requestAnimationFrame(move)
    return () => cancelAnimationFrame(animationFrameId)
  }, [mounted])

  if (!mounted || theme !== 'gunter')
    return null

  return (
    <>
      <style>
        {`
        #fliegendes-schnitzel {
          position: fixed;
          width: ${SCHNITZEL_SIZE}px;
          height: auto;
          z-index: 9999;
          pointer-events: none;
          will-change: transform, left, top;
          border-radius: 50%;
        }
      `}
      </style>
      <img
        src="/wiener_schnitzel.jpg"
        id="fliegendes-schnitzel"
        alt="Ein fliegendes Schnitzel"
        ref={schnitzelRef}
      />
    </>
  )
}
