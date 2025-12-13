import { Code, Database, Terminal, Layout } from 'lucide-react'

const Skills = () => {
  const skillCategories = [
    {
      title: 'Frontend Development',
      icon: Layout,
      skills: ['HTML5', 'CSS3', 'JavaScript', 'jQuery', 'React', 'Tailwind CSS'],
    },
    {
      title: 'Backend Development',
      icon: Database,
      skills: ['Python', 'Django', 'Node.js', 'MySQL', 'MongoDB'],
    },
    {
      title: 'Programming Languages',
      icon: Code,
      skills: ['.NET C#', 'Python', 'JavaScript', 'Bash'],
    },
    {
      title: 'Tools & Technologies',
      icon: Terminal,
      skills: ['Git', 'GitHub', 'Shell Scripts', 'VS Code', 'REST APIs'],
    },
  ]

  return (
    <section id="skills" className="py-20 relative overflow-hidden">


      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title mb-6">
            Skills & Expertise
          </h2>
          <div className="w-16 h-px bg-gray-300 mx-auto mb-8" />
          <p className="section-subtitle">
            Technologies and tools I use to build innovative solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {skillCategories.map((category, index) => (
            <div key={index} className="text-center">
              <div className="mb-6">
                <category.icon className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
                  {category.title}
                </h3>
              </div>

              <div className="flex flex-wrap gap-3 justify-center">
                {category.skills.map((skill, skillIndex) => (
                  <span
                    key={skillIndex}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-light tracking-wide uppercase"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
