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

    // Google Blue (#4285F4)
    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] // Using Google colors for variety or just blue? 
    // Reference image mostly showed blue dashes. I will stick to predominantly blue but maybe variation in opacity.

    const particles = []
    const particleCount = 60 // Adjust for density

    class Particle {
      constructor() {
        this.reset(true)
      }

      reset(initial = false) {
        this.x = Math.random() * canvas.width
        this.y = initial ? Math.random() * canvas.height : canvas.height + 20
        // Dash dimensions
        this.length = Math.random() * 15 + 5
        this.width = Math.random() * 3 + 1

        // Movement
        this.speedX = (Math.random() - 0.5) * 1
        this.speedY = -Math.random() * 2 - 0.5 // Upward

        // Content
        this.rotation = Math.random() * Math.PI * 2
        this.rotationSpeed = (Math.random() - 0.5) * 0.05

        // Style
        this.color = '#4285F4' // Google Blue
        this.opacity = Math.random() * 0.6 + 0.2
      }

      update(mouseX, mouseY) {
        this.x += this.speedX
        this.y += this.speedY
        this.rotation += this.rotationSpeed

        // Mouse interaction
        if (mouseX && mouseY) {
          const dx = mouseX - this.x
          const dy = mouseY - this.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 200

          if (distance < maxDist) {
            const force = (maxDist - distance) / maxDist
            const angle = Math.atan2(dy, dx)

            this.x -= Math.cos(angle) * force * 3
            this.y -= Math.sin(angle) * force * 3
            this.rotation += 0.1
          }
        }

        if (this.y < -50) this.reset()
        if (this.x < -50) this.x = canvas.width + 50
        if (this.x > canvas.width + 50) this.x = -50
      }

      draw() {
        ctx.save()
        ctx.translate(this.x, this.y)
        ctx.rotate(this.rotation)
        ctx.globalAlpha = this.opacity
        ctx.fillStyle = this.color

        // Draw Dash/Rectangle
        // Rounded caps for nicer look
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
        className="w-full h-full"
      />
    </div>
  )
}

export default AnimatedBackground
