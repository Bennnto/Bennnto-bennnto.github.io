// ── INTERACTIVE COLOR BLOCK GRID (GITHUB COMMIT SIMULATOR) ──
(function () {
  const gridContainer = document.getElementById('interactive-grid');
  const tooltip = document.getElementById('grid-tooltip');
  if (!gridContainer || !tooltip) return;

  const COLS = 24;
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

  // Generate 168 days of contribution history ending today
  const targetDate = new Date('2026-06-22');
  const startMs = targetDate.getTime() - (TOTAL_CELLS - 1) * 24 * 60 * 60 * 1000;
  const startDate = new Date(startMs);

  for (let i = 0; i < TOTAL_CELLS; i++) {
    const currentDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateString = currentDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Randomize activity level: 0 (72%), 1 (14%), 2 (8%), 3 (4%), 4 (2%)
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
      commitsCount = Math.floor(Math.random() * 3) + 4; // 4 to 6 commits
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

  // Render Grid Cells
  daysData.forEach((day, index) => {
    const cell = document.createElement('div');
    cell.classList.add('grid-cell', `lvl-${day.level}`);
    
    // Mouse Interaction: Tooltip Position & Data
    cell.addEventListener('mouseenter', (e) => {
      let tooltipContent = `<strong style="color:var(--text-primary)">${day.date}</strong><br>`;
      if (day.commitsCount === 0) {
        tooltipContent += `<span style="color:var(--text-secondary)">No contributions</span>`;
      } else {
        tooltipContent += `<span style="color:var(--accent-color); font-weight:600">${day.commitsCount} contribution${day.commitsCount > 1 ? 's' : ''}</span><br>`;
        day.commits.forEach(msg => {
          tooltipContent += `<span style="color:var(--text-muted)">└</span> ${msg}<br>`;
        });
      }
      
      tooltip.innerHTML = tooltipContent;
      
      // Calculate coordinates relative to .interactive-grid-container
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
    day.element = cell; // Reference element for real-time commits simulation
  });

  // Simulate Real-time commits (Dynamic activity updates)
  setInterval(() => {
    // Pick a random day index (preferring recent weeks for realism)
    const recentIndex = TOTAL_CELLS - 1 - Math.floor(Math.random() * 28); // last 4 weeks
    const day = daysData[recentIndex];
    if (!day || !day.element) return;

    day.commitsCount += 1;
    // Cap level at 4
    if (day.level < 4) {
      day.element.classList.remove(`lvl-${day.level}`);
      day.level += 1;
      day.element.classList.add(`lvl-${day.level}`);
    }

    const newCommit = COMMIT_MESSAGES[Math.floor(Math.random() * COMMIT_MESSAGES.length)];
    day.commits.unshift(newCommit); // Add to beginning

    // Visual Flash Effect
    day.element.style.transition = 'none';
    day.element.style.backgroundColor = '#FFFFFF';
    day.element.offsetHeight; // Trigger repaint
    day.element.style.transition = 'background-color 1.2s ease';
    day.element.style.backgroundColor = '';
  }, 5000);
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
