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
    const particleCount = 70 // Google Antigravity isn't too crowded

    class Particle {
      constructor() {
        this.reset(true)
      }

      reset(initial = false) {
        // Visuals: Dashes (like the image)
        this.length = Math.random() * 8 + 4
        this.width = Math.random() * 2 + 1.5

        // Position
        this.x = Math.random() * canvas.width
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20

        // Movement: "Floating"
        this.vx = (Math.random() - 0.5) * 0.5 // Gentle drift
        this.vy = -(Math.random() * 0.5 + 0.2) // Slowly floating Up (Antigravity)

        // Wave/Wobble properties
        this.angle = Math.random() * Math.PI * 2
        this.angleSpeed = (Math.random() - 0.5) * 0.02

        // Color Palette (Google-ish, mostly Blue as per image)
        const colors = ['#4285F4', '#4285F4', '#4285F4', '#EA4335', '#FBBC05', '#34A853'] // Biased to Blue
        this.color = colors[Math.floor(Math.random() * colors.length)]
        this.opacity = Math.random() * 0.5 + 0.3

        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.05
      }

      update(mouseX, mouseY) {
        // 1. Base Floating Motion
        this.x += this.vx
        this.y += this.vy
        this.rotation += this.rotationSpeed

        // 2. Mouse "Wave" Interaction
        if (mouseX && mouseY) {
          const dx = this.x - mouseX
          const dy = this.y - mouseY
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 250 // Large radius for "Wave" feel

          if (distance < maxDist) {
            // Force strength depends on distance (smoother falloff)
            const force = (maxDist - distance) / maxDist

            // "Wave" effect: Push away strongly but smoothly
            const pushX = (dx / distance) * force * 5
            const pushY = (dy / distance) * force * 5

            this.x += pushX
            this.y += pushY

            // Add some "swirl" or rotation to the wave?
            this.rotation += force * 0.1
          }
        }

        // Wrap around / Respawn
        // If it floats off top, reset to bottom
        if (this.y < -50) this.reset()

        // Horizontal wrapping
        if (this.x < -50) this.x = canvas.width + 50
        if (this.x > canvas.width + 50) this.x = -50
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color

        // Draw Dash
        ctx.beginPath()
        ctx.roundRect(-this.length / 2, -this.width / 2, this.length, this.width, 2)
        ctx.fill()

        ctx.restore()
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle())
    }

    let mouseX = null
    let mouseY = null

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

      particles.forEach(particle => {
        particle.update(mouseX, mouseY)
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
        className="w-full h-full opacity-70"
      />
    </div>
  )
}

export default AnimatedBackground
