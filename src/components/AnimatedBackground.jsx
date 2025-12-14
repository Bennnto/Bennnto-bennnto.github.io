import { useEffect, useRef } from 'react'

const AnimatedBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let animationFrameId

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const particles = []
    const particleCount = 100 // Density

    class Particle {
      constructor() {
        this.reset(true)
      }

      reset(initial = false) {
        this.radius = Math.random() * 3 + 1.5
        this.x = Math.random() * canvas.width
        this.y = Math.random() * canvas.height

        // Base speed
        this.vx = (Math.random() - 0.5) * 0.5 // Slow horizontal drift
        this.vy = (Math.random() - 0.5) * 0.5 // Slow vertical drift

        // Wave properties
        this.waveAmplitude = Math.random() * 20 + 10
        this.waveFrequency = Math.random() * 0.02 + 0.01
        this.phase = Math.random() * Math.PI * 2

        // Colors from Google Palette
        const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853']
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.opacity = Math.random() * 0.5 + 0.3
      }

      update(time, mouseX, mouseY) {
        // Base movement
        this.x += this.vx

        // Wave motion: y = base_y + sin(time)
        // We add the wave component to the y position
        // But we need to track base_y separately if we want it to drift
        // Let's just create a flow.

        // Simpler: Just Float with Sine modification
        this.x += Math.sin(time * this.waveFrequency + this.phase) * 0.5
        this.y += Math.cos(time * this.waveFrequency + this.phase) * 0.5 - 0.2 // Slight upward trend

        // Mouse Repulsion (Gentle)
        if (mouseX && mouseY) {
          const dx = this.x - mouseX
          const dy = this.y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 150

          if (distance < maxDist) {
            const force = (maxDist - distance) / maxDist
            const angle = Math.atan2(dy, dx)

            this.x += Math.cos(angle) * force * 1
            this.y += Math.sin(angle) * force * 1
          }
        }

        // Wrap around
        if (this.x < -50) this.x = canvas.width + 50
        if (this.x > canvas.width + 50) this.x = -50
        if (this.y < -50) this.y = canvas.height + 50
        if (this.y > canvas.height + 50) this.y = -50
      }

      draw() {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    let mouseX = null
    let mouseY = null
    let time = 0

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    const onMouseLeave = () => {
      mouseX = null
      mouseY = null
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      time += 1

      particles.forEach(particle => {
        particle.update(time, mouseX, mouseY)
        particle.draw()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full opacity-60"
      />
    </div>
  )
}

export default AnimatedBackground
