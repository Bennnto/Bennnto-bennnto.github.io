// ── GLYPHS GAME ENGINE ──
// Minimalist, tactile word-building puzzle game inspired by solitaire mechanics.
// Features compound digraphs, artifact modifiers, combo multipliers, and board harvesting.

(function () {
  'use strict';

  // ── CONSTANTS & CONFIGURATION ──
  const BOARD_SIZE = 7;
  const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;
  const HAND_CAPACITY = 6;
  const QUEUE_CAPACITY = 3;
  const DECK_SIZE = 48;

  // Letter distribution & points (Scrabble-weighted + modern balance)
  const LETTER_CONFIG = {
    A: { count: 6, pts: 1 }, B: { count: 2, pts: 3 }, C: { count: 3, pts: 3 },
    D: { count: 4, pts: 2 }, E: { count: 9, pts: 1 }, F: { count: 2, pts: 4 },
    G: { count: 3, pts: 2 }, H: { count: 3, pts: 4 }, I: { count: 6, pts: 1 },
    J: { count: 1, pts: 8 }, K: { count: 2, pts: 5 }, L: { count: 4, pts: 1 },
    M: { count: 3, pts: 3 }, N: { count: 5, pts: 1 }, O: { count: 6, pts: 1 },
    P: { count: 2, pts: 3 }, Q: { count: 1, pts: 10}, R: { count: 5, pts: 1 },
    S: { count: 5, pts: 1 }, T: { count: 6, pts: 1 }, U: { count: 4, pts: 1 },
    V: { count: 2, pts: 4 }, W: { count: 2, pts: 4 }, X: { count: 1, pts: 8 },
    Y: { count: 2, pts: 4 }, Z: { count: 1, pts: 10}
  };

  // Compound Digraphs & Artifacts
  const SPECIAL_TILES = [
    { type: 'compound', letters: 'TH', pts: 3, weight: 2 },
    { type: 'compound', letters: 'CH', pts: 4, weight: 2 },
    { type: 'compound', letters: 'SH', pts: 4, weight: 2 },
    { type: 'compound', letters: 'QU', pts: 10, weight: 1 },
    { type: 'compound', letters: 'ER', pts: 2, weight: 2 },
    { type: 'compound', letters: 'IN', pts: 2, weight: 2 },
    { type: 'compound', letters: 'ED', pts: 2, weight: 2 },
    { type: 'modifier-wild', letters: '★', pts: 0, weight: 2, label: 'Wildcard' },
    { type: 'modifier-2x', letters: '2×', pts: 0, weight: 2, label: 'Overclock' },
    { type: 'modifier-bomb', letters: '💣', pts: 0, weight: 2, label: 'Purge' }
  ];

  // ── SOUND SYNTHESIZER (WEB AUDIO API) ──
  const AudioEngine = (function () {
    let ctx = null;
    let enabled = localStorage.getItem('glyphs_sound') !== 'muted';

    function init() {
      if (!ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') {
        ctx.resume();
      }
    }

    function playTone(freq, type = 'sine', duration = 0.12, gainVal = 0.15) {
      if (!enabled) return;
      init();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
      } catch (e) {
        // Safe fallback
      }
    }

    return {
      toggle: function () {
        enabled = !enabled;
        localStorage.setItem('glyphs_sound', enabled ? 'active' : 'muted');
        return enabled;
      },
      isEnabled: function () {
        return enabled;
      },
      click: function () {
        playTone(320, 'triangle', 0.04, 0.1);
      },
      place: function () {
        playTone(440, 'sine', 0.08, 0.15);
      },
      wordFound: function () {
        playTone(523.25, 'triangle', 0.15, 0.12);
        setTimeout(() => playTone(659.25, 'triangle', 0.18, 0.12), 60);
      },
      harvest: function () {
        playTone(523.25, 'sine', 0.18, 0.18);
        setTimeout(() => playTone(659.25, 'sine', 0.18, 0.18), 70);
        setTimeout(() => playTone(783.99, 'sine', 0.22, 0.18), 140);
        setTimeout(() => playTone(1046.50, 'sine', 0.28, 0.2), 210);
      },
      bomb: function () {
        playTone(110, 'sawtooth', 0.25, 0.2);
        setTimeout(() => playTone(70, 'sine', 0.35, 0.25), 50);
      },
      error: function () {
        playTone(180, 'square', 0.15, 0.1);
      }
    };
  })();

  // ── GAME STATE ──
  const state = {
    board: new Array(TOTAL_CELLS).fill(null), // Holds tile objects or null
    cellModifiers: new Array(TOTAL_CELLS).fill(null), // '2x', 'glitch', or null
    deck: [],
    hand: new Array(HAND_CAPACITY).fill(null),
    queue: new Array(QUEUE_CAPACITY).fill(null),
    score: 0,
    highScore: parseInt(localStorage.getItem('glyphs_high_score') || '0', 10),
    combo: 1.0,
    wordsHarvested: 0,
    harvestHistory: [],
    bestWord: localStorage.getItem('glyphs_best_word') || '—',
    bestWordScore: parseInt(localStorage.getItem('glyphs_best_word_score') || '0', 10),
    selectedHandIndex: null,
    lastMove: null, // For recall / undo
    detectedWords: [] // Currently valid glowing words on the board
  };

  // ── DOM ELEMENTS CACHE ──
  const DOM = {
    boardGrid: document.getElementById('board-grid'),
    activeHand: document.getElementById('active-hand'),
    upcomingQueue: document.getElementById('upcoming-queue'),
    statScore: document.getElementById('stat-score'),
    statHigh: document.getElementById('stat-high'),
    statCombo: document.getElementById('stat-combo'),
    statTilesLeft: document.getElementById('stat-tiles-left'),
    conveyorDeckDisplay: document.getElementById('conveyor-deck-display'),
    harvestBanner: document.getElementById('harvest-banner'),
    harvestBannerText: document.getElementById('harvest-banner-text'),
    wordLogList: document.getElementById('word-log-list'),
    logCount: document.getElementById('log-count'),
    defTerm: document.getElementById('def-term'),
    defPos: document.getElementById('def-pos'),
    defBody: document.getElementById('def-body'),
    btnSound: document.getElementById('btn-sound'),
    btnHelp: document.getElementById('btn-help'),
    btnStats: document.getElementById('btn-stats'),
    btnTheme: document.getElementById('btn-theme'),
    btnRecall: document.getElementById('btn-recall'),
    btnShuffle: document.getElementById('btn-shuffle'),
    btnRestart: document.getElementById('btn-restart'),
    modalHelp: document.getElementById('modal-help'),
    modalStats: document.getElementById('modal-stats'),
    modalGameOver: document.getElementById('modal-gameover'),
    btnShareStats: document.getElementById('btn-share-stats'),
    btnGameOverShare: document.getElementById('btn-gameover-share'),
    btnGameOverRestart: document.getElementById('btn-gameover-restart'),
    confettiCanvas: document.getElementById('confetti-canvas')
  };

  // ── DECK GENERATOR ──
  function generateDeck() {
    const pool = [];

    // Standard letters
    Object.keys(LETTER_CONFIG).forEach(letter => {
      const cfg = LETTER_CONFIG[letter];
      for (let i = 0; i < cfg.count; i++) {
        pool.push({
          id: Math.random().toString(36).slice(2, 9),
          type: 'letter',
          letters: letter,
          pts: cfg.pts
        });
      }
    });

    // Special tiles (Digraphs, Wildcard, Multipliers, Bombs)
    SPECIAL_TILES.forEach(spec => {
      for (let i = 0; i < spec.weight; i++) {
        pool.push({
          id: Math.random().toString(36).slice(2, 9),
          type: spec.type,
          letters: spec.letters,
          pts: spec.pts,
          label: spec.label || spec.letters
        });
      }
    });

    // Shuffle pool with Fisher-Yates
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    // Slice to balanced run length (DECK_SIZE)
    return pool.slice(0, DECK_SIZE);
  }

  // ── HAND & QUEUE INITIALIZATION ──
  function initHandAndQueueDOM() {
    if (DOM.activeHand) {
      DOM.activeHand.innerHTML = '';
      for (let i = 0; i < HAND_CAPACITY; i++) {
        const slot = document.createElement('div');
        slot.className = 'hand-slot';
        slot.dataset.slot = i;
        DOM.activeHand.appendChild(slot);
      }
    }
    if (DOM.upcomingQueue) {
      DOM.upcomingQueue.innerHTML = '';
      for (let i = 0; i < QUEUE_CAPACITY; i++) {
        const slot = document.createElement('div');
        slot.className = 'queue-slot';
        slot.dataset.queue = i;
        DOM.upcomingQueue.appendChild(slot);
      }
    }
  }

  // ── BOARD INITIALIZATION ──
  function initBoardDOM() {
    if (!DOM.boardGrid) return;
    DOM.boardGrid.innerHTML = '';
    for (let i = 0; i < TOTAL_CELLS; i++) {
      const cell = document.createElement('div');
      cell.className = 'board-cell';
      cell.dataset.index = i;

      // Click to place tile or trigger harvest if part of glowing word
      cell.addEventListener('click', () => onCellClicked(i));

      // Drag and Drop listeners
      cell.addEventListener('dragover', (e) => {
        e.preventDefault();
        cell.classList.add('hover-valid');
      });
      cell.addEventListener('dragleave', () => {
        cell.classList.remove('hover-valid');
      });
      cell.addEventListener('drop', (e) => {
        e.preventDefault();
        cell.classList.remove('hover-valid');
        const handIdx = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!isNaN(handIdx)) {
          placeTileFromHand(handIdx, i);
        }
      });

      DOM.boardGrid.appendChild(cell);
    }
  }

  // ── TILE DOM CREATION HELPER ──
  function createTileElement(tile, isHand = false, handIndex = 0) {
    if (!tile) return null;

    const el = document.createElement('div');
    el.className = `tile ${tile.type}`;
    if (tile.type === 'compound') el.classList.add('compound');
    if (tile.type.startsWith('modifier-')) el.classList.add(tile.type);

    const letterSpan = document.createElement('span');
    letterSpan.className = 'tile-letter';
    letterSpan.textContent = tile.letters;
    el.appendChild(letterSpan);

    if (tile.pts !== undefined && tile.pts > 0) {
      const ptsSpan = document.createElement('span');
      ptsSpan.className = 'tile-points';
      ptsSpan.textContent = tile.pts;
      el.appendChild(ptsSpan);
    }

    if (isHand) {
      el.setAttribute('draggable', 'true');
      el.dataset.handIndex = handIndex;

      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', handIndex.toString());
        state.selectedHandIndex = handIndex;
        highlightHandSlot(handIndex);
        AudioEngine.click();
      });

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        if (state.selectedHandIndex === handIndex) {
          state.selectedHandIndex = null;
        } else {
          state.selectedHandIndex = handIndex;
          AudioEngine.click();
        }
        renderHand();
      });
    }

    return el;
  }

  // ── REFILL HAND & CONVEYOR ──
  function replenishHand() {
    let changed = false;
    for (let i = 0; i < HAND_CAPACITY; i++) {
      if (!state.hand[i] && state.queue.length > 0) {
        state.hand[i] = state.queue.shift();
        changed = true;
        // Refill queue from deck
        if (state.deck.length > 0) {
          state.queue.push(state.deck.pop());
        }
      }
    }
    renderHand();
    renderQueue();
    updateStatusCounters();
    checkGameOver();
  }

  // ── RENDER FUNCTIONS ──
  function renderHand() {
    const slots = DOM.activeHand.querySelectorAll('.hand-slot');
    slots.forEach((slot, idx) => {
      slot.innerHTML = '';
      const tile = state.hand[idx];
      if (tile) {
        const tileEl = createTileElement(tile, true, idx);
        if (state.selectedHandIndex === idx) {
          tileEl.classList.add('selected');
        }
        slot.appendChild(tileEl);
      }
    });
  }

  function renderQueue() {
    const slots = DOM.upcomingQueue.querySelectorAll('.queue-slot');
    slots.forEach((slot, idx) => {
      slot.innerHTML = '';
      const tile = state.queue[idx];
      if (tile) {
        const tileEl = createTileElement(tile, false);
        slot.appendChild(tileEl);
      }
    });
  }

  function renderBoard() {
    const cells = DOM.boardGrid.querySelectorAll('.board-cell');
    cells.forEach((cell, idx) => {
      cell.innerHTML = '';
      cell.className = 'board-cell';

      // Cell modifier classes
      if (state.cellModifiers[idx] === '2x') {
        cell.classList.add('has-bonus-2x');
      } else if (state.cellModifiers[idx] === 'glitch') {
        cell.classList.add('has-glitch');
      }

      // Check if cell is part of any detected glowing words
      const isHighlighted = state.detectedWords.some(dw => dw.cellIndices.includes(idx));
      if (isHighlighted) {
        cell.classList.add('word-highlight');
      }

      // Render placed tile if present
      const tile = state.board[idx];
      if (tile) {
        const tileEl = createTileElement(tile, false);
        cell.appendChild(tileEl);
      }
    });

    renderHarvestBanner();
  }

  function renderHarvestBanner() {
    if (state.detectedWords.length > 0) {
      // Pick the best scoring word to display on banner
      const best = state.detectedWords.reduce((prev, curr) => (curr.score > prev.score ? curr : prev));
      DOM.harvestBannerText.textContent = `HARVEST "${best.word}" (+${best.score} pts)`;
      DOM.harvestBanner.style.display = 'flex';
    } else {
      DOM.harvestBanner.style.display = 'none';
    }
  }

  function highlightHandSlot(idx) {
    const slots = DOM.activeHand.querySelectorAll('.hand-slot');
    slots.forEach((slot, i) => {
      const tile = slot.querySelector('.tile');
      if (tile) {
        tile.classList.toggle('selected', i === idx);
      }
    });
  }

  function updateStatusCounters() {
    DOM.statScore.textContent = state.score.toLocaleString();
    DOM.statHigh.textContent = state.highScore.toLocaleString();
    DOM.statCombo.textContent = `${state.combo.toFixed(1)}×`;
    DOM.statCombo.classList.toggle('combo-active', state.combo > 1.0);

    const totalRemaining = state.deck.length + state.queue.length;
    DOM.statTilesLeft.textContent = totalRemaining;
    DOM.conveyorDeckDisplay.textContent = `DECK: ${totalRemaining}`;

    DOM.btnRecall.disabled = !state.lastMove;
  }

  // ── CELL INTERACTION & TILE PLACEMENT ──
  function onCellClicked(cellIndex) {
    // 1. If clicking a cell that is part of a glowing word, harvest that word!
    const matchingWord = state.detectedWords.find(dw => dw.cellIndices.includes(cellIndex));
    if (matchingWord) {
      harvestWord(matchingWord);
      return;
    }

    // 2. If a hand tile is selected, place it
    if (state.selectedHandIndex !== null) {
      placeTileFromHand(state.selectedHandIndex, cellIndex);
      return;
    }

    // 3. If clicking an occupied tile without anything selected, select it for recall
    if (state.board[cellIndex] && state.lastMove && state.lastMove.cellIndex === cellIndex) {
      recallLastMove();
    }
  }

  function placeTileFromHand(handIndex, cellIndex) {
    const tile = state.hand[handIndex];
    if (!tile) return;

    // Handle special modifier tiles
    if (tile.type === 'modifier-bomb') {
      // Purge bomb: clears any tile at cellIndex
      if (state.board[cellIndex] || state.cellModifiers[cellIndex]) {
        state.board[cellIndex] = null;
        state.cellModifiers[cellIndex] = null;
        state.hand[handIndex] = null;
        state.selectedHandIndex = null;
        state.lastMove = null;

        AudioEngine.bomb();
        spawnFloatingScore('💣 PURGED', cellIndex);
        replenishHand();
        scanBoardForWords();
        renderBoard();
        return;
      } else {
        AudioEngine.error();
        return;
      }
    }

    if (tile.type === 'modifier-2x') {
      // Overclock: sets 2x multiplier on cell
      if (!state.board[cellIndex] && !state.cellModifiers[cellIndex]) {
        state.cellModifiers[cellIndex] = '2x';
        state.hand[handIndex] = null;
        state.selectedHandIndex = null;
        state.lastMove = null;

        AudioEngine.place();
        spawnFloatingScore('⚡ 2× APPLIED', cellIndex);
        replenishHand();
        scanBoardForWords();
        renderBoard();
        return;
      } else {
        AudioEngine.error();
        return;
      }
    }

    // Standard tile or Wildcard placement
    if (state.board[cellIndex] !== null) {
      AudioEngine.error();
      return; // Cell occupied
    }

    // Place the tile
    state.board[cellIndex] = tile;
    state.hand[handIndex] = null;
    state.selectedHandIndex = null;
    state.lastMove = { handIndex, cellIndex, tile };

    AudioEngine.place();

    // Trigger visual spring animation
    renderBoard();
    const cellEl = DOM.boardGrid.querySelector(`[data-index="${cellIndex}"] .tile`);
    if (cellEl) cellEl.classList.add('just-placed');

    replenishHand();
    scanBoardForWords();
    renderBoard();
  }

  function recallLastMove() {
    if (!state.lastMove) return;

    const { handIndex, cellIndex, tile } = state.lastMove;
    if (state.board[cellIndex] === tile) {
      state.board[cellIndex] = null;
      state.hand[handIndex] = tile;
      state.lastMove = null;
      state.selectedHandIndex = handIndex;

      AudioEngine.click();
      renderHand();
      scanBoardForWords();
      renderBoard();
      updateStatusCounters();
    }
  }

  // ── WORD SCANNING ALGORITHM ──
  function scanBoardForWords() {
    const validWords = [];

    // 1. Scan Rows (Horizontal, left-to-right)
    for (let r = 0; r < BOARD_SIZE; r++) {
      const rowStart = r * BOARD_SIZE;
      scanLine(rowStart, 1, BOARD_SIZE, validWords);
    }

    // 2. Scan Columns (Vertical, top-to-bottom)
    for (let c = 0; c < BOARD_SIZE; c++) {
      scanLine(c, BOARD_SIZE, BOARD_SIZE, validWords);
    }

    state.detectedWords = validWords;

    if (validWords.length > 0) {
      AudioEngine.wordFound();
    }
  }

  function scanLine(startIndex, step, length, outputWords) {
    let currentCells = [];

    for (let i = 0; i < length; i++) {
      const idx = startIndex + (i * step);
      const tile = state.board[idx];

      if (tile) {
        currentCells.push({ idx, tile });
      } else {
        if (currentCells.length >= 2) {
          evaluateContiguousCells(currentCells, outputWords);
        }
        currentCells = [];
      }
    }

    if (currentCells.length >= 2) {
      evaluateContiguousCells(currentCells, outputWords);
    }
  }

  function evaluateContiguousCells(cellSeq, outputWords) {
    const minLetters = 3;
    const n = cellSeq.length;

    // Check all sub-slices of length >= 2 tiles (can form 3+ letters with compound digraphs)
    for (let len = n; len >= 2; len--) {
      for (let start = 0; start <= n - len; start++) {
        const subSeq = cellSeq.slice(start, start + len);
        const cellIndices = subSeq.map(c => c.idx);

        // Check if this sub-sequence has wildcards
        const hasWildcard = subSeq.some(c => c.tile.type === 'modifier-wild');

        if (!hasWildcard) {
          // Standard check
          const word = subSeq.map(c => c.tile.letters).join('');
          if (word.length >= minLetters && window.GlyphsDictionary.has(word)) {
            const score = calculateWordScore(subSeq, word);
            addUniqueWord(outputWords, { word, cellIndices, score, subSeq });
          }
        } else {
          // Wildcard resolution: substitute 'A'..'Z' to find best match
          const wildcardMatches = resolveWildcardWord(subSeq);
          if (wildcardMatches.length > 0) {
            const best = wildcardMatches[0];
            addUniqueWord(outputWords, {
              word: best.word,
              cellIndices,
              score: best.score,
              subSeq
            });
          }
        }
      }
    }
  }

  function resolveWildcardWord(subSeq) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const matches = [];

    for (let l of letters) {
      const candidateStr = subSeq.map(c => (c.tile.type === 'modifier-wild' ? l : c.tile.letters)).join('');
      if (candidateStr.length >= 3 && window.GlyphsDictionary.has(candidateStr)) {
        const score = calculateWordScore(subSeq, candidateStr);
        matches.push({ word: candidateStr, score });
      }
    }

    matches.sort((a, b) => b.score - a.score);
    return matches;
  }

  function addUniqueWord(list, newWord) {
    // Avoid redundant overlapping subsets of the same letters
    const exists = list.some(w => w.word === newWord.word && JSON.stringify(w.cellIndices) === JSON.stringify(newWord.cellIndices));
    if (!exists) {
      list.push(newWord);
    }
  }

  // ── SCORE CALCULATION ──
  function calculateWordScore(subSeq, wordStr) {
    let basePoints = 0;
    let wordMultiplier = 1;

    subSeq.forEach(c => {
      let tilePts = c.tile.pts || 1;
      // Overclock cell multiplier (2x)
      if (state.cellModifiers[c.idx] === '2x') {
        tilePts *= 2;
      }
      basePoints += tilePts;
    });

    // Length Bonus Multiplier
    const len = wordStr.length;
    let lengthMultiplier = 1.0;
    if (len === 4) lengthMultiplier = 1.25;
    else if (len === 5) lengthMultiplier = 1.6;
    else if (len === 6) lengthMultiplier = 2.2;
    else if (len >= 7) lengthMultiplier = 3.0;

    const roundScore = Math.round(basePoints * lengthMultiplier * state.combo * wordMultiplier);
    return Math.max(roundScore, 5);
  }

  // ── WORD HARVESTING ──
  function harvestWord(detectedWord) {
    const { word, cellIndices, score } = detectedWord;

    // 1. Play Harvest Chime
    AudioEngine.harvest();

    // 2. Animate Harvesting Tiles
    cellIndices.forEach(idx => {
      const tileEl = DOM.boardGrid.querySelector(`[data-index="${idx}"] .tile`);
      if (tileEl) tileEl.classList.add('harvesting');
    });

    // 3. Spawn floating points animation over the center cell
    const centerIdx = cellIndices[Math.floor(cellIndices.length / 2)];
    spawnFloatingScore(`+${score} (${state.combo.toFixed(1)}×)`, centerIdx);

    // 4. Update Game State after animation
    setTimeout(() => {
      // Clear tiles from board
      cellIndices.forEach(idx => {
        state.board[idx] = null;
      });

      // Clear adjacent Glitches if any
      clearAdjacentGlitches(cellIndices);

      // Increment Score & Combo
      state.score += score;
      state.wordsHarvested++;
      state.combo = Math.min(+(state.combo + 0.5).toFixed(1), 3.0);
      state.lastMove = null; // Cannot recall past a harvest

      // Track High Score & Best Word
      if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('glyphs_high_score', state.highScore.toString());
      }
      if (score > state.bestWordScore) {
        state.bestWord = word;
        state.bestWordScore = score;
        localStorage.setItem('glyphs_best_word', word);
        localStorage.setItem('glyphs_best_word_score', score.toString());
      }

      // Add to Harvest History Log
      logHarvestedWord(word, score);

      // Fetch or display Lexicon definition
      displayWordIntel(word);

      // Flash Score
      DOM.statScore.classList.add('score-flash');
      setTimeout(() => DOM.statScore.classList.remove('score-flash'), 450);

      // Confetti burst for big words (5+ letters) or big scores (40+ pts)
      if (word.length >= 5 || score >= 40) {
        triggerConfetti();
      }

      // Rescan board, refill hand & update view
      scanBoardForWords();
      renderBoard();
      replenishHand();
      updateStatusCounters();
      checkGameOver();
    }, 280);
  }

  function clearAdjacentGlitches(cellIndices) {
    const adjOffsets = [-1, 1, -BOARD_SIZE, BOARD_SIZE];
    cellIndices.forEach(idx => {
      adjOffsets.forEach(off => {
        const target = idx + off;
        if (target >= 0 && target < TOTAL_CELLS) {
          if (state.cellModifiers[target] === 'glitch') {
            state.cellModifiers[target] = null;
            state.score += 50;
            spawnFloatingScore('❄ PURGED +50', target);
          }
        }
      });
    });
  }

  // ── FLOATING POINTS & CONFETTI ──
  function spawnFloatingScore(text, cellIndex) {
    const cellEl = DOM.boardGrid.querySelector(`[data-index="${cellIndex}"]`);
    if (!cellEl) return;

    const rect = cellEl.getBoundingClientRect();
    const floatEl = document.createElement('div');
    floatEl.className = 'floating-point';
    floatEl.textContent = text;
    floatEl.style.left = `${rect.left + rect.width / 2}px`;
    floatEl.style.top = `${rect.top}px`;

    document.body.appendChild(floatEl);
    setTimeout(() => floatEl.remove(), 850);
  }

  function triggerConfetti() {
    const canvas = DOM.confettiCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const colors = ['#EA580C', '#F97316', '#FBBF24', '#10B981', '#3B82F6', '#FAF9F6'];

    for (let i = 0; i < 45; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 80 - 40),
        y: canvas.height / 2 + (Math.random() * 80 - 40),
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 14,
        size: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    let frame = 0;
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vr;
        p.opacity -= 0.018;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(p.opacity, 0);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });

      frame++;
      if (frame < 60) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    requestAnimationFrame(animate);
  }

  // ── HARVEST LOG & DEFINITION INTEL ──
  function logHarvestedWord(word, pts) {
    if (state.harvestHistory.length === 0) {
      DOM.wordLogList.innerHTML = '';
    }

    state.harvestHistory.unshift({ word, pts });
    DOM.logCount.textContent = `${state.harvestHistory.length} word${state.harvestHistory.length === 1 ? '' : 's'}`;

    const item = document.createElement('div');
    item.className = 'word-log-item';
    item.innerHTML = `
      <span class="log-word-name">${word}</span>
      <span class="log-word-pts">+${pts} pts</span>
    `;

    item.addEventListener('click', () => displayWordIntel(word));
    DOM.wordLogList.prepend(item);
  }

  async function displayWordIntel(word) {
    DOM.defTerm.textContent = word;
    DOM.defPos.textContent = 'fetching...';
    DOM.defBody.textContent = 'Looking up definition from standard lexicon...';

    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0] && data[0].meanings && data[0].meanings.length > 0) {
          const meaning = data[0].meanings[0];
          DOM.defPos.textContent = meaning.partOfSpeech || 'noun';
          if (meaning.definitions && meaning.definitions.length > 0) {
            DOM.defBody.textContent = meaning.definitions[0].definition;
            return;
          }
        }
      }
    } catch (e) {
      // Offline fallback
    }

    DOM.defPos.textContent = 'verified';
    DOM.defBody.textContent = `A valid ${word.length}-letter word successfully harvested for bonus points.`;
  }

  // ── GAME OVER & STATS ──
  function checkGameOver() {
    const totalRemaining = state.deck.length + state.queue.length;
    const handEmpty = state.hand.every(t => t === null);
    const boardFull = state.board.every(t => t !== null);

    if ((totalRemaining === 0 && handEmpty) || (boardFull && state.detectedWords.length === 0)) {
      setTimeout(showGameOverModal, 600);
    }
  }

  function getRank(score) {
    if (score >= 600) return 'GRANDMASTER LEXICOGRAPHER';
    if (score >= 400) return 'MASTER WORDSMITH';
    if (score >= 250) return 'ADEPT SCHOLAR';
    if (score >= 120) return 'APPRENTICE SCRIBE';
    return 'NOVICE LINGUIST';
  }

  function showGameOverModal() {
    document.getElementById('gameover-score').textContent = state.score.toLocaleString();
    document.getElementById('gameover-rank').textContent = `RANK: ${getRank(state.score)}`;
    document.getElementById('gameover-words-count').textContent = state.wordsHarvested;
    document.getElementById('gameover-best-word').textContent = state.bestWord || '—';

    // Increment games played
    const gamesPlayed = parseInt(localStorage.getItem('glyphs_games_played') || '0', 10) + 1;
    localStorage.setItem('glyphs_games_played', gamesPlayed.toString());

    // Update total words harvested
    const totalWords = parseInt(localStorage.getItem('glyphs_total_words') || '0', 10) + state.wordsHarvested;
    localStorage.setItem('glyphs_total_words', totalWords.toString());

    DOM.modalGameOver.showModal();
    triggerConfetti();
  }

  // ── NEW RUN INITIALIZATION ──
  function startNewGame() {
    state.deck = generateDeck();
    state.board.fill(null);
    state.cellModifiers.fill(null);
    state.hand.fill(null);
    state.queue.length = 0;
    state.score = 0;
    state.combo = 1.0;
    state.wordsHarvested = 0;
    state.harvestHistory = [];
    state.lastMove = null;
    state.selectedHandIndex = null;
    state.detectedWords = [];

    // Pre-populate 1 or 2 occasional challenge Glitches on board
    const glitch1 = Math.floor(Math.random() * TOTAL_CELLS);
    state.cellModifiers[glitch1] = 'glitch';

    // Fill initial queue & hand
    for (let i = 0; i < QUEUE_CAPACITY; i++) {
      if (state.deck.length > 0) state.queue.push(state.deck.pop());
    }
    replenishHand();

    DOM.wordLogList.innerHTML = '<div class="empty-log-msg">Place letters to form valid words horizontally or vertically. Valid words glow for harvesting!</div>';
    DOM.logCount.textContent = '0 words';

    DOM.defTerm.textContent = 'GLYPHS';
    DOM.defPos.textContent = 'noun';
    DOM.defBody.textContent = 'A symbolic character, tile, or letter designed to convey meaning and score points.';

    renderBoard();
    updateStatusCounters();
  }

  // ── THEME & SOUND CONTROLS ──
  function initControls() {
    // Theme sync with portfolio
    if (DOM.btnTheme) {
      DOM.btnTheme.addEventListener('click', () => {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        DOM.btnTheme.textContent = next === 'dark' ? '☾' : '☀';
      });

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        DOM.btnTheme.textContent = savedTheme === 'dark' ? '☾' : '☀';
      }
    }

    // Audio toggle
    if (DOM.btnSound) {
      DOM.btnSound.textContent = AudioEngine.isEnabled() ? '🔊' : '🔇';
      DOM.btnSound.addEventListener('click', () => {
        const active = AudioEngine.toggle();
        DOM.btnSound.textContent = active ? '🔊' : '🔇';
      });
    }

    // Modals
    if (DOM.btnHelp && DOM.modalHelp) {
      DOM.btnHelp.addEventListener('click', () => DOM.modalHelp.showModal());
    }
    if (DOM.btnStats && DOM.modalStats) {
      DOM.btnStats.addEventListener('click', () => {
        const elHigh = document.getElementById('stat-modal-high');
        if (elHigh) elHigh.textContent = state.highScore.toLocaleString();
        const elGames = document.getElementById('stat-modal-games');
        if (elGames) elGames.textContent = localStorage.getItem('glyphs_games_played') || '0';
        const elWords = document.getElementById('stat-modal-words');
        if (elWords) elWords.textContent = localStorage.getItem('glyphs_total_words') || '0';
        const elBest = document.getElementById('stat-modal-best-word');
        if (elBest) elBest.textContent = state.bestWord || '—';
        DOM.modalStats.showModal();
      });
    }

    // Close buttons for modals
    document.querySelectorAll('[data-close]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-close');
        const modal = document.getElementById(targetId);
        if (modal) modal.close();
      });
    });

    // Recall & Shuffle buttons
    if (DOM.btnRecall) DOM.btnRecall.addEventListener('click', recallLastMove);
    if (DOM.btnShuffle) {
      DOM.btnShuffle.addEventListener('click', () => {
        // Shuffle only the active hand tiles
        const nonNull = state.hand.filter(t => t !== null);
        for (let i = nonNull.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nonNull[i], nonNull[j]] = [nonNull[j], nonNull[i]];
        }
        let ptr = 0;
        for (let i = 0; i < HAND_CAPACITY; i++) {
          if (state.hand[i] !== null) {
            state.hand[i] = nonNull[ptr++];
          }
        }
        AudioEngine.click();
        renderHand();
      });
    }

    // Restart button
    if (DOM.btnRestart) {
      DOM.btnRestart.addEventListener('click', () => {
        if (confirm('Start a new GLYPHS run? Your current board will be reset.')) {
          startNewGame();
        }
      });
    }

    // Harvest Banner Click
    if (DOM.harvestBanner) {
      DOM.harvestBanner.addEventListener('click', () => {
        if (state.detectedWords.length > 0) {
          const best = state.detectedWords.reduce((p, c) => (c.score > p.score ? c : p));
          harvestWord(best);
        }
      });
    }

    // Share buttons
    if (DOM.btnShareStats) DOM.btnShareStats.addEventListener('click', shareStats);
    if (DOM.btnGameOverShare) DOM.btnGameOverShare.addEventListener('click', shareStats);

    // Play again on game over
    if (DOM.btnGameOverRestart && DOM.modalGameOver) {
      DOM.btnGameOverRestart.addEventListener('click', () => {
        DOM.modalGameOver.close();
        startNewGame();
      });
    }

    // Keyboard Shortcuts (Enter to harvest, Backspace/U to recall, S to shuffle)
    window.addEventListener('keydown', (e) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

      if (e.key === 'Enter') {
        if (state.detectedWords.length > 0) {
          const best = state.detectedWords.reduce((p, c) => (c.score > p.score ? c : p));
          harvestWord(best);
        }
      } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'u') {
        recallLastMove();
      } else if (e.key.toLowerCase() === 's') {
        if (DOM.btnShuffle) DOM.btnShuffle.click();
      }
    });
  }

  function shareStats() {
    const text = `GLYPHS Word Puzzle · bennnnto.me\n` +
      `⚡ Score: ${state.score} pts (${getRank(state.score)})\n` +
      `🏆 Best Word: ${state.bestWord}\n` +
      `📜 Words Harvested: ${state.wordsHarvested}\n` +
      `🔥 Max Combo: ${state.combo.toFixed(1)}×`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Score card copied to clipboard!');
      }).catch(() => {
        alert(text);
      });
    } else {
      alert(text);
    }
  }

  // ── INIT ──
  document.addEventListener('DOMContentLoaded', () => {
    if (DOM.boardGrid) {
      initHandAndQueueDOM();
      initBoardDOM();
      initControls();
      startNewGame();
    }
  });
})();
