import { Github, Linkedin, Mail, ChevronDown } from 'lucide-react'

const Hero = () => {
  return (
    <section
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
    >


      <div className="hero-container text-center relative z-10">
        {/* Main Heading */}
        <h1 className="text-6xl md:text-8xl font-light mb-8 text-gray-900 dark:text-white tracking-tight">
          Ben Promkaew
        </h1>

        <div className="w-24 h-px bg-gray-300 mx-auto mb-8" />

        <p className="text-xl md:text-2xl text-accent mb-4 font-light">
          Computer Programming Student
        </p>

        <p className="text-lg text-accent mb-12 font-light">
          George Brown College, Toronto
        </p>

        <p className="text-base text-accent max-w-3xl mx-auto mb-16 font-light leading-relaxed">
          Building innovative applications and exploring cutting-edge technologies in software development.
          Passionate about creating solutions that make a difference.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
          <a
            href="#projects"
            className="btn-primary"
          >
            View Portfolio
          </a>
          <a
            href="#contact"
            className="btn-secondary"
          >
            Get In Touch
          </a>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-8">
          <a
            href="https://github.com/bennnto"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Github className="w-6 h-6" />
          </a>
          <a
            href="https://www.linkedin.com/in/vissarutp/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Linkedin className="w-6 h-6" />
          </a>
          <a
            href="mailto:ben.promkaew@icloud.com"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Mail className="w-6 h-6" />
          </a>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="flex flex-col items-center gap-2 text-gray-400">
            <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
