// ── INTERACTIVE COLOR BLOCK GRID (GITHUB COMMIT SIMULATOR & LIVE FETCHER) ──
(async function () {
  const gridContainer = document.getElementById('interactive-grid');
  const tooltip = document.getElementById('grid-tooltip');
  if (!gridContainer || !tooltip) return;

  const COLS = 24;
  const ROWS = 7;
  const TOTAL_CELLS = COLS * ROWS;

  const daysData = [];

  // Attempt to fetch real contributions from public api proxy
  let realContributions = null;
  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/bennnto');
    if (res.ok) {
      const data = await res.json();
      if (data && data.contributions && data.contributions.length > 0) {
        // jogruber.de returns a flat array, just slice the end
        realContributions = data.contributions.slice(-TOTAL_CELLS);
      }
    }
  } catch (e) {
    console.warn("Could not fetch real GitHub contributions. Rendering empty grid.", e);
  }

  if (realContributions) {
    realContributions.forEach(day => {
      const dateObj = new Date(day.date + 'T00:00:00');
      const dateString = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      let count = day.contributionCount !== undefined ? day.contributionCount : (day.count || 0);
      let level = 0;
      if (day.contributionLevel) {
        if (day.contributionLevel === "FIRST_QUARTILE") level = 1;
        else if (day.contributionLevel === "SECOND_QUARTILE") level = 2;
        else if (day.contributionLevel === "THIRD_QUARTILE") level = 3;
        else if (day.contributionLevel === "FOURTH_QUARTILE") level = 4;
      } else if (day.level !== undefined) {
        level = day.level;
      }

      daysData.push({
        date: dateString,
        commitsCount: count,
        level: level
      });
    });
  } else {
    // Generate empty fallback grid (no fake data)
    const targetDate = new Date();
    const startMs = targetDate.getTime() - (TOTAL_CELLS - 1) * 24 * 60 * 60 * 1000;
    const startDate = new Date(startMs);

    for (let i = 0; i < TOTAL_CELLS; i++) {
      const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateString = currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      daysData.push({
        date: dateString,
        commitsCount: 0,
        level: 0
      });
    }
  }

  // Render Grid Cells
  daysData.forEach((day) => {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell', `lvl-${day.level}`);
    
    // Mouse Interaction: Tooltip Position & Data
    cell.addEventListener('mouseenter', () => {
      let tooltipContent = `<strong style="color:var(--text-primary)">${day.date}</strong><br>`;
      if (day.commitsCount === 0) {
        tooltipContent += `<span style="color:var(--text-secondary)">No contributions</span>`;
      } else {
        tooltipContent += `<span style="color:var(--accent-color); font-weight:600">${day.commitsCount} contribution${day.commitsCount > 1 ? 's' : ''}</span>`;
      }
      
      tooltip.innerHTML = tooltipContent;
      
      const containerRect = gridContainer.closest('.interactive-grid-container').getBoundingClientRect();
      const cellRect = cell.getBoundingClientRect();
      
      const left = cellRect.left - containerRect.left + (cellRect.width / 2);
      const top = cellRect.top - containerRect.top;
      
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
      tooltip.classList.add('visible');
    });

    cell.addEventListener('mouseleave', () => {
      tooltip.classList.remove('visible');
    });

    gridContainer.appendChild(cell);
    day.element = cell;
  });

})();


// ── LIGHT / DARK THEME TOGGLE ──
(function () {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const themeIcon = themeToggle.querySelector('.theme-icon') || themeToggle;
  const html = document.documentElement;

  // Retrieve theme preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  setTheme(initialTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  });

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
      themeIcon.textContent = '☾';
      themeToggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      themeIcon.textContent = '☀';
      themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  }
})();


// ── SCROLLSPY (NAV HIGHLIGHTING) ──
(function () {
  const sections = document.querySelectorAll('.portfolio-section');
  const navLinks = document.querySelectorAll('.nav-link');

  if (sections.length === 0 || navLinks.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px', // Trigger when section occupies the sweet spot of viewport
    threshold: 0
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => observer.observe(section));

  // Handle smooth scroll offsetting on nav click
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection) {
        const headerOffset = 80;
        const elementPosition = targetSection.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
        
        // Push state manually
        history.pushState(null, null, targetId);
      }
    });
  });
})();


// ── INTERACTIVE WEB TERMINAL CLI (ben-shell v2.6) ──
(function () {
  const cliScreen = document.getElementById('cli-screen');
  const cliInput = document.getElementById('cli-input');
  const chips = document.querySelectorAll('.cli-chip');

  if (!cliScreen || !cliInput) return;

  const COMMANDS = {
    help: `Available Commands:
  help            - Display this list of terminal commands
  skills          - Output technical skills table (Languages, DBs, Systems)
  projects        - List featured projects & GitHub repositories
  cat resume.txt  - Render resume summary & technical background
  whoami          - Output developer profile bio
  status          - Query live system telemetry (Domain, SSL, Uptime)
  theme           - Toggle site theme (Dark / Light)
  clear           - Clear terminal buffer screen`,

    skills: `Technical Skills & Stack Summary:
  [Languages]     Python, Rust (Beginner), C#, JavaScript (ES6+), SQL
  [Databases]     PostgreSQL, Redis (In-Memory Caching), SQLite
  [Backend/Dev]   REST APIs, Microservices, Async I/O, Docker, Git
  [Frontend]      HTML5, CSS3 (Vanilla), Next.js, AST Interpreters`,

    projects: `Featured Projects:
  1. Bennnto-bennnto.github.io (Custom Domain: bennnnto.me)
     └── Personal engineering portfolio & interactive Tress AST playground.
  2. Tress Scripting Language
     └── Statically-typed client-side AST lexer, parser, type checker, & evaluator.
  3. System Architecture Visualizer
     └── Microservices packet routing & Redis caching telemetry engine.`,

    'cat resume.txt': `Resume & Developer Profile (Ben - Software Engineer):
  ├── Specialization: Backend Systems, Rust/Python Tooling, Custom AST Parsers
  ├── Architecture:   Microservices, Caching Layering, High-Performance I/O
  ├── Custom Domain:  bennnnto.me (Configured with GitHub Pages A/CNAME Records)
  └── Contact:        ben@bennnnto.me`,

    whoami: `ben — Software Engineer & Open Source Developer. Focused on Python, Rust, Database Indexing, and clean web architecture.`,

    status: `System Status Telemetry [ben-shell v2.6]:
  ├── Domain Resolution:  bennnnto.me -> [185.199.108.153 OK]
  ├── SSL Certificate:    Active (HTTPS TLS v1.3)
  ├── Host Environment:   GitHub Pages CDN
  └── Terminal Status:    Operational (0 Errors)`,

    sudo: `[Permission Denied: User 'guest' is not in the sudoers file. This incident will be reported.]`
  };

  // Command Execution Handler
  function executeCommand(cmdStr) {
    const rawCmd = cmdStr.trim();
    if (!rawCmd) return;

    // Append Prompt Line
    appendLine('cmd-prompt', `ben@bennnnto.me:~$ ${rawCmd}`);

    const lowerCmd = rawCmd.toLowerCase();

    if (lowerCmd === 'clear') {
      cliScreen.innerHTML = '';
    } else if (lowerCmd === 'theme') {
      const themeBtn = document.getElementById('theme-toggle');
      if (themeBtn) themeBtn.click();
      appendLine('success-tag', '[Theme] Site theme toggled successfully.');
    } else if (COMMANDS[lowerCmd]) {
      appendLine('output-text', COMMANDS[lowerCmd]);
    } else {
      appendLine('error-tag', `command not found: ${rawCmd}. Type 'help' for available commands.`);
    }

    cliScreen.scrollTop = cliScreen.scrollHeight;
  }

  function appendLine(className, text) {
    const line = document.createElement('div');
    line.className = `cli-line ${className}`;
    line.textContent = text;
    cliScreen.appendChild(line);
  }

  // Input Enter Key Listener
  cliInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = cliInput.value;
      cliInput.value = '';
      executeCommand(val);
    }
  });

  // Quick Command Chips Listener
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const cmd = chip.dataset.cmd;
      if (cmd) executeCommand(cmd);
    });
  });
})();


// ── TRESS PLAYGROUND INTERACTIVE RUNNER & DOCS WAYFINDING ──
(function () {
  const codeTextarea = document.getElementById('playground-code');
  const templateSelect = document.getElementById('playground-template');
  const runBtn = document.getElementById('playground-run-btn');
  const outputConsole = document.getElementById('playground-output');
  const clearBtn = document.getElementById('playground-clear-btn');
  const docsToggle = document.getElementById('tress-docs-toggle');
  const docsDrawer = document.getElementById('tress-docs-drawer');
  const editorNumbers = document.getElementById('editor-numbers');

  if (!codeTextarea || !templateSelect || !runBtn || !outputConsole) return;

  const TRESS_TEMPLATES = {
    vars: `// Tress statically-typed variable declarations
init int: x = 42
init str: greeting = "Hello, Tress!"
init float: pi = 3.14159

disp(greeting)
disp("x is:", x)
disp("pi is:", pi)`,

    loops: `// While loops & built-in math functions
init int: i = 1
init int: sum = 0

while (i <= 5) {
  disp("Loop step:", i)
  sum = sum + i
  i = i + 1
}

disp("Sum of 1..5 is:", sum)
disp("Square root of 100 is:", sqrt(100))`,

    'type-error': `// Demonstrating Tress's static type checker
init int: score = 95

// Static Type Error: Cannot assign 'str' to 'int'
score = "Excellent"

disp("Score:", score)`
  };

  // 1. Dynamic Line Numbers Sync
  function updateLineNumbers() {
    if (!editorNumbers || !codeTextarea) return;
    const lineCount = codeTextarea.value.split('\n').length;
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(lineCount, 1); i++) {
      numbersHtml += `<span>${i}</span>`;
    }
    editorNumbers.innerHTML = numbersHtml;
  }

  codeTextarea.addEventListener('input', updateLineNumbers);
  codeTextarea.addEventListener('scroll', () => {
    if (editorNumbers) {
      editorNumbers.scrollTop = codeTextarea.scrollTop;
    }
  });
  updateLineNumbers();

  // 2. Documentation Drawer Toggle
  if (docsToggle && docsDrawer) {
    docsToggle.addEventListener('click', () => {
      const isHidden = docsDrawer.hasAttribute('hidden');
      if (isHidden) {
        docsDrawer.removeAttribute('hidden');
        docsToggle.classList.add('active');
        docsToggle.textContent = '✕ Close Ref';
      } else {
        docsDrawer.setAttribute('hidden', '');
        docsToggle.classList.remove('active');
        docsToggle.textContent = '📋 Quick Ref';
      }
    });
  }

  // 3. Template picker change
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    if (TRESS_TEMPLATES[selected]) {
      codeTextarea.value = TRESS_TEMPLATES[selected];
      updateLineNumbers();
    }
  });

  // 4. Clear terminal output
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      outputConsole.textContent = '// Terminal cleared.';
    });
  }

  // 5. Run Tress script
  runBtn.addEventListener('click', () => {
    const code = codeTextarea.value;
    outputConsole.textContent = '';
    
    let logs = [];
    const logOutput = (text) => {
      logs.push(text);
    };

    if (typeof window.runTressCode === 'function') {
      const res = window.runTressCode(code, logOutput);
      
      if (res.success) {
        if (logs.length === 0) {
          outputConsole.textContent = '// Program executed successfully with no output.\n';
        } else {
          outputConsole.textContent = logs.join('\n') + '\n';
        }
        outputConsole.innerHTML += `<span style="color:#10B981">// Process exited successfully with status 0</span>`;
      } else {
        if (logs.length > 0) {
          outputConsole.textContent = logs.join('\n') + '\n';
        }
        outputConsole.innerHTML += `<span style="color:#EF4444">${res.error}</span>`;
      }
    } else {
      outputConsole.textContent = 'Error: Tress interpreter engine (tress.js) failed to load.';
    }
  });
})();




