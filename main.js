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


// ── SYSTEM ARCHITECTURE VISUALIZER ──
(function () {
  const scenarioBtns = document.querySelectorAll('.arch-scenario-btn');
  const triggerBtn = document.getElementById('arch-trigger-btn');
  const statusBadge = document.getElementById('arch-packet-status');
  const logStream = document.getElementById('arch-log-stream');
  const payloadViewer = document.getElementById('arch-payload-viewer');

  if (scenarioBtns.length === 0 || !triggerBtn) return;

  let activeScenario = 'cache-hit';
  let isSimulating = false;

  const scenariosData = {
    'cache-hit': {
      method: 'GET',
      path: '/api/v1/users/active',
      desc: 'GET request with Redis cache hit (4ms total latency)',
      nodes: ['client', 'gateway', 'cache'],
      steps: [
        { node: 'client', status: 'Sending GET /api/v1/users/active', delay: 300 },
        { node: 'gateway', status: 'JWT Verified & Rate Limit Pass', delay: 400 },
        { node: 'cache', status: 'Cache Hit (Key: users:active)', delay: 400 }
      ],
      resultStatus: '200 OK (Cache Hit)',
      resultClass: 'success',
      payload: {
        status: 200,
        cache: 'HIT',
        ttl: 298,
        latency_ms: 4,
        data: [
          { id: 101, username: 'vissarut_p', role: 'admin' },
          { id: 102, username: 'dev_ben', role: 'engineer' }
        ]
      }
    },
    'cache-miss': {
      method: 'GET',
      path: '/api/v1/analytics/daily',
      desc: 'GET request with Cache Miss -> App Server -> Postgres DB -> Cache Populate',
      nodes: ['client', 'gateway', 'cache', 'server', 'db'],
      steps: [
        { node: 'client', status: 'Sending GET /api/v1/analytics/daily', delay: 300 },
        { node: 'gateway', status: 'JWT Auth OK -> Proxy to Cache', delay: 350 },
        { node: 'cache', status: 'Cache Miss (Key: analytics:daily)', delay: 350 },
        { node: 'server', status: 'Forward Query to App Server', delay: 400 },
        { node: 'db', status: 'Execute Index Scan on PostgreSQL', delay: 500 },
        { node: 'server', status: 'Write Payload Back to Redis Cache', delay: 300 }
      ],
      resultStatus: '200 OK (Cache Miss)',
      resultClass: 'success',
      payload: {
        status: 200,
        cache: 'MISS',
        latency_ms: 45,
        db_query_ms: 38,
        data: {
          total_requests: 14820,
          p95_latency: '12ms',
          uptime: '99.98%'
        }
      }
    },
    'db-write': {
      method: 'POST',
      path: '/api/v1/orders/new',
      desc: 'POST request -> Write DB Transaction -> Invalidate Stale Cache',
      nodes: ['client', 'gateway', 'server', 'db', 'cache'],
      steps: [
        { node: 'client', status: 'Sending POST /api/v1/orders/new', delay: 300 },
        { node: 'gateway', status: 'Rate Limit OK -> Pass to App Server', delay: 400 },
        { node: 'server', status: 'Validate Payload -> Begin DB Tx', delay: 400 },
        { node: 'db', status: 'INSERT into PostgreSQL orders table', delay: 600 },
        { node: 'cache', status: 'Evict Stale Cache (DEL orders:*)', delay: 400 }
      ],
      resultStatus: '201 Created',
      resultClass: 'success',
      payload: {
        status: 201,
        message: 'Order created successfully',
        order_id: 'ord_984210',
        cache_invalidated: true,
        latency_ms: 68
      }
    },
    'rate-limit': {
      method: 'GET',
      path: '/api/v1/sensitive/data',
      desc: 'Exceeded Token Bucket Rate Limit at API Gateway',
      nodes: ['client', 'gateway'],
      steps: [
        { node: 'client', status: 'Sending Burst GET Requests...', delay: 300 },
        { node: 'gateway', status: 'Token Bucket Empty! Rate Limit Exceeded', delay: 500 }
      ],
      resultStatus: '429 Too Many Requests',
      resultClass: 'error',
      payload: {
        status: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded: Max 100 req/min',
        retry_after_sec: 42
      }
    }
  };

  // Scenario Selector Handler
  scenarioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isSimulating) return;
      scenarioBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeScenario = btn.dataset.scenario;
      appendLog('info', `[Scenario Selected] ${scenariosData[activeScenario].desc}`);
    });
  });

  // Simulation Trigger Handler
  triggerBtn.addEventListener('click', async () => {
    if (isSimulating) return;
    isSimulating = true;
    triggerBtn.disabled = true;
    triggerBtn.innerHTML = '<span>⏳</span> ROUTING PACKET...';

    const scenario = scenariosData[activeScenario];
    statusBadge.textContent = 'Status: Routing...';
    statusBadge.className = 'status-code idle';
    payloadViewer.textContent = '// Simulating packet flow through architecture...';

    clearAllNodeStates();
    appendLog('info', `--- Starting Scenario: ${scenario.method} ${scenario.path} ---`);

    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      const nodeEl = document.getElementById(`node-${step.node}`);
      const badgeEl = nodeEl.querySelector('.node-status-badge');

      // Highlight active node
      setNodeState(nodeEl, badgeEl, 'processing', 'Processing');
      appendLog('step', `[${getNodeLabel(step.node)}] ${step.status}`);

      await sleep(step.delay);

      if (i < scenario.steps.length - 1) {
        setNodeState(nodeEl, badgeEl, 'success', 'Done');
      } else {
        const finalClass = scenario.resultClass === 'error' ? 'error' : 'success';
        setNodeState(nodeEl, badgeEl, finalClass, finalClass.toUpperCase());
      }
    }

    statusBadge.textContent = `Status: ${scenario.resultStatus}`;
    statusBadge.className = `status-code ${scenario.resultClass}`;
    payloadViewer.textContent = JSON.stringify(scenario.payload, null, 2);
    appendLog(scenario.resultClass === 'error' ? 'error' : 'success', `[Complete] ${scenario.resultStatus}`);

    triggerBtn.disabled = false;
    triggerBtn.innerHTML = '<span>▶</span> SIMULATE REQUEST PACKET';
    isSimulating = false;
  });

  function clearAllNodeStates() {
    document.querySelectorAll('.arch-node-card').forEach(card => {
      card.classList.remove('active', 'active-success', 'active-error');
      const badge = card.querySelector('.node-status-badge');
      badge.textContent = 'Idle';
      badge.className = 'node-status-badge';
    });
  }

  function setNodeState(cardEl, badgeEl, stateClass, labelText) {
    cardEl.classList.remove('active', 'active-success', 'active-error');
    if (stateClass === 'processing') cardEl.classList.add('active');
    else if (stateClass === 'success') cardEl.classList.add('active-success');
    else if (stateClass === 'error') cardEl.classList.add('active-error');

    badgeEl.textContent = labelText;
    badgeEl.className = `node-status-badge ${stateClass}`;
  }

  function getNodeLabel(nodeId) {
    const labels = {
      client: 'Client App',
      gateway: 'API Gateway',
      cache: 'Redis Cache',
      server: 'App Server',
      db: 'PostgreSQL DB'
    };
    return labels[nodeId] || nodeId;
  }

  function appendLog(type, text) {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    line.textContent = `[${timestamp}] ${text}`;
    logStream.appendChild(line);
    logStream.scrollTop = logStream.scrollHeight;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
})();


// ── TRESS PLAYGROUND INTERACTIVE RUNNER ──
(function () {
  const codeTextarea = document.getElementById('playground-code');
  const templateSelect = document.getElementById('playground-template');
  const runBtn = document.getElementById('playground-run-btn');
  const outputConsole = document.getElementById('playground-output');
  const clearBtn = document.getElementById('playground-clear-btn');

  if (!codeTextarea || !templateSelect || !runBtn || !outputConsole) return;

  const TRESS_TEMPLATES = {
    vars: `// Tress variable declarations

let greeting = "Hello, Tress!"
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

    'type-error': `// Demonstrating Tress's type checker (Simulated)
let score = 95

// Type Error Demo (If statically checked)
score = "Excellent"

disp("Score:", score)`
  };

  // 1. Template picker change
  templateSelect.addEventListener('change', () => {
    const selected = templateSelect.value;
    if (TRESS_TEMPLATES[selected]) {
      codeTextarea.value = TRESS_TEMPLATES[selected];
    }
  });

  // 2. Clear terminal output
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      outputConsole.textContent = '// Terminal cleared.';
    });
  }

  // 3. Run Tress script
  runBtn.addEventListener('click', () => {
    const code = codeTextarea.value;
    outputConsole.textContent = '';
    
    let logs = [];
    const logOutput = (text) => {
      logs.push(text);
    };

    // Run custom Javascript-based interpreter
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
        // Render error output
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




