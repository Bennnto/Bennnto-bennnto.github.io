import { MapPin, Languages, User, GraduationCap } from 'lucide-react'

const About = () => {
  const infoItems = [
    { label: 'Name', value: 'Vissarut Promkaew' },
    { label: 'Preferred', value: 'Ben' },
    { label: 'Location', value: 'Toronto, ON', icon: MapPin },
    { label: 'Languages', value: 'English, Thai', icon: Languages },
  ]

  return (
    <section id="about" className="py-20 relative overflow-hidden">


      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title mb-6">
            About Me
          </h2>
          <div className="w-16 h-px bg-gray-300 mx-auto mb-8" />
          <p className="section-subtitle">
            A passionate developer crafting digital experiences
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {infoItems.map((item, index) => (
              <div key={index} className="text-center">
                <div className="mb-4">
                  {item.icon && (
                    <item.icon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  )}
                  <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">
                    {item.label}
                  </p>
                </div>
                <p className="text-xl font-light text-gray-900 dark:text-white">
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          {/* Bio */}
          <div className="text-center">
            <p className="text-lg text-gray-600 dark:text-gray-300 font-light leading-relaxed max-w-3xl mx-auto">
              I'm passionate about computer programming and constantly building and learning through hands-on projects
              at George Brown College in Toronto. I enjoy creating practical applications that solve real-world problems
              and am always eager to explore new technologies and methodologies in software development.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
