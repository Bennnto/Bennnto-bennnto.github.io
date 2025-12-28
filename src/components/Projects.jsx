import { Github, ExternalLink } from 'lucide-react'

const Projects = () => {
  const projects = [
    {
      title: 'Weather Application',
      description: 'A Python weather application with a PyQt5 GUI that fetches real-time weather data using OpenWeather API. Features geocoding to convert city names to coordinates and displays comprehensive weather information.',
      tech: ['Python', 'PyQt5', 'API Integration', 'GUI'],
      github: 'https://github.com/Bennnto/Weather',
    },
    {
      title: 'CLI Todo List',
      description: 'A powerful command-line todo list application built with Python featuring task management, priority levels, due dates, and data persistence.',
      tech: ['Python', 'CLI', 'File I/O', 'Data Structures'],
      github: 'https://github.com/Bennnto/Cli-Todo-list',
    },
    {
      title: 'Inventory Console Application',
      description: 'A comprehensive inventory management system built with .NET C# for managing stock and products efficiently.',
      tech: ['.NET C#', 'Console Application'],
      github: 'https://github.com/Bennnto/-net-space',
    },
    {
      title: 'Selfhost Bookmarks Manager',
      description: 'A clean, local bookmarks manager designed to save and organize favorite URLs with an intuitive interface.',
      tech: ['HTML', 'CSS', 'JavaScript'],
      github: 'https://github.com/Bennnto/URL-Bookmarks',
    },
    {
      title: 'System Monitoring Tool',
      description: 'A macOS system statistics monitoring utility built with Bash shell scripting for real-time system insights.',
      tech: ['Bash', 'Shell Scripting'],
      github: 'https://github.com/Bennnto/simple_system_monitor_Bash',
    },
    {
      title: 'Face Blur Video Processor',
      description: 'An AI-powered Python application that automatically detects and blurs faces in videos using OpenCV and MediaPipe.',
      tech: ['Python', 'OpenCV', 'MediaPipe', 'Computer Vision'],
      github: 'https://github.com/Bennnto',
    },
    {
      title: 'Pomodoro Timer',
      description: 'A Pomodoro productivity timer available in both command-line interface and GUI versions, featuring customizable work/break intervals, cycle management, and pause/resume controls.',
      tech: ['Python', 'Tkinter', 'Threading', 'CLI'],
      github: 'https://github.com/Bennnto/Pomodoro_Timer',
    },
    {
      title: 'Expense Tracker',
      description: 'A command-line expense tracking application that allows users to add, list, and delete expenses with JSON-based local storage. Features customizable categories and detailed expense management.',
      tech: ['Python', 'JSON', 'CLI', 'File I/O'],
      github: 'https://github.com/Bennnto/Expense_tracker',
    }
  ]

  return (
    <section id="projects" className="py-20 relative overflow-hidden">

      <div className="section-container relative z-10">
        <div className="text-center mb-16">
          <h2 className="section-title mb-6">
            Projects
          </h2>
          <div className="w-16 h-px bg-gray-300 dark:bg-gray-600 mx-auto mb-8" />
          <p className="section-subtitle">
            My personal collection of coding practice projects
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <div key={index} className="group">
              <div className="card p-8 h-full">
                <h3 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
                  {project.title}
                </h3>

                <p className="text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-6">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {project.tech.map((tech, techIndex) => (
                    <span
                      key={techIndex}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-light tracking-wide uppercase"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-light tracking-wide uppercase text-sm transition-colors group-hover:underline"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* View All Projects */}
        <div className="text-center mt-16">
          <a
            href="https://github.com/bennnto"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            View All Projects
          </a>
        </div>
      </div>
    </section>
  )
}

export default Projects
