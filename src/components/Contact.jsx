import { Mail, Linkedin, Github, MapPin } from 'lucide-react'

const Contact = () => {
  const contactMethods = [
    {
      icon: Mail,
      label: 'Email',
      value: 'ben.promkaew@icloud.com',
      href: 'mailto:ben.promkaew@icloud.com',
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: 'vissarutp',
      href: 'https://www.linkedin.com/in/vissarutp/',
    },
    {
      icon: Github,
      label: 'GitHub',
      value: 'bennnto',
      href: 'https://github.com/bennnto',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Toronto, ON',
      href: null,
    },
  ]

  return (
    <section id="contact" className="py-20 relative overflow-hidden">

      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title mb-6">
            Get In Touch
          </h2>
          <div className="w-16 h-px bg-gray-300 mx-auto mb-8" />
          <p className="section-subtitle">
            I'm always interested in new opportunities and exciting projects
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {contactMethods.map((method, index) => (
              <div key={index} className="text-center">
                {method.href ? (
                  <a
                    href={method.href}
                    target={method.href.startsWith('http') ? '_blank' : undefined}
                    rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="group block"
                  >
                    <method.icon className="w-8 h-8 text-gray-600 mx-auto mb-4 group-hover:text-gray-900 transition-colors" />
                    <p className="text-sm text-gray-500 font-medium tracking-wide uppercase mb-2">
                      {method.label}
                    </p>
                    <p className="text-lg font-light text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                      {method.value}
                    </p>
                  </a>
                ) : (
                  <div>
                    <method.icon className="w-8 h-8 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500 dark:text-gray-500 font-medium tracking-wide uppercase mb-2">
                      {method.label}
                    </p>
                    <p className="text-lg font-light text-gray-900 dark:text-white">
                      {method.value}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <a
              href="mailto:ben.promkaew@icloud.com"
              className="btn-primary"
            >
              Send Me a Message
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
