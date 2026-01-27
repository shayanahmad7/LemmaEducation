'use client'

import { useEffect, useRef } from 'react'

export default function CanvasBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width: number, height: number
    let waves: Wave[] = []
    const waveCount = 5

    // Colors from our palette (very low opacity)
    const colors = [
      'rgba(22, 66, 60, 0.05)',  // Deep Green
      'rgba(44, 95, 86, 0.05)',  // Lighter Green
      'rgba(15, 41, 34, 0.05)'   // Darkest
    ]

    function resize() {
      if (!canvas) return
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
    }

    class Wave {
      index: number
      offset: number
      speed: number
      amplitude: number
      color: string
      yBase: number

      constructor(index: number) {
        this.index = index
        this.offset = Math.random() * 100
        this.speed = 0.005 + Math.random() * 0.005
        this.amplitude = 100 + Math.random() * 100
        this.color = colors[index % colors.length]
        this.yBase = height / 2 + (Math.random() - 0.5) * 200
      }

      draw(time: number, context: CanvasRenderingContext2D) {
        context.beginPath()
        context.moveTo(0, this.yBase)
        
        // Draw sine wave across the screen
        for (let x = 0; x <= width; x += 10) {
          // Complex wave created by combining two sine waves
          const y = this.yBase + 
                   Math.sin(x * 0.003 + time * this.speed + this.offset) * this.amplitude +
                   Math.sin(x * 0.007 + time * 0.5 * this.speed) * (this.amplitude * 0.5)
          context.lineTo(x, y)
        }

        // Fill downward to create "fluid" look or stroke for "lines" look
        // Here we stroke for a "voice wave" aesthetic
        context.strokeStyle = this.color
        context.lineWidth = 2
        context.stroke()
        
        // Optional: Fill below for depth
        context.lineTo(width, height)
        context.lineTo(0, height)
        context.fillStyle = this.color
        context.fill()
      }
    }

    function init() {
      resize()
      waves = []
      for(let i = 0; i < waveCount; i++) {
        waves.push(new Wave(i))
      }
    }

    let time = 0
    let animationFrameId: number

    function animate() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, width, height)
      
      time += 1
      waves.forEach(wave => wave.draw(time, ctx))

      animationFrameId = requestAnimationFrame(animate)
    }

    const handleResize = () => {
      resize()
      // Re-center waves on resize
      waves.forEach(wave => wave.yBase = height / 2 + (Math.random() - 0.5) * 200)
    }

    window.addEventListener('resize', handleResize)

    init()
    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="canvas-bg"
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none"
    />
  )
}
