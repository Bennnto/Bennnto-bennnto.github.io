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


// ── 3D ALGORITHM SORTING VISUALIZER ENGINE ──
(function () {
  const canvas = document.getElementById('sorting-3d-canvas');
  const algoSelect = document.getElementById('algo-select');
  const runBtn = document.getElementById('sort-run-btn');
  const pauseBtn = document.getElementById('sort-pause-btn');
  const resetBtn = document.getElementById('sort-reset-btn');
  const speedSlider = document.getElementById('sort-speed');
  const tiltSlider = document.getElementById('sort-tilt');

  const hudComp = document.getElementById('hud-comparisons');
  const hudSwaps = document.getElementById('hud-swaps');
  const hudTime = document.getElementById('hud-time');
  const hudComplexity = document.getElementById('hud-complexity');

  if (!canvas || !algoSelect || !runBtn) return;

  const ctx = canvas.getContext('2d');
  const NUM_BARS = 32;

  let array = [];
  let barStates = []; // 'normal', 'compare', 'swap', 'sorted'
  let isSorting = false;
  let isPaused = false;
  let cancelToken = false;

  let comparisons = 0;
  let swaps = 0;
  let timerInterval = null;

  // Resize canvas resolution
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    render3D();
  }

  function initArray() {
    array = [];
    barStates = [];
    for (let i = 0; i < NUM_BARS; i++) {
      array.push(Math.floor(Math.random() * 85) + 15);
      barStates.push('normal');
    }
    comparisons = 0;
    swaps = 0;
    updateHUD();
    render3D();
  }

  function updateHUD() {
    if (hudComp) hudComp.textContent = comparisons;
    if (hudSwaps) hudSwaps.textContent = swaps;

    if (algoSelect && hudComplexity) {
      const val = algoSelect.value;
      if (val === 'bubblesort') {
        hudComplexity.textContent = 'O(N²)';
        hudComplexity.className = 'hud-value red';
      } else {
        hudComplexity.textContent = 'O(N log N)';
        hudComplexity.className = 'hud-value green';
      }
    }
  }

  // Render 3D Perspective Bars
  function render3D() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const tilt = tiltSlider ? parseInt(tiltSlider.value, 10) : 35;
    const tiltRad = (tilt * Math.PI) / 180;

    const barWidth = (w * 0.75) / NUM_BARS;
    const maxBarHeight = h * 0.55;
    const depth = barWidth * 0.7;

    const startX = w * 0.12;
    const startY = h * 0.82;

    for (let i = 0; i < NUM_BARS; i++) {
      const val = array[i];
      const barH = (val / 100) * maxBarHeight;
      const state = barStates[i];

      const x = startX + i * (barWidth + 2);
      const y = startY - i * Math.sin(tiltRad * 0.3);

      // Color selection based on state
      let frontColor = '#3B82F6';
      let topColor = '#60A5FA';
      let sideColor = '#1D4ED8';

      if (state === 'compare') {
        frontColor = '#F59E0B';
        topColor = '#FBBF24';
        sideColor = '#D97706';
      } else if (state === 'swap') {
        frontColor = '#EF4444';
        topColor = '#F87171';
        sideColor = '#B91C1C';
      } else if (state === 'sorted') {
        frontColor = '#10B981';
        topColor = '#34D399';
        sideColor = '#047857';
      }

      // Draw 3D Pillars
      // 1. Front Face
      ctx.fillStyle = frontColor;
      ctx.fillRect(x, y - barH, barWidth, barH);

      // 2. Top Face
      ctx.fillStyle = topColor;
      ctx.beginPath();
      ctx.moveTo(x, y - barH);
      ctx.lineTo(x + depth * Math.cos(tiltRad), y - barH - depth * Math.sin(tiltRad));
      ctx.lineTo(x + barWidth + depth * Math.cos(tiltRad), y - barH - depth * Math.sin(tiltRad));
      ctx.lineTo(x + barWidth, y - barH);
      ctx.closePath();
      ctx.fill();

      // 3. Side Face
      ctx.fillStyle = sideColor;
      ctx.beginPath();
      ctx.moveTo(x + barWidth, y - barH);
      ctx.lineTo(x + barWidth + depth * Math.cos(tiltRad), y - barH - depth * Math.sin(tiltRad));
      ctx.lineTo(x + barWidth + depth * Math.cos(tiltRad), y - depth * Math.sin(tiltRad));
      ctx.lineTo(x + barWidth, y);
      ctx.closePath();
      ctx.fill();

      // Bar border line
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y - barH, barWidth, barH);
    }
  }

  // Delay helper for step-by-step animation
  function sleep() {
    const spd = speedSlider ? 105 - parseInt(speedSlider.value, 10) : 30;
    return new Promise(resolve => setTimeout(resolve, spd * 10));
  }

  async function checkPause() {
    while (isPaused && !cancelToken) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // ── SORTING ALGORITHMS ──

  // 1. Bubble Sort O(N^2)
  async function bubbleSort() {
    for (let i = 0; i < NUM_BARS - 1; i++) {
      for (let j = 0; j < NUM_BARS - i - 1; j++) {
        if (cancelToken) return;
        await checkPause();

        barStates[j] = 'compare';
        barStates[j + 1] = 'compare';
        comparisons++;
        updateHUD();
        render3D();
        await sleep();

        if (array[j] > array[j + 1]) {
          let temp = array[j];
          array[j] = array[j + 1];
          array[j + 1] = temp;
          swaps++;

          barStates[j] = 'swap';
          barStates[j + 1] = 'swap';
          updateHUD();
          render3D();
          await sleep();
        }

        barStates[j] = 'normal';
        barStates[j + 1] = 'normal';
      }
      barStates[NUM_BARS - i - 1] = 'sorted';
    }
    barStates[0] = 'sorted';
  }

  // 2. Quicksort O(N log N)
  async function quicksort(low = 0, high = NUM_BARS - 1) {
    if (low < high) {
      const pi = await partition(low, high);
      if (cancelToken) return;
      await quicksort(low, pi - 1);
      await quicksort(pi + 1, high);
    } else if (low >= 0 && low < NUM_BARS) {
      barStates[low] = 'sorted';
    }
  }

  async function partition(low, high) {
    let pivot = array[high];
    barStates[high] = 'compare';
    let i = low - 1;

    for (let j = low; j < high; j++) {
      if (cancelToken) return low;
      await checkPause();

      barStates[j] = 'compare';
      comparisons++;
      updateHUD();
      render3D();
      await sleep();

      if (array[j] < pivot) {
        i++;
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
        swaps++;

        barStates[i] = 'swap';
        barStates[j] = 'swap';
        updateHUD();
        render3D();
        await sleep();
        barStates[i] = 'normal';
      }
      barStates[j] = 'normal';
    }

    let temp = array[i + 1];
    array[i + 1] = array[high];
    array[high] = temp;
    swaps++;

    barStates[i + 1] = 'sorted';
    barStates[high] = 'normal';
    render3D();
    await sleep();

    return i + 1;
  }

  // 3. Merge Sort O(N log N)
  async function mergeSort(l = 0, r = NUM_BARS - 1) {
    if (l >= r) return;
    const m = l + Math.floor((r - l) / 2);
    await mergeSort(l, m);
    await mergeSort(m + 1, r);
    await merge(l, m, r);
  }

  async function merge(l, m, r) {
    let left = array.slice(l, m + 1);
    let right = array.slice(m + 1, r + 1);

    let i = 0, j = 0, k = l;

    while (i < left.length && j < right.length) {
      if (cancelToken) return;
      await checkPause();

      barStates[k] = 'compare';
      comparisons++;
      updateHUD();
      render3D();
      await sleep();

      if (left[i] <= right[j]) {
        array[k] = left[i];
        i++;
      } else {
        array[k] = right[j];
        j++;
      }
      swaps++;
      barStates[k] = 'swap';
      render3D();
      await sleep();
      barStates[k] = 'normal';
      k++;
    }

    while (i < left.length) {
      if (cancelToken) return;
      array[k] = left[i];
      i++; k++;
      render3D();
      await sleep();
    }

    while (j < right.length) {
      if (cancelToken) return;
      array[k] = right[j];
      j++; k++;
      render3D();
      await sleep();
    }

    for (let x = l; x <= r; x++) barStates[x] = 'sorted';
  }

  // Run Controls
  async function startSort() {
    if (isSorting) return;
    isSorting = true;
    isPaused = false;
    cancelToken = false;
    runBtn.disabled = true;

    const startTime = Date.now();
    timerInterval = setInterval(() => {
      if (hudTime && !isPaused) {
        hudTime.textContent = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
      }
    }, 100);

    const algo = algoSelect.value;
    if (algo === 'bubblesort') await bubbleSort();
    else if (algo === 'quicksort') await quicksort();
    else if (algo === 'mergesort') await mergeSort();
    else if (algo === 'heapsort') await quicksort(); // Fallback to fast O(N log N)

    for (let i = 0; i < NUM_BARS; i++) barStates[i] = 'sorted';
    render3D();

    clearInterval(timerInterval);
    isSorting = false;
    runBtn.disabled = false;
  }

  runBtn.addEventListener('click', startSort);

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
  });

  resetBtn.addEventListener('click', () => {
    cancelToken = true;
    clearInterval(timerInterval);
    isSorting = false;
    isPaused = false;
    runBtn.disabled = false;
    pauseBtn.textContent = '⏸ Pause';
    if (hudTime) hudTime.textContent = '0.0s';
    initArray();
  });

  if (tiltSlider) tiltSlider.addEventListener('input', render3D);
  if (algoSelect) algoSelect.addEventListener('change', updateHUD);

  window.addEventListener('resize', resizeCanvas);
  setTimeout(() => {
    resizeCanvas();
    initArray();
  }, 200);
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




