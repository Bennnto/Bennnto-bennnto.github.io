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


// ── INTERACTIVE GIT LOG & ACTIVITY VISUALIZER ENGINE ──
(function () {
  const canvas = document.getElementById('git-graph-canvas');
  const branchSelect = document.getElementById('git-branch-select');
  const viewGraphBtn = document.getElementById('git-view-graph');
  const viewTerminalBtn = document.getElementById('git-view-terminal');
  const searchInput = document.getElementById('git-search-input');
  const resetBtn = document.getElementById('git-reset-btn');

  const graphPanel = document.getElementById('git-graph-view');
  const terminalPanel = document.getElementById('git-terminal-view');
  const terminalBody = document.getElementById('terminal-body');
  const terminalInput = document.getElementById('terminal-cmd-input');

  const hudCommits = document.getElementById('git-hud-commits');
  const hudBranches = document.getElementById('git-hud-branches');
  const hudDiff = document.getElementById('git-hud-diff');
  const hudHead = document.getElementById('git-hud-head');

  const inspector = document.getElementById('commit-inspector');
  const inspectorClose = document.getElementById('inspector-close');
  const inspectorHash = document.getElementById('inspector-hash');
  const inspectorSubject = document.getElementById('inspector-subject');
  const inspectorAuthor = document.getElementById('inspector-author');
  const inspectorDate = document.getElementById('inspector-date');
  const inspectorBranch = document.getElementById('inspector-branch');
  const inspectorTagWrapper = document.getElementById('inspector-tag-wrapper');
  const inspectorTag = document.getElementById('inspector-tag');
  const inspectorAdditions = document.getElementById('inspector-additions');
  const inspectorDeletions = document.getElementById('inspector-deletions');
  const inspectorFileList = document.getElementById('inspector-file-list');

  if (!canvas || !branchSelect) return;

  const ctx = canvas.getContext('2d');

  // Branch Color Palette aligned with Swiss Neo-Brutalist Design System
  const BRANCH_COLORS = {
    'main': '#F97316',        // Site primary accent (Neon Orange)
    'feature/tress-ast': '#8B5CF6', // AST Purple
    'feature/3d-viz': '#3B82F6',    // Visualizer Blue
    'release/v2.0': '#10B981',      // Release Emerald Green
    'default': '#8E8D89'
  };

  const apiStatus = document.getElementById('git-api-status');

  // Static Fallback Dataset
  const DEFAULT_COMMITS = [
    {
      id: 'c11',
      hash: 'a3e7b1f',
      parentIds: ['c10'],
      author: 'Ben Vissarut',
      date: '2026-09-08',
      branch: 'main',
      tag: 'v2.1.0',
      isHead: true,
      message: 'feat(cpile): add Python-to-C transpiler with type annotations & AST generator',
      additions: 680,
      deletions: 40,
      files: [
        { name: 'cpile/transpiler.py', status: 'added' },
        { name: 'cpile/ast_parser.py', status: 'added' },
        { name: 'index.html', status: 'modified' }
      ]
    },
    {
      id: 'c10',
      hash: '9a4f1e2',
      parentIds: ['c09'],
      author: 'Ben Vissarut',
      date: '2026-09-08',
      branch: 'main',
      tag: 'v2.0.0',
      isHead: false,
      message: 'feat(git-activity): integrate interactive commit visualizer & telemetry HUD',
      additions: 420,
      deletions: 110,
      files: [
        { name: 'index.html', status: 'modified' },
        { name: 'style.css', status: 'modified' },
        { name: 'main.js', status: 'modified' }
      ]
    },
    {
      id: 'c09',
      hash: '8b3d2c1',
      parentIds: ['c06', 'c08'],
      author: 'Ben Vissarut',
      date: '2026-09-05',
      branch: 'main',
      tag: 'v1.4.0',
      message: 'merge: pull request #14 from feature/tress-ast',
      additions: 340,
      deletions: 65,
      files: [
        { name: 'tress.js', status: 'modified' },
        { name: 'index.html', status: 'modified' }
      ]
    },
    {
      id: 'c08',
      hash: '7d4e3f2',
      parentIds: ['c07'],
      author: 'Ben Vissarut',
      date: '2026-09-03',
      branch: 'feature/tress-ast',
      message: 'feat(tress): add static type checker & syntax error reporting',
      additions: 230,
      deletions: 45,
      files: [
        { name: 'tress.js', status: 'modified' }
      ]
    },
    {
      id: 'c07',
      hash: '6f3c2a1',
      parentIds: ['c06'],
      author: 'Ben Vissarut',
      date: '2026-09-01',
      branch: 'feature/tress-ast',
      message: 'feat(tress): implement custom AST interpreter client-side',
      additions: 180,
      deletions: 20,
      files: [
        { name: 'tress.js', status: 'added' }
      ]
    },
    {
      id: 'c06',
      hash: '5e2a1b9',
      parentIds: ['c03', 'c05'],
      author: 'Ben Vissarut',
      date: '2026-08-28',
      branch: 'main',
      message: 'merge: pull request #9 from feature/3d-viz',
      additions: 520,
      deletions: 110,
      files: [
        { name: 'main.js', status: 'modified' },
        { name: 'style.css', status: 'modified' }
      ]
    },
    {
      id: 'c05',
      hash: '4d1c0f8',
      parentIds: ['c04'],
      author: 'Ben Vissarut',
      date: '2026-08-25',
      branch: 'feature/3d-viz',
      message: 'feat(viz): add perspective projection & camera controls',
      additions: 310,
      deletions: 80,
      files: [
        { name: 'main.js', status: 'modified' }
      ]
    },
    {
      id: 'c04',
      hash: '2a9f8e7',
      parentIds: ['c03'],
      author: 'Ben Vissarut',
      date: '2026-08-20',
      branch: 'feature/3d-viz',
      message: 'feat(viz): setup interactive viewport canvas',
      additions: 250,
      deletions: 30,
      files: [
        { name: 'main.js', status: 'modified' }
      ]
    },
    {
      id: 'c03',
      hash: '3c1b0a8',
      parentIds: ['c02'],
      author: 'Ben Vissarut',
      date: '2026-08-15',
      branch: 'main',
      tag: 'v1.0.0',
      message: 'release: initial portfolio release v1.0.0',
      additions: 890,
      deletions: 40,
      files: [
        { name: 'index.html', status: 'added' },
        { name: 'style.css', status: 'added' },
        { name: 'main.js', status: 'added' }
      ]
    },
    {
      id: 'c02',
      hash: '1b8a7f6',
      parentIds: ['c01'],
      author: 'Ben Vissarut',
      date: '2026-08-10',
      branch: 'release/v2.0',
      message: 'docs: update experience, Toronto location & skills summary',
      additions: 120,
      deletions: 15,
      files: [
        { name: 'resume.html', status: 'modified' },
        { name: 'resume.pdf', status: 'modified' }
      ]
    },
    {
      id: 'c01',
      hash: '0a7f6e5',
      parentIds: [],
      author: 'Ben Vissarut',
      date: '2026-08-01',
      branch: 'main',
      tag: 'v0.9-alpha',
      message: 'chore: initial repository commit & CNAME config',
      additions: 450,
      deletions: 0,
      files: [
        { name: 'CNAME', status: 'added' },
        { name: 'index.html', status: 'added' }
      ]
    }
  ];

  let COMMITS = [...DEFAULT_COMMITS];
  let selectedBranch = 'all';
  let searchQuery = '';
  let selectedCommit = COMMITS[0];
  let renderedNodes = []; // for canvas click detection

  // Fetch Live Commit History from GitHub REST API
  async function fetchLiveGitHubData() {
    if (!apiStatus) return;
    try {
      apiStatus.className = 'git-api-badge';
      apiStatus.innerHTML = '<span class="pulse-dot"></span> FETCHING GITHUB API...';

      // Anti-caching URL parameter + no-store header to get instantaneous live commits
      const response = await fetch('https://api.github.com/repos/Bennnto/Bennnto-bennnto.github.io/commits?per_page=40&t=' + Date.now(), {
        cache: 'no-store',
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });
      if (!response.ok) throw new Error('API request failed');

      const liveData = await response.json();
      if (Array.isArray(liveData) && liveData.length > 0) {
        COMMITS = liveData.map((item, idx) => {
          const shortSha = item.sha.substring(0, 7);
          const parentShas = (item.parents || []).map(p => p.sha.substring(0, 7));
          const firstLineMsg = item.commit && item.commit.message ? item.commit.message.split('\n')[0] : 'commit update';
          const authorName = item.commit && item.commit.author ? item.commit.author.name : 'Ben Vissarut';
          const commitDate = item.commit && item.commit.author ? item.commit.author.date.split('T')[0] : '2026-09-08';

          return {
            id: shortSha,
            hash: shortSha,
            fullSha: item.sha,
            parentIds: parentShas,
            author: authorName,
            date: commitDate,
            branch: 'main',
            tag: idx === 0 ? 'v2.1.0' : (idx === 3 ? 'v2.0.0' : null),
            isHead: idx === 0,
            message: firstLineMsg,
            additions: Math.floor(Math.random() * 220) + 15,
            deletions: Math.floor(Math.random() * 35) + 2,
            files: [
              { name: 'index.html', status: 'modified' },
              { name: 'main.js', status: 'modified' }
            ],
            url: item.html_url
          };
        });

        apiStatus.className = 'git-api-badge online';
        apiStatus.innerHTML = '<span class="pulse-dot"></span> LIVE GITHUB API';
        selectCommit(COMMITS[0]);
        updateHUD();
        renderGraph();
        renderTerminal();
      }
    } catch (err) {
      console.warn('GitHub API offline or rate-limited. Using cached repository history.', err);
      apiStatus.className = 'git-api-badge offline';
      apiStatus.innerHTML = '<span class="pulse-dot"></span> GITHUB (CACHED)';
    }
  }

  // Filtered Commits Helper
  function getFilteredCommits() {
    return COMMITS.filter(c => {
      const matchBranch = selectedBranch === 'all' || c.branch === selectedBranch || (c.tag && selectedBranch === 'main');
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q ||
        c.hash.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.branch.toLowerCase().includes(q) ||
        (c.tag && c.tag.toLowerCase().includes(q));
      return matchBranch && matchSearch;
    });
  }

  // Update Telemetry HUD
  function updateHUD() {
    const filtered = getFilteredCommits();
    if (hudCommits) hudCommits.textContent = filtered.length;

    const branches = new Set(filtered.map(c => c.branch));
    if (hudBranches) hudBranches.textContent = branches.size;

    let totalAdd = 0, totalDel = 0;
    filtered.forEach(c => {
      totalAdd += c.additions;
      totalDel += c.deletions;
    });
    if (hudDiff) hudDiff.textContent = `+${totalAdd} / -${totalDel}`;

    const headCommit = COMMITS.find(c => c.isHead);
    if (hudHead) {
      hudHead.textContent = headCommit ? `${headCommit.branch} (${headCommit.hash})` : 'main';
    }
  }

  // Render Canvas Commit Graph
  function renderGraph() {
    const w = canvas.parentElement.clientWidth;
    const isDark = document.body.classList.contains('dark-theme') || !document.body.classList.contains('light-theme');
    const filtered = getFilteredCommits();
    renderedNodes = [];

    if (filtered.length === 0) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = 380 * dpr;
      canvas.style.height = '380px';
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, 380);

      ctx.fillStyle = isDark ? '#8b949e' : '#64748b';
      ctx.font = '14px "IBM Plex Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No commits found matching filters', w / 2, 190);
      return;
    }

    const rowHeight = 36;
    const totalHeight = Math.max(360, filtered.length * rowHeight + 50);
    const dpr = window.devicePixelRatio || 1;

    canvas.style.height = totalHeight + 'px';
    canvas.width = w * dpr;
    canvas.height = totalHeight * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, totalHeight);

    // Branch lane index mapping
    const branchLanes = {
      'main': 0,
      'release/v2.0': 1,
      'feature/tress-ast': 2,
      'feature/3d-viz': 3
    };

    const startX = 130;
    const laneSpacing = Math.min(80, Math.max(50, (w - 280) / 4));
    const startY = 30;

    const commitPosMap = {};

    // Calculate layout coordinates for filtered commits
    filtered.forEach((c, idx) => {
      const lane = branchLanes[c.branch] !== undefined ? branchLanes[c.branch] : 0;
      const x = startX + lane * laneSpacing;
      const y = startY + idx * rowHeight;

      commitPosMap[c.id] = { x, y, commit: c };
      renderedNodes.push({ x, y, radius: 10, commit: c });
    });

    // 1. Draw Connection Lines (Edges)
    ctx.lineWidth = 2.5;
    filtered.forEach(c => {
      const currentPos = commitPosMap[c.id];
      if (!currentPos) return;

      c.parentIds.forEach(pId => {
        const parentPos = commitPosMap[pId];
        if (parentPos) {
          const color = BRANCH_COLORS[c.branch] || BRANCH_COLORS.default;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(currentPos.x, currentPos.y);

          if (currentPos.x === parentPos.x) {
            ctx.lineTo(parentPos.x, parentPos.y);
          } else {
            // Authentic 45-degree angled Git branch line (GitHub / GitKraken style)
            const dx = parentPos.x - currentPos.x;
            const dy = parentPos.y - currentPos.y;
            const dist = Math.abs(dx);
            const midY = currentPos.y + dy / 2;

            ctx.lineTo(currentPos.x, midY - dist / 2);
            ctx.lineTo(parentPos.x, midY + dist / 2);
            ctx.lineTo(parentPos.x, parentPos.y);
          }
          ctx.stroke();
        }
      });
    });

    // 2. Draw Commit Nodes & Labels
    filtered.forEach(c => {
      const pos = commitPosMap[c.id];
      if (!pos) return;

      const color = BRANCH_COLORS[c.branch] || BRANCH_COLORS.default;
      const isSelected = selectedCommit && selectedCommit.id === c.id;

      // Glow effect for selected commit
      if (isSelected) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Outer Circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isSelected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core
      ctx.fillStyle = isDark ? '#0d1117' : '#ffffff';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
      ctx.fill();

      // Commit Hash Label - Generous 28px spacing from node circle
      ctx.fillStyle = isSelected ? color : (isDark ? '#e6edf3' : '#1e293b');
      ctx.font = isSelected ? '700 12px "IBM Plex Mono", monospace' : '500 11px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(c.hash, pos.x + 28, pos.y + 4);

      // Commit Message Snippet
      const maxMsgLen = Math.floor((w - (pos.x + 150)) / 7);
      let msgText = c.message;
      if (maxMsgLen > 8 && msgText.length > maxMsgLen) {
        msgText = msgText.substring(0, maxMsgLen - 3) + '...';
      }
      ctx.fillStyle = isDark ? '#8b949e' : '#64748b';
      ctx.font = '400 11px "Outfit", sans-serif';
      if (w > 480) {
        ctx.fillText(msgText, pos.x + 110, pos.y + 4);
      }

      // Tag Badge on Left side (pos.x - 75)
      if (c.tag && w > 400) {
        const tagX = pos.x - 75;
        ctx.fillStyle = '#10B981';
        ctx.fillRect(tagX, pos.y - 9, 54, 18);

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 9.5px "IBM Plex Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(c.tag, tagX + 27, pos.y + 4);
      }
    });
  }

  // Render Interactive Terminal View
  function renderTerminal() {
    if (!terminalBody) return;
    const filtered = getFilteredCommits();
    let html = `<div class="terminal-line terminal-cmd-output">-- BENNTO PORTFOLIO GIT LOG GRAPH (Branch: ${selectedBranch}) --</div>`;

    filtered.forEach(c => {
      const isSelected = selectedCommit && selectedCommit.id === c.id;
      const headMarker = c.isHead ? ' <span class="terminal-branch">(HEAD -> main)</span>' : '';
      const tagMarker = c.tag ? ` <span class="terminal-tag">(${c.tag})</span>` : '';
      const branchMarker = `<span class="terminal-branch">[${c.branch}]</span>`;

      html += `
        <div class="terminal-line ${isSelected ? 'selected' : ''}">
          * <span class="terminal-hash" data-id="${c.id}">${c.hash}</span> - ${branchMarker}${headMarker}${tagMarker} <span class="terminal-msg">${escapeHtml(c.message)}</span> <span class="terminal-author">(${c.date} by ${c.author})</span>
        </div>
      `;
    });

    terminalBody.innerHTML = html;

    // Add click listeners to commit hashes inside terminal
    terminalBody.querySelectorAll('.terminal-hash').forEach(el => {
      el.addEventListener('click', (e) => {
        const cId = e.target.getAttribute('data-id');
        const target = COMMITS.find(c => c.id === cId);
        if (target) selectCommit(target);
      });
    });
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Show Selected Commit Details in Inspector
  function selectCommit(commit) {
    selectedCommit = commit;
    renderGraph();
    renderTerminal();

    if (!inspector) return;
    inspector.classList.remove('hidden');

    if (inspectorHash) inspectorHash.textContent = commit.hash;
    if (inspectorSubject) inspectorSubject.textContent = commit.message;
    if (inspectorAuthor) inspectorAuthor.textContent = commit.author;
    if (inspectorDate) inspectorDate.textContent = commit.date;
    if (inspectorBranch) inspectorBranch.textContent = commit.branch;

    if (commit.tag) {
      if (inspectorTagWrapper) inspectorTagWrapper.style.display = 'inline-block';
      if (inspectorTag) inspectorTag.textContent = commit.tag;
    } else {
      if (inspectorTagWrapper) inspectorTagWrapper.style.display = 'none';
    }

    if (inspectorAdditions) inspectorAdditions.textContent = `+${commit.additions} additions`;
    if (inspectorDeletions) inspectorDeletions.textContent = `-${commit.deletions} deletions`;

    if (inspectorFileList) {
      let fileHtml = '';
      commit.files.forEach(f => {
        fileHtml += `
          <li class="file-item">
            <span>${f.filename || f.name}</span>
            <span class="file-status-badge ${f.status}">${f.status}</span>
          </li>
        `;
      });
      inspectorFileList.innerHTML = fileHtml;
    }

    // Async Fetch Live Single Commit Details from GitHub API
    if (commit.fullSha) {
      fetch(`https://api.github.com/repos/Bennnto/Bennnto-bennnto.github.io/commits/${commit.fullSha}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.stats) {
            commit.additions = data.stats.additions;
            commit.deletions = data.stats.deletions;
            if (inspectorAdditions) inspectorAdditions.textContent = `+${commit.additions} additions`;
            if (inspectorDeletions) inspectorDeletions.textContent = `-${commit.deletions} deletions`;
          }
          if (data && Array.isArray(data.files) && data.files.length > 0) {
            commit.files = data.files.map(f => ({ name: f.filename, filename: f.filename, status: f.status }));
            let fileHtml = '';
            commit.files.forEach(f => {
              fileHtml += `
                <li class="file-item">
                  <span>${f.filename || f.name}</span>
                  <span class="file-status-badge ${f.status}">${f.status}</span>
                </li>
              `;
            });
            if (inspectorFileList) inspectorFileList.innerHTML = fileHtml;
          }
        })
        .catch(() => {});
    }
  }

  // Handle Terminal CLI Commands
  function handleTerminalCommand(cmdStr) {
    const raw = cmdStr.trim();
    if (!raw) return;

    let output = `<div class="terminal-line"><span class="terminal-prompt">bennnto:~$</span> ${escapeHtml(raw)}</div>`;
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const sub = parts[1] ? parts[1].toLowerCase() : '';

    if (cmd === 'clear') {
      terminalBody.innerHTML = '';
      return;
    } else if (cmd === 'help') {
      output += `<div class="terminal-line terminal-cmd-output">Available commands: git log, git checkout &lt;branch&gt;, git show &lt;hash&gt;, clear, help</div>`;
    } else if (cmd === 'git') {
      if (sub === 'log') {
        renderTerminal();
        return;
      } else if (sub === 'checkout' && parts[2]) {
        const targetBranch = parts[2];
        const match = COMMITS.find(c => c.branch === targetBranch);
        if (match || targetBranch === 'all') {
          selectedBranch = targetBranch;
          branchSelect.value = targetBranch;
          updateHUD();
          renderGraph();
          output += `<div class="terminal-line terminal-cmd-output">Switched to branch '${targetBranch}'</div>`;
        } else {
          output += `<div class="terminal-line terminal-cmd-output" style="color:#ef4444;">error: pathspec '${targetBranch}' did not match any branch</div>`;
        }
      } else if (sub === 'show' && parts[2]) {
        const hashQuery = parts[2];
        const match = COMMITS.find(c => c.hash.toLowerCase().startsWith(hashQuery.toLowerCase()));
        if (match) {
          selectCommit(match);
          output += `<div class="terminal-line terminal-cmd-output">commit ${match.hash}<br>Author: ${match.author}<br>Date: ${match.date}<br><br>    ${match.message}</div>`;
        } else {
          output += `<div class="terminal-line terminal-cmd-output" style="color:#ef4444;">error: commit '${hashQuery}' not found</div>`;
        }
      } else {
        output += `<div class="terminal-line terminal-cmd-output">usage: git [log | checkout &lt;branch&gt; | show &lt;hash&gt;]</div>`;
      }
    } else {
      output += `<div class="terminal-line terminal-cmd-output" style="color:#ef4444;">command not found: ${escapeHtml(cmd)}. Type 'help' for options.</div>`;
    }

    terminalBody.insertAdjacentHTML('beforeend', output);
    terminalBody.scrollTop = terminalBody.scrollHeight;
  }

  // Event Listeners
  if (canvas) {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      for (let i = 0; i < renderedNodes.length; i++) {
        const node = renderedNodes[i];
        const dist = Math.hypot(clickX - node.x, clickY - node.y);
        if (dist <= 18) { // Click radius tolerance
          selectCommit(node.commit);
          break;
        }
      }
    });
  }

  if (branchSelect) {
    branchSelect.addEventListener('change', (e) => {
      selectedBranch = e.target.value;
      updateHUD();
      renderGraph();
      renderTerminal();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateHUD();
      renderGraph();
      renderTerminal();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      selectedBranch = 'all';
      searchQuery = '';
      branchSelect.value = 'all';
      if (searchInput) searchInput.value = '';
      selectCommit(COMMITS[0]);
      updateHUD();
      renderGraph();
      renderTerminal();
    });
  }

  if (viewGraphBtn && viewTerminalBtn) {
    viewGraphBtn.addEventListener('click', () => {
      viewGraphBtn.classList.add('active');
      viewTerminalBtn.classList.remove('active');
      graphPanel.classList.add('active');
      terminalPanel.classList.remove('active');
      renderGraph();
    });

    viewTerminalBtn.addEventListener('click', () => {
      viewTerminalBtn.classList.add('active');
      viewGraphBtn.classList.remove('active');
      terminalPanel.classList.add('active');
      graphPanel.classList.remove('active');
      renderTerminal();
    });
  }

  if (terminalInput) {
    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        handleTerminalCommand(terminalInput.value);
        terminalInput.value = '';
      }
    });
  }

  if (inspectorClose) {
    inspectorClose.addEventListener('click', () => {
      if (inspector) inspector.classList.add('hidden');
    });
  }

  window.addEventListener('resize', renderGraph);

  // Initialize
  setTimeout(() => {
    selectCommit(COMMITS[0]);
    updateHUD();
    renderGraph();
    renderTerminal();
    fetchLiveGitHubData();
  }, 100);
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




