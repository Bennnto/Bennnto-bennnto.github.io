// ── INTERACTIVE COLOR BLOCK GRID (GITHUB COMMIT SIMULATOR & LIVE FETCHER) ──
(async function () {
  const gridContainer = document.getElementById('interactive-grid');
  const tooltip = document.getElementById('grid-tooltip');
  if (!gridContainer || !tooltip) return;

  const COLS = 20;
  const ROWS = 7;
  const TOTAL_CELLS = COLS * ROWS;

  // Curated lists of commit messages reflecting Ben's actual stack & projects
  const COMMIT_MESSAGES = [
    "feat: implement lexical parser and static type checker for Typr",
    "refactor: optimize AST evaluation logic in Typr interpreter",
    "feat: add SQLAlchemy relationships for snippet schema",
    "fix: patch PyQt5 event loop freeze in weather forecast",
    "feat: implement OpenCV frame blurring filter using MediaPipe",
    "refactor: clean up FastAPI endpoints in snippet_api",
    "docs: document REST endpoints for Vault API in Swagger",
    "style: design dark terminal console for CLI task tracker",
    "test: write unit tests for JWT user identity validation",
    "feat: add macOS memory diagnostics monitoring in bash tool",
    "fix: resolve SQLite lock exception in Django tracking calendar",
    "feat: implement pomodoro countdown timers with multi-threading",
    "refactor: convert temperature converter GUI from PyQt5 to PyQt6",
    "docs: write comprehensive README for expense ledger",
    "feat: handle OAuth2 registration workflow in Django identity module",
    "feat: support CSV exports for local expense tracking tool",
    "fix: solve CORS middleware block in FastAPI deployments",
    "refactor: simplify routing logic in python bookmarks dashboard",
    "feat: cache OpenWeather API responses to limit endpoint throttling",
    "perf: optimize contour detection speeds in face blurring script",
    "style: override standard focus outlines with brutalist borders",
    "feat: implement copy-to-clipboard for API response terminal"
  ];

  const daysData = [];

  // Attempt to fetch real contributions from public api proxy
  let realContributions = null;
  try {
    const res = await fetch('https://github-contributions-api.jogruber.de/v4/bennnto');
    if (res.ok) {
      const data = await res.json();
      if (data && data.contributions && data.contributions.length >= TOTAL_CELLS) {
        realContributions = data.contributions.slice(-TOTAL_CELLS);
      }
    }
  } catch (e) {
    console.warn("Could not fetch real GitHub contributions, running fallback simulation.", e);
  }

  if (realContributions) {
    realContributions.forEach(day => {
      const dateObj = new Date(day.date + 'T00:00:00');
      const dateString = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const dayCommits = [];
      for (let c = 0; c < day.count; c++) {
        const msg = COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
        dayCommits.push(msg);
      }

      daysData.push({
        date: dateString,
        commitsCount: day.count,
        commits: dayCommits,
        level: day.level
      });
    });
  } else {
    // Fallback simulation generator
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

      const rand = Math.random();
      let commitsCount = 0;
      let level = 0;

      if (rand > 0.72 && rand <= 0.86) {
        commitsCount = 1;
        level = 1;
      } else if (rand > 0.86 && rand <= 0.94) {
        commitsCount = 2;
        level = 2;
      } else if (rand > 0.94 && rand <= 0.98) {
        commitsCount = 3;
        level = 3;
      } else if (rand > 0.98) {
        commitsCount = Math.floor(Math.random() * 3) + 4;
        level = 4;
      }

      const dayCommits = [];
      for (let c = 0; c < commitsCount; c++) {
        const msg = COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
        dayCommits.push(msg);
      }

      daysData.push({
        date: dateString,
        commitsCount,
        commits: dayCommits,
        level
      });
    }
  }

  // Render Grid Cells in 10 horizontal lanes
  const ROWS_COUNT = 10;
  const COLS_COUNT = 20;

  for (let r = 0; r < ROWS_COUNT; r++) {
    const lane = document.createElement('div');
    lane.classList.add('grid-lane');

    const track = document.createElement('div');
    track.classList.add('lane-track');
    // Set initial centered position
    track.style.transform = 'translate3d(-270px, 0, 0)';

    // Get the 20 days for this row
    const rowDays = daysData.slice(r * COLS_COUNT, (r + 1) * COLS_COUNT);

    // Helper to create and bind event listeners to a cell
    const createCellElement = (day, colIdx) => {
      const cell = document.createElement('div');
      cell.classList.add('grid-cell', `lvl-${day.level}`);
      if (r === 0 && colIdx === 5) {
        cell.classList.add('tilted-cell');
      }

      // Mouse Interaction: Tooltip Position & Data
      cell.addEventListener('mouseenter', () => {
        let tooltipContent = `<strong style="color:var(--text-primary)">${day.date}</strong><br>`;
        if (day.commitsCount === 0) {
          tooltipContent += `<span style="color:var(--text-secondary)">No contributions</span>`;
        } else {
          tooltipContent += `<span style="color:var(--accent-color); font-weight:600">${day.commitsCount} contribution${day.commitsCount > 1 ? 's' : ''}</span><br>`;
          // Cap commits list rendering to max 5 in tooltip to avoid overflow
          const displayCommits = day.commits.slice(0, 5);
          displayCommits.forEach(msg => {
            tooltipContent += `<span style="color:var(--text-muted)">└</span> ${msg}<br>`;
          });
          if (day.commits.length > 5) {
            tooltipContent += `<span style="color:var(--text-muted)">...and ${day.commits.length - 5} more</span>`;
          }
        }
        tooltip.innerHTML = tooltipContent;
        tooltip.classList.add('visible');
      });

      cell.addEventListener('mousemove', (e) => {
        const containerRect = gridContainer.closest('.interactive-grid-container').getBoundingClientRect();
        const left = e.clientX - containerRect.left;
        const top = e.clientY - containerRect.top - 15; // float above cursor
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      });

      cell.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });

      return cell;
    };

    // Render original cells
    rowDays.forEach((day, colIdx) => {
      const cell = createCellElement(day, colIdx);
      cell.style.animationDelay = `${(r * 25) + (colIdx * 15)}ms`;
      track.appendChild(cell);
      day.element = cell;
    });

    // Render duplicate cells for seamless infinite loop
    rowDays.forEach((day, colIdx) => {
      const duplicateCell = createCellElement(day, colIdx);
      track.appendChild(duplicateCell);
    });

    lane.appendChild(track);
    gridContainer.appendChild(lane);
  }
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


// ── REST API PLAYGROUND CONSOLE ──
(function () {
  const apiBaseInput = document.getElementById('api-base-url');
  const endpointBtns = document.querySelectorAll('.api-endpoint-btn');
  const endpointDesc = document.getElementById('endpoint-description');
  const fieldIdWrapper = document.getElementById('field-id-wrapper');
  const fieldBodyWrapper = document.getElementById('field-body-wrapper');
  const inputId = document.getElementById('endpoint-id');
  const inputBody = document.getElementById('endpoint-body');
  const submitBtn = document.getElementById('api-submit-btn');
  const terminalStatus = document.getElementById('terminal-status');
  const terminalOutput = document.getElementById('terminal-output');
  const copyBtn = document.getElementById('api-copy-btn');
  const statusIndicator = document.querySelector('.status-indicator-light');

  if (endpointBtns.length === 0) return;

  let activeEndpoint = endpointBtns[0];

  // 1. Initial State Load
  updateConsoleConfig(activeEndpoint);
  checkApiHealth();

  // 2. Select Endpoint Click Handlers
  endpointBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      endpointBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeEndpoint = btn;

      updateConsoleConfig(btn);
    });
  });

  // 3. Update Form Config depending on endpoint dataset
  function updateConsoleConfig(btn) {
    const desc = btn.dataset.desc;
    const needsId = btn.dataset.needsId === 'true';
    const needsBody = btn.dataset.needsBody === 'true';
    const bodyTemplate = btn.dataset.bodyTemplate || '';

    // Description text update
    endpointDesc.textContent = desc;

    // Toggle Path Parameter {id} input field
    fieldIdWrapper.hidden = !needsId;

    // Toggle JSON Body textarea
    fieldBodyWrapper.hidden = !needsBody;
    if (needsBody) {
      // Format template body JSON
      try {
        const parsed = JSON.parse(bodyTemplate);
        inputBody.value = JSON.stringify(parsed, null, 2);
      } catch (e) {
        inputBody.value = bodyTemplate;
      }
    }
  }

  // 4. Test API Health on load
  async function checkApiHealth() {
    const baseUrl = apiBaseInput.value.trim().replace(/\/$/, '');
    try {
      // Test request to wake up Render instance (GET /snip/)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for wake up test

      const res = await fetch(`${baseUrl}/snip/`, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        statusIndicator.classList.add('live');
        statusIndicator.title = 'API Status: Active';
      } else {
        statusIndicator.classList.remove('live');
        statusIndicator.title = 'API Status: Offline';
      }
    } catch (err) {
      statusIndicator.classList.remove('live');
      statusIndicator.title = 'API Status: Offline';
    }
  }

  // 5. Submit Query handler
  submitBtn.addEventListener('click', async () => {
    const method = activeEndpoint.dataset.method;
    let path = activeEndpoint.dataset.path;
    const needsId = activeEndpoint.dataset.needsId === 'true';
    const needsBody = activeEndpoint.dataset.needsBody === 'true';
    const baseUrl = apiBaseInput.value.trim().replace(/\/$/, '');

    // Replace URL parameters
    if (needsId) {
      const idVal = inputId.value.trim();
      if (!idVal) {
        showResponse('error', 'Client Error', 'Error: {id} path parameter is required.');
        return;
      }
      path = path.replace('{id}', idVal);
    }

    const requestUrl = baseUrl + path;
    const originalText = submitBtn.innerHTML;

    // Set Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳</span> SENDING...';
    terminalStatus.textContent = 'Sending...';
    terminalStatus.className = 'status-code idle';
    terminalOutput.textContent = `// Connecting to ${requestUrl}...`;
    copyBtn.disabled = true;

    try {
      const options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      if (needsBody) {
        const bodyContent = inputBody.value.trim();
        // Validate JSON
        try {
          JSON.parse(bodyContent);
          options.body = bodyContent;
        } catch (jsonErr) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
          showResponse('error', '400 Bad Request', `Client Error: Invalid JSON input.\n${jsonErr.message}`);
          return;
        }
      }

      const res = await fetch(requestUrl, options);
      const text = await res.text();
      let formattedBody;

      try {
        const json = JSON.parse(text);
        formattedBody = JSON.stringify(json, null, 2);
      } catch (e) {
        formattedBody = text; // Display plain text if not JSON
      }

      const statusText = `${res.status} ${res.statusText || getHttpStatusText(res.status)}`;
      const statusClass = res.ok ? 'success' : 'error';

      showResponse(statusClass, statusText, formattedBody);

      // If successful, ensure indicator is green
      if (res.ok) {
        statusIndicator.classList.add('live');
      }

    } catch (fetchErr) {
      showResponse('error', 'Fetch Failed', `Network Error: Could not connect to API server.\n- Check if the Base URL is correct.\n- Ensure the Render instance is online (it may take 1-2 minutes to spin up from sleep).\n\nDetails: ${fetchErr.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });

  function showResponse(statusClass, statusText, responseBody) {
    terminalStatus.textContent = statusText;
    terminalStatus.className = `status-code ${statusClass}`;
    terminalOutput.textContent = responseBody;
    copyBtn.disabled = false;
    copyBtn.textContent = 'Copy';
  }

  // Copy to Clipboard
  copyBtn.addEventListener('click', () => {
    if (copyBtn.disabled) return;
    navigator.clipboard.writeText(terminalOutput.textContent).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  });

  // Helper function to return standard HTTP status strings if statusText is missing
  function getHttpStatusText(code) {
    const statuses = {
      200: 'OK',
      201: 'Created',
      202: 'Accepted',
      204: 'No Content',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Entity',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable'
    };
    return statuses[code] || 'Unknown';
  }
})();


// ── TYPR PLAYGROUND INTERACTIVE RUNNER ──
(function () {
  const codeTextarea = document.getElementById('playground-code');
  const templateSelect = document.getElementById('playground-template');
  const runBtn = document.getElementById('playground-run-btn');
  const outputConsole = document.getElementById('playground-output');
  const clearBtn = document.getElementById('playground-clear-btn');

  if (!codeTextarea || !templateSelect || !runBtn || !outputConsole) return;

  const TYPR_TEMPLATES = {
    vars: `// Typr statically-typed variable declarations
init int: x = 42
init str: greeting = "Hello, Typr!"
let pi = 3.14159

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

    'type-error': `// Demonstrating Typr's static type checker
init int: score = 95

// Type Error! Cannot assign string to int
score = "Excellent"

disp("Score:", score)`
  };

  // 1. Template picker change
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    if (TYPR_TEMPLATES[selected]) {
      codeTextarea.value = TYPR_TEMPLATES[selected];
    }
  });

  // 2. Clear terminal output
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      outputConsole.textContent = '// Terminal cleared.';
    });
  }

  // 3. Run Typr script
  runBtn.addEventListener('click', () => {
    const code = codeTextarea.value;
    outputConsole.textContent = '';

    let logs = [];
    const logOutput = (text) => {
      logs.push(text);
    };

    // Run custom Javascript-based interpreter
    if (typeof window.runTyprCode === 'function') {
      const res = window.runTyprCode(code, logOutput);

      if (res.success) {
        if (logs.length === 0) {
          outputConsole.textContent = '// Program executed successfully with no output.\n';
        } else {
          outputConsole.textContent = logs.join('\n') + '\n';
        }
        outputConsole.innerHTML += `<span style="color:#10B981">// Process exited successfully with status 0</span>`;
      } else {
        // Render error output
        if (logs.length > 0) {
          outputConsole.textContent = logs.join('\n') + '\n';
        }
        outputConsole.innerHTML += `<span style="color:#EF4444">${res.error}</span>`;
      }
    } else {
      outputConsole.textContent = 'Error: Typr interpreter engine (typr.js) failed to load.';
    }
  });
})();


// ── SHRINK LEFT COLUMN ON SCROLL & GRID PARALLAX ──
(function () {
  const twoCol = document.querySelector('.two-col');
  const tracks = document.querySelectorAll('.lane-track');
  if (!twoCol) return;

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Toggle column shrink
    if (scrollY > 80) {
      twoCol.classList.add('scrolled');
    } else {
      twoCol.classList.remove('scrolled');
    }

    // Scroll-driven horizontal parallax of grid rows (marquee tracks)
    tracks.forEach((track, idx) => {
      const direction = idx % 2 === 0 ? -1 : 1;
      // Varying speeds: 0.12px, 0.22px, 0.32px per scroll pixel
      const speed = 0.12 + (idx % 3) * 0.1;
      const xOffset = direction * scrollY * speed;

      const baseOffset = -270; // initial centered offset
      track.style.transform = `translate3d(${baseOffset + xOffset}px, 0, 0)`;
    });
  }, { passive: true });
})();




