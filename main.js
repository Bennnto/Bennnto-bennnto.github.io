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


// ── ENVO PLAYGROUND INTERACTIVE RUNNER ──
(function () {
  const codeTextarea = document.getElementById('playground-code');
  const templateSelect = document.getElementById('playground-template');
  const runBtn = document.getElementById('playground-run-btn');
  const outputConsole = document.getElementById('playground-output');
  const clearBtn = document.getElementById('playground-clear-btn');

  if (!codeTextarea || !templateSelect || !runBtn || !outputConsole) return;

  const ENVO_TEMPLATES = {
    vars: `// Envo variable declarations

let greeting = "Hello, Envo!"
let pi = 3.14159

disp(greeting)
disp("x is:", x)
disp("pi is:", pi)`,

    loops: `// While loops & built-in math functions
let i = 1
let sum = 0

while (i <= 5) {
  disp("Loop step:", i)
  sum = sum + i
  i = i + 1
}

disp("Sum of 1..5 is:", sum)
disp("Square root of 100 is:", sqrt(100))`,

    'type-error': `// Demonstrating Envo's type checker (Simulated)
let score = 95

// Type Error Demo (If statically checked)
score = "Excellent"

disp("Score:", score)`
  };

  // 1. Template picker change
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    if (ENVO_TEMPLATES[selected]) {
      codeTextarea.value = ENVO_TEMPLATES[selected];
    }
  });

  // 2. Clear terminal output
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      outputConsole.textContent = '// Terminal cleared.';
    });
  }

  // 3. Run Envo script
  runBtn.addEventListener('click', () => {
    const code = codeTextarea.value;
    outputConsole.textContent = '';
    
    let logs = [];
    const logOutput = (text) => {
      logs.push(text);
    };

    // Run custom Javascript-based interpreter
    if (typeof window.runEnvoCode === 'function') {
      const res = window.runEnvoCode(code, logOutput);
      
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
      outputConsole.textContent = 'Error: Envo interpreter engine (envo.js) failed to load.';
    }
  });
})();




