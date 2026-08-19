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


// ── PROJECT KNOWLEDGE GRAPH & COLLAPSIBLE CODE INDEX ──
(function () {
  const tabs = document.querySelectorAll('.lib-tab');
  const graphView = document.getElementById('graph-viewport');
  const indexView = document.getElementById('index-viewport');
  const searchInput = document.getElementById('lib-search-input');
  const svgCanvas = document.getElementById('graph-svg-canvas');
  const graphNodes = document.querySelectorAll('.graph-node');
  const collapsibleCards = document.querySelectorAll('.collapsible-card');
  const copyBtns = document.querySelectorAll('.snippet-copy-btn');

  if (!graphView || !indexView) return;

  // View Switcher (Graph vs Index)
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const view = tab.dataset.view;
      if (view === 'graph') {
        graphView.hidden = false;
        indexView.hidden = true;
        renderGraphLines();
      } else {
        graphView.hidden = true;
        indexView.hidden = false;
      }
    });
  });

  // Collapsible Accordion Toggle Handler
  collapsibleCards.forEach(card => {
    const header = card.querySelector('.collapsible-header');
    const drawer = card.querySelector('.collapsible-drawer');
    const icon = card.querySelector('.expand-icon');

    if (!header || !drawer) return;

    header.addEventListener('click', () => {
      const isOpen = card.classList.contains('open');

      if (isOpen) {
        card.classList.remove('open');
        drawer.hidden = true;
        if (icon) icon.textContent = '▶ Expand';
      } else {
        card.classList.add('open');
        drawer.hidden = false;
        if (icon) icon.textContent = '▼ Collapse';
      }
    });
  });

  // Search Input Handler across Index Cards
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();

      collapsibleCards.forEach(card => {
        const searchKeywords = card.dataset.search ? card.dataset.search.toLowerCase() : '';
        const cardText = card.textContent.toLowerCase();

        if (!query || searchKeywords.includes(query) || cardText.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // Copy Code Button Handler
  copyBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const targetId = btn.dataset.target;
      const codeEl = document.getElementById(targetId);
      if (!codeEl) return;

      const codeText = codeEl.textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1800);
      });
    });
  });

  // Knowledge Graph Connecting Lines Engine
  const EDGES = [
    { from: 'gaff', to: 'tech-c' },
    { from: 'gaff', to: 'tech-ast' },
    { from: 'tress', to: 'tech-ast' },
    { from: 'tress', to: 'tech-py' },
    { from: 'snippet-api', to: 'tech-py' },
    { from: 'snippet-api', to: 'tech-db' },
    { from: 'vault-api', to: 'tech-py' },
    { from: 'vault-api', to: 'tech-db' }
  ];

  function renderGraphLines() {
    if (!svgCanvas || graphView.hidden) return;
    svgCanvas.innerHTML = '';

    const containerRect = svgCanvas.parentElement.getBoundingClientRect();

    EDGES.forEach(edge => {
      const fromEl = document.querySelector(`[data-node="${edge.from}"]`);
      const toEl = document.querySelector(`[data-node="${edge.to}"]`);

      if (!fromEl || !toEl) return;

      const r1 = fromEl.getBoundingClientRect();
      const r2 = toEl.getBoundingClientRect();

      const x1 = r1.left + r1.width / 2 - containerRect.left;
      const y1 = r1.top + r1.height / 2 - containerRect.top;
      const x2 = r2.left + r2.width / 2 - containerRect.left;
      const y2 = r2.top + r2.height / 2 - containerRect.top;

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('class', 'graph-line');
      line.dataset.from = edge.from;
      line.dataset.to = edge.to;

      svgCanvas.appendChild(line);
    });
  }

  // Highlight Connected Nodes on Hover / Click
  graphNodes.forEach(node => {
    const nodeKey = node.dataset.node;

    node.addEventListener('mouseenter', () => highlightNetwork(nodeKey));
    node.addEventListener('mouseleave', () => resetNetwork());
    node.addEventListener('click', () => {
      // Switch to index view and expand snippet if matching project!
      const matchingCard = document.querySelector(`.collapsible-card[data-project="${nodeKey}"]`);
      if (matchingCard) {
        const indexTab = document.querySelector('.lib-tab[data-view="index"]');
        if (indexTab) indexTab.click();

        matchingCard.classList.add('open');
        const drawer = matchingCard.querySelector('.collapsible-drawer');
        const icon = matchingCard.querySelector('.expand-icon');
        if (drawer) drawer.hidden = false;
        if (icon) icon.textContent = '▼ Collapse';
        matchingCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  function highlightNetwork(key) {
    const lines = svgCanvas.querySelectorAll('.graph-line');
    lines.forEach(l => {
      if (l.dataset.from === key || l.dataset.to === key) {
        l.classList.add('active');
      }
    });
  }

  function resetNetwork() {
    const lines = svgCanvas.querySelectorAll('.graph-line');
    lines.forEach(l => l.classList.remove('active'));
  }

  window.addEventListener('resize', renderGraphLines);
  setTimeout(renderGraphLines, 300);
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




