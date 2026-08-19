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


// ── 60FPS ALGORITHM & PATHFINDING VISUALIZER ──
(function () {
  const modeBtns = document.querySelectorAll('.algo-mode-btn');
  const sortViewport = document.getElementById('sort-viewport');
  const pathViewport = document.getElementById('path-viewport');
  const algoSelect = document.getElementById('algo-select');
  const speedSlider = document.getElementById('algo-speed');
  const speedVal = document.getElementById('speed-val');
  const runBtn = document.getElementById('algo-run-btn');
  const resetBtn = document.getElementById('algo-reset-btn');
  const barsContainer = document.getElementById('sort-bars-container');
  const pathGridEl = document.getElementById('path-grid');

  const statComparisons = document.getElementById('stat-comparisons');
  const statSwaps = document.getElementById('stat-swaps');
  const statTime = document.getElementById('stat-time');
  const statComplexity = document.getElementById('stat-complexity');

  if (!sortViewport || !pathViewport || !runBtn) return;

  let activeMode = 'sort'; // 'sort' | 'path'
  let isRunning = false;
  let arraySize = 35;
  let array = [];
  let barElements = [];
  let sortCancelFlag = false;

  let comparisons = 0;
  let swaps = 0;
  let startTime = 0;

  // Pathfinding Grid state
  const GRID_ROWS = 10;
  const GRID_COLS = 20;
  let gridState = []; // 0: empty, 1: wall, 2: start, 3: target, 4: visited, 5: path
  let startPos = { r: 2, c: 3 };
  let targetPos = { r: 7, c: 16 };
  let isMouseDown = false;

  // 1. Mode Switch Handler
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isRunning) return;
      modeBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeMode = btn.dataset.mode;

      if (activeMode === 'sort') {
        sortViewport.hidden = false;
        pathViewport.hidden = true;
        updateAlgoDropdown('sort');
      } else {
        sortViewport.hidden = true;
        pathViewport.hidden = false;
        updateAlgoDropdown('path');
      }
    });
  });

  function updateAlgoDropdown(mode) {
    if (mode === 'sort') {
      algoSelect.innerHTML = `
        <option value="quicksort">QuickSort — O(N log N)</option>
        <option value="mergesort">MergeSort — O(N log N)</option>
        <option value="bubblesort">BubbleSort — O(N²)</option>
      `;
      statComplexity.textContent = 'O(N log N)';
    } else {
      algoSelect.innerHTML = `
        <option value="dijkstra">Dijkstra's Algorithm</option>
        <option value="astar">A* Search Algorithm</option>
      `;
      statComplexity.textContent = 'O(V + E log V)';
    }
  }

  // Speed Slider Handler
  speedSlider.addEventListener('input', () => {
    speedVal.textContent = `${speedSlider.value}x`;
  });

  // ── MODE 1: ARRAY SORTING ──
  function generateRandomArray() {
    array = [];
    barElements = [];
    barsContainer.innerHTML = '';
    comparisons = 0;
    swaps = 0;
    updateStats(0);

    for (let i = 0; i < arraySize; i++) {
      const val = Math.floor(Math.random() * 85) + 15;
      array.push(val);

      const bar = document.createElement('div');
      bar.className = 'sort-bar';
      bar.style.height = `${val}%`;
      barsContainer.appendChild(bar);
      barElements.push(bar);
    }
  }

  function getDelay() {
    const speed = parseInt(speedSlider.value, 10);
    return Math.max(10, 220 - speed * 20);
  }

  function updateStats(elapsed) {
    statComparisons.textContent = comparisons;
    statSwaps.textContent = swaps;
    statTime.textContent = `${elapsed}ms`;
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // BubbleSort
  async function runBubbleSort() {
    const n = array.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        if (sortCancelFlag) return;

        barElements[j].classList.add('active');
        barElements[j + 1].classList.add('active');
        comparisons++;
        updateStats(Math.round(performance.now() - startTime));
        await sleep(getDelay());

        if (array[j] > array[j + 1]) {
          // Swap
          swaps++;
          const temp = array[j];
          array[j] = array[j + 1];
          array[j + 1] = temp;

          barElements[j].style.height = `${array[j]}%`;
          barElements[j + 1].style.height = `${array[j + 1]}%`;
          barElements[j].classList.add('swap');
          barElements[j + 1].classList.add('swap');
          await sleep(getDelay());
        }

        barElements[j].className = 'sort-bar';
        barElements[j + 1].className = 'sort-bar';
      }
      barElements[n - i - 1].classList.add('sorted');
    }
  }

  // QuickSort
  async function runQuickSort(low, high) {
    if (low < high) {
      const pi = await partition(low, high);
      if (sortCancelFlag) return;
      await runQuickSort(low, pi - 1);
      await runQuickSort(pi + 1, high);
    } else if (low >= 0 && low < array.length) {
      barElements[low].classList.add('sorted');
    }
  }

  async function partition(low, high) {
    const pivot = array[high];
    barElements[high].classList.add('swap');
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (sortCancelFlag) return high;
      barElements[j].classList.add('active');
      comparisons++;
      updateStats(Math.round(performance.now() - startTime));
      await sleep(getDelay());

      if (array[j] < pivot) {
        i++;
        swaps++;
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;

        barElements[i].style.height = `${array[i]}%`;
        barElements[j].style.height = `${array[j]}%`;
      }
      barElements[j].classList.remove('active');
    }

    swaps++;
    const temp = array[i + 1];
    array[i + 1] = array[high];
    array[high] = temp;

    barElements[i + 1].style.height = `${array[i + 1]}%`;
    barElements[high].style.height = `${array[high]}%`;
    barElements[high].classList.remove('swap');
    barElements[i + 1].classList.add('sorted');

    return i + 1;
  }

  // MergeSort
  async function runMergeSort(l, r) {
    if (l >= r || sortCancelFlag) return;
    const m = l + Math.floor((r - l) / 2);
    await runMergeSort(l, m);
    await runMergeSort(m + 1, r);
    await merge(l, m, r);
  }

  async function merge(l, m, r) {
    const n1 = m - l + 1;
    const n2 = r - m;
    const L = [];
    const R = [];

    for (let i = 0; i < n1; i++) L.push(array[l + i]);
    for (let j = 0; j < n2; j++) R.push(array[m + 1 + j]);

    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
      if (sortCancelFlag) return;
      comparisons++;
      updateStats(Math.round(performance.now() - startTime));
      barElements[k].classList.add('active');
      await sleep(getDelay());

      if (L[i] <= R[j]) {
        array[k] = L[i];
        i++;
      } else {
        array[k] = R[j];
        j++;
      }
      swaps++;
      barElements[k].style.height = `${array[k]}%`;
      barElements[k].className = 'sort-bar sorted';
      k++;
    }

    while (i < n1) {
      if (sortCancelFlag) return;
      array[k] = L[i];
      barElements[k].style.height = `${array[k]}%`;
      barElements[k].className = 'sort-bar sorted';
      i++; k++;
      await sleep(getDelay() / 2);
    }

    while (j < n2) {
      if (sortCancelFlag) return;
      array[k] = R[j];
      barElements[k].style.height = `${array[k]}%`;
      barElements[k].className = 'sort-bar sorted';
      j++; k++;
      await sleep(getDelay() / 2);
    }
  }

  // ── MODE 2: 2D PATHFINDING GRID ──
  function initGrid() {
    gridState = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(0));
    gridState[startPos.r][startPos.c] = 2; // Start
    gridState[targetPos.r][targetPos.c] = 3; // Target
    renderGrid();
  }

  function renderGrid() {
    pathGridEl.innerHTML = '';
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = document.createElement('div');
        cell.className = 'path-cell';
        const type = gridState[r][c];

        if (type === 1) cell.classList.add('wall');
        else if (type === 2) cell.classList.add('start');
        else if (type === 3) cell.classList.add('target');
        else if (type === 4) cell.classList.add('visited');
        else if (type === 5) cell.classList.add('path');

        cell.dataset.r = r;
        cell.dataset.c = c;

        cell.addEventListener('mousedown', () => {
          if (isRunning || type === 2 || type === 3) return;
          isMouseDown = true;
          toggleWall(r, c);
        });

        cell.addEventListener('mouseenter', () => {
          if (isMouseDown && !isRunning && type !== 2 && type !== 3) {
            toggleWall(r, c);
          }
        });

        pathGridEl.appendChild(cell);
      }
    }
  }

  window.addEventListener('mouseup', () => { isMouseDown = false; });

  function toggleWall(r, c) {
    if (gridState[r][c] === 1) {
      gridState[r][c] = 0;
    } else if (gridState[r][c] === 0) {
      gridState[r][c] = 1;
    }
    renderGrid();
  }

  async function runPathfinding() {
    // Clear previous visited/path
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (gridState[r][c] === 4 || gridState[r][c] === 5) {
          gridState[r][c] = 0;
        }
      }
    }
    renderGrid();

    const queue = [{ r: startPos.r, c: startPos.c, path: [] }];
    const visited = new Set();
    visited.add(`${startPos.r},${startPos.c}`);

    const dr = [-1, 1, 0, 0];
    const dc = [0, 0, -1, 1];
    let found = false;

    while (queue.length > 0) {
      if (sortCancelFlag) return;
      const { r, c, path } = queue.shift();

      if (r === targetPos.r && c === targetPos.c) {
        // Draw path
        found = true;
        for (const step of path) {
          if (gridState[step.r][step.c] === 0 || gridState[step.r][step.c] === 4) {
            gridState[step.r][step.c] = 5;
            renderGrid();
            await sleep(40);
          }
        }
        break;
      }

      if (gridState[r][c] === 0) {
        gridState[r][c] = 4; // visited
        renderGrid();
        await sleep(Math.max(15, 120 - parseInt(speedSlider.value, 10) * 10));
      }

      for (let i = 0; i < 4; i++) {
        const nr = r + dr[i];
        const nc = c + dc[i];
        const key = `${nr},${nc}`;

        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
          if (gridState[nr][nc] !== 1 && !visited.has(key)) {
            visited.add(key);
            queue.push({ r: nr, c: nc, path: [...path, { r: nr, c: nc }] });
          }
        }
      }
    }
  }

  // ── RUN & RESET BUTTON HANDLERS ──
  runBtn.addEventListener('click', async () => {
    if (isRunning) return;
    isRunning = true;
    sortCancelFlag = false;
    runBtn.disabled = true;
    resetBtn.disabled = true;
    runBtn.innerHTML = '<span>⏳</span> RUNNING...';

    startTime = performance.now();

    if (activeMode === 'sort') {
      const algo = algoSelect.value;
      if (algo === 'bubblesort') {
        statComplexity.textContent = 'O(N²)';
        await runBubbleSort();
      } else if (algo === 'quicksort') {
        statComplexity.textContent = 'O(N log N)';
        await runQuickSort(0, array.length - 1);
        barElements.forEach(b => b.className = 'sort-bar sorted');
      } else if (algo === 'mergesort') {
        statComplexity.textContent = 'O(N log N)';
        await runMergeSort(0, array.length - 1);
      }
    } else {
      await runPathfinding();
    }

    runBtn.disabled = false;
    resetBtn.disabled = false;
    runBtn.innerHTML = '<span>▶</span> RUN VISUALIZER';
    isRunning = false;
  });

  resetBtn.addEventListener('click', () => {
    sortCancelFlag = true;
    isRunning = false;
    runBtn.disabled = false;
    resetBtn.disabled = false;
    runBtn.innerHTML = '<span>▶</span> RUN VISUALIZER';

    if (activeMode === 'sort') {
      generateRandomArray();
    } else {
      initGrid();
    }
  });

  // Initial load
  generateRandomArray();
  initGrid();
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
        docsToggle.textContent = '✕ Close Reference';
      } else {
        docsDrawer.setAttribute('hidden', '');
        docsToggle.classList.remove('active');
        docsToggle.textContent = '📋 Quick Reference';
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




