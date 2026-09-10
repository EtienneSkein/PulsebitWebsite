/*
  Pulsebit site interactions
  --------------------------
  Shared browser-side behavior for the static prototype:
  navigation, page transitions, draggable dock, forms, Lab console,
  sliding puzzle, Pulse-Maze arcade game and background canvas animation.
*/

/* Shared DOM hooks used across pages. Most pages only use a subset. */
const body = document.body;
const menuToggle = document.querySelector("#menuToggle");
const menuOverlay = document.querySelector("#menuOverlay");
const intentButtons = document.querySelectorAll("[data-mode]");
const modeLinks = document.querySelectorAll("[data-mode-link]");
const layerButtons = document.querySelectorAll("[data-layer]");
const form = document.querySelector("#discoveryForm");
const workWithUsForm = document.querySelector("#workWithUsForm");
const canvas = document.querySelector("#pulse-field");
const ctx = canvas.getContext("2d");
const splitHero = document.querySelector(".split-hero");
const levelTransition = document.querySelector("#levelTransition");
const pathDockLinks = document.querySelectorAll(".path-dock a");
const pathDock = document.querySelector(".path-dock");
const workflowButtons = document.querySelectorAll("[data-workflow]");
const puzzleRoot = document.querySelector("[data-sliding-puzzle]");
const pacmanRoot = document.querySelector("[data-pacman-game]");
const serviceExplainButtons = document.querySelectorAll("[data-service-explain]");

function scrollToHashTarget() {
  if (!window.location.hash) return;

  const target = document.querySelector(window.location.hash);
  if (!target) return;

  target.scrollIntoView({ block: "start", behavior: "auto" });
}

window.addEventListener("load", () => {
  window.setTimeout(scrollToHashTarget, 80);
});

/* Landing page split-mode state and page transition animation */
if (splitHero) {
  body.dataset.mode = "neutral";
}

function setMode(mode) {
  body.dataset.mode = mode;
  intentButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === mode);
  });
}

function getTransitionModeFromHref(href, fallback = "software") {
  if (href.includes("agency")) return "marketing";
  if (href.includes("lab")) return "software";
  return fallback;
}

function startLevelTransition(href, mode) {
  if (!levelTransition) {
    window.location.href = href;
    return;
  }

  const label = mode === "marketing" ? "Agency Level" : mode === "software" ? "Lab Level" : "Pulse Level";
  const kicker = mode === "marketing" ? "Level unlocked" : mode === "software" ? "Runtime boot" : "Return gate";
  const message =
    mode === "marketing"
      ? "Loading creative campaign world"
      : mode === "software"
        ? "Loading software systems world"
        : "Loading Pulsebit entry point";

  body.dataset.entering = mode;
  levelTransition.className = `level-transition is-active is-${mode}`;
  levelTransition.setAttribute("aria-hidden", "false");
  levelTransition.querySelector(".level-kicker").textContent = kicker;
  levelTransition.querySelector("strong").textContent = label;
  levelTransition.querySelector("p").textContent = message;

  window.setTimeout(() => {
    window.location.href = href;
  }, 2550);
}

intentButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

modeLinks.forEach((link) => {
  link.addEventListener("mouseenter", () => setMode(link.dataset.modeLink));
  link.addEventListener("focus", () => setMode(link.dataset.modeLink));
});

/* Split landing hover behavior */
if (splitHero) {
  splitHero.addEventListener("pointermove", (event) => {
    const rect = splitHero.getBoundingClientRect();
    const mode = event.clientX - rect.left < rect.width / 2 ? "marketing" : "software";
    setMode(mode);
  });

  splitHero.addEventListener("mouseleave", () => setMode("neutral"));
}

if (splitHero && levelTransition) {
  modeLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const mode = link.dataset.modeLink;

      if (!href || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      setMode(mode);
      startLevelTransition(href, mode);
    });
  });
}

pathDockLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.getAttribute("aria-current") === "page") return;

    event.preventDefault();
    startLevelTransition(href, getTransitionModeFromHref(href, body.dataset.mode || "software"));
  });
});

/* Draggable navigation dock used on all non-landing pages */
if (pathDock) {
  const handle = pathDock.querySelector(".path-dock-handle");
  const toggle = pathDock.querySelector(".path-dock-toggle");
  const savedPosition = localStorage.getItem("pulsebitDockPosition");
  const savedMinimized = localStorage.getItem("pulsebitDockMinimized") === "true";

  function setDockPosition(x, y) {
    const rect = pathDock.getBoundingClientRect();
    const padding = 12;
    const topSafeZone = 86;
    const clampedX = Math.min(Math.max(padding, x), window.innerWidth - rect.width - padding);
    const clampedY = Math.min(Math.max(topSafeZone, y), window.innerHeight - rect.height - padding);

    pathDock.style.setProperty("--dock-left", `${clampedX}px`);
    pathDock.style.setProperty("--dock-top", `${clampedY}px`);
    pathDock.style.setProperty("--dock-bottom", "auto");
    pathDock.style.setProperty("--dock-transform", "none");
    localStorage.setItem("pulsebitDockPosition", JSON.stringify({ x: clampedX, y: clampedY }));
  }

  if (savedPosition) {
    try {
      const position = JSON.parse(savedPosition);
      window.requestAnimationFrame(() => setDockPosition(position.x, position.y));
    } catch {
      localStorage.removeItem("pulsebitDockPosition");
    }
  }

  if (savedMinimized) {
    pathDock.classList.add("is-minimized");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "+";
  }

  toggle.addEventListener("click", () => {
    const minimized = pathDock.classList.toggle("is-minimized");
    toggle.setAttribute("aria-expanded", String(!minimized));
    toggle.setAttribute("aria-label", minimized ? "Expand navigation" : "Minimize navigation");
    toggle.textContent = minimized ? "+" : "-";
    localStorage.setItem("pulsebitDockMinimized", String(minimized));

    const rect = pathDock.getBoundingClientRect();
    setDockPosition(rect.left, rect.top);
  });

  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const rect = pathDock.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    pathDock.classList.add("is-dragging");
    handle.setPointerCapture(event.pointerId);

    function onPointerMove(moveEvent) {
      setDockPosition(moveEvent.clientX - offsetX, moveEvent.clientY - offsetY);
    }

    function onPointerUp(upEvent) {
      pathDock.classList.remove("is-dragging");
      handle.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  });

  window.addEventListener("resize", () => {
    const rect = pathDock.getBoundingClientRect();
    setDockPosition(rect.left, rect.top);
  });
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuOverlay.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuOverlay.setAttribute("aria-hidden", String(!isOpen));
});

menuOverlay.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    menuOverlay.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuOverlay.setAttribute("aria-hidden", "true");
  });
});

layerButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const layer = button.dataset.layer;
    const active = button.classList.toggle("is-active");
    document.querySelectorAll(`.layer-${layer}`).forEach((item) => {
      item.dataset.hidden = String(!active);
    });
  });
});

/* Discovery form routing copy */
if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const intent = data.get("intent");
    const response = form.querySelector(".form-response");
    const routes = {
      marketing: "Discovery routed to the Agency: creative growth, campaign intelligence, and performance proof.",
      software: "Discovery routed to the Lab: architecture, automation, and bespoke infrastructure.",
      both: "Discovery routed to Ecosystem: strategy, creative, code, and analytics in one build path.",
    };
    response.textContent = routes[intent];
  });
}

/* Become an agent form mailto handoff */
if (workWithUsForm) {
  workWithUsForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!workWithUsForm.reportValidity()) return;

    const data = new FormData(workWithUsForm);
    const fields = {
      name: data.get("name")?.toString().trim() || "",
      surname: data.get("surname")?.toString().trim() || "",
      cell: data.get("cell")?.toString().trim() || "",
      github: data.get("github")?.toString().trim() || "Not provided",
      linkedin: data.get("linkedin")?.toString().trim() || "Not provided",
      message: data.get("message")?.toString().trim() || "No message added.",
    };

    const bodyLines = [
      "Become an agent submission",
      "",
      `Name: ${fields.name}`,
      `Surname: ${fields.surname}`,
      `Cell: ${fields.cell}`,
      `GitHub: ${fields.github}`,
      `LinkedIn: ${fields.linkedin}`,
      "",
      "Message:",
      fields.message,
    ];

    const subject = encodeURIComponent(`Become an agent: ${fields.name} ${fields.surname}`);
    const emailBody = encodeURIComponent(bodyLines.join("\n"));
    const response = workWithUsForm.querySelector(".form-response");

    response.textContent = "Opening your email app with the details ready for Pulsebit.";
    window.location.href = `mailto:hello@pulsebit.co.za?subject=${subject}&body=${emailBody}`;
  });
}

/* Pulsebit Switch sliding puzzle and local leaderboard */
if (puzzleRoot) {
  const puzzleModal = document.querySelector("[data-puzzle-modal]");
  const puzzleOpenButton = document.querySelector("[data-puzzle-open]");
  const puzzleCloseButton = document.querySelector("[data-puzzle-close]");
  const board = puzzleRoot.querySelector("[data-puzzle-board]");
  const preview = puzzleRoot.querySelector("[data-puzzle-preview]");
  const sizeButtons = puzzleRoot.querySelectorAll("[data-puzzle-size]");
  const imageButtons = puzzleRoot.querySelectorAll("[data-puzzle-image]");
  const shuffleButton = puzzleRoot.querySelector("[data-puzzle-shuffle]");
  const resetButton = puzzleRoot.querySelector("[data-puzzle-reset]");
  const movesValue = puzzleRoot.querySelector("[data-puzzle-moves]");
  const timeValue = puzzleRoot.querySelector("[data-puzzle-time]");
  const statusValue = puzzleRoot.querySelector("[data-puzzle-status]");
  const leaderboardList = puzzleRoot.querySelector("[data-puzzle-leaderboard]");
  const leaderboardKey = "pulsebitSwitchLeaderboard";
  let puzzleSize = 3;
  let puzzleImage = imageButtons[0]?.dataset.puzzleImage || "";
  let tiles = [];
  let moves = 0;
  let startedAt = null;
  let timerId = null;

  function openPuzzleModal() {
    if (!puzzleModal) return;

    puzzleModal.classList.add("is-open");
    puzzleModal.setAttribute("aria-hidden", "false");
    body.classList.add("has-puzzle-modal");
    window.setTimeout(() => board.querySelector(".puzzle-tile:not(.is-empty)")?.focus(), 180);
  }

  function closePuzzleModal() {
    if (!puzzleModal) return;

    puzzleModal.classList.remove("is-open");
    puzzleModal.setAttribute("aria-hidden", "true");
    body.classList.remove("has-puzzle-modal");
    puzzleOpenButton?.focus();
  }

  function formatTime(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function elapsedSeconds() {
    return startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
  }

  function readLeaderboard() {
    try {
      return JSON.parse(window.localStorage.getItem(leaderboardKey)) || [];
    } catch (error) {
      return [];
    }
  }

  function writeLeaderboard(entries) {
    try {
      window.localStorage.setItem(leaderboardKey, JSON.stringify(entries));
    } catch (error) {
      // Private browsing or locked storage should not break the game.
    }
  }

  function matchingLeaderboardEntries() {
    return readLeaderboard()
      .filter((entry) => entry.size === puzzleSize && entry.image === puzzleImage)
      .sort((first, second) => first.moves - second.moves || first.seconds - second.seconds)
      .slice(0, 5);
  }

  function renderLeaderboard() {
    if (!leaderboardList) return;

    leaderboardList.innerHTML = "";
    const entries = matchingLeaderboardEntries();

    if (!entries.length) {
      const emptyItem = document.createElement("li");
      emptyItem.textContent = "No completed runs yet.";
      leaderboardList.appendChild(emptyItem);
      return;
    }

    entries.forEach((entry, index) => {
      const item = document.createElement("li");
      const score = document.createElement("strong");
      const time = document.createElement("span");
      score.textContent = `${index + 1}. ${entry.moves} moves`;
      time.textContent = formatTime(entry.seconds);
      item.append(score, time);
      leaderboardList.appendChild(item);
    });
  }

  function saveLeaderboardEntry(seconds) {
    const entries = readLeaderboard();
    entries.push({
      size: puzzleSize,
      image: puzzleImage,
      moves,
      seconds,
      completedAt: new Date().toISOString(),
    });
    writeLeaderboard(entries.slice(-80));
  }

  function updateTimer() {
    if (!startedAt) {
      timeValue.textContent = "00:00";
      return;
    }

    timeValue.textContent = formatTime(Math.floor((Date.now() - startedAt) / 1000));
  }

  function startTimer() {
    if (startedAt) return;

    startedAt = Date.now();
    updateTimer();
    timerId = window.setInterval(updateTimer, 1000);
  }

  function stopTimer() {
    if (timerId) {
      window.clearInterval(timerId);
      timerId = null;
    }
  }

  function resetStats(message = "Choose a tile next to the empty slot.") {
    moves = 0;
    startedAt = null;
    stopTimer();
    movesValue.textContent = String(moves);
    timeValue.textContent = "00:00";
    statusValue.textContent = message;
  }

  function solvedTiles(size) {
    return Array.from({ length: size * size }, (_, index) => (index === size * size - 1 ? null : index));
  }

  function isSolved() {
    return tiles.every((tile, index) => tile === (index === tiles.length - 1 ? null : index));
  }

  function adjacentIndexes(index, size) {
    const row = Math.floor(index / size);
    const col = index % size;
    return [
      row > 0 ? index - size : null,
      row < size - 1 ? index + size : null,
      col > 0 ? index - 1 : null,
      col < size - 1 ? index + 1 : null,
    ].filter((value) => value !== null);
  }

  function shuffleTiles(size) {
    const shuffled = solvedTiles(size);
    let emptyIndex = shuffled.length - 1;
    let previousEmptyIndex = -1;
    const steps = size * size * 32;

    for (let step = 0; step < steps; step += 1) {
      const options = adjacentIndexes(emptyIndex, size).filter((index) => index !== previousEmptyIndex);
      const nextIndex = options[Math.floor(Math.random() * options.length)];
      shuffled[emptyIndex] = shuffled[nextIndex];
      shuffled[nextIndex] = null;
      previousEmptyIndex = emptyIndex;
      emptyIndex = nextIndex;
    }

    if (shuffled.every((tile, index) => tile === (index === shuffled.length - 1 ? null : index))) {
      return shuffleTiles(size);
    }

    return shuffled;
  }

  function renderPuzzle() {
    board.style.setProperty("--puzzle-size", puzzleSize);
    board.style.setProperty("--puzzle-image", `url("${puzzleImage}")`);
    board.innerHTML = "";

    tiles.forEach((tile, index) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = tile === null ? "puzzle-tile is-empty" : "puzzle-tile";
      cell.dataset.index = String(index);

      if (tile !== null) {
        const row = Math.floor(tile / puzzleSize);
        const col = tile % puzzleSize;
        cell.style.setProperty("--tile-col", col);
        cell.style.setProperty("--tile-row", row);
        cell.style.setProperty("--tile-bg-size", `${puzzleSize * 100}% ${puzzleSize * 100}%`);
        cell.style.setProperty("--tile-bg-x", `${puzzleSize === 1 ? 0 : (col / (puzzleSize - 1)) * 100}%`);
        cell.style.setProperty("--tile-bg-y", `${puzzleSize === 1 ? 0 : (row / (puzzleSize - 1)) * 100}%`);
        cell.setAttribute("aria-label", `Move tile ${tile + 1}`);
      } else {
        cell.setAttribute("aria-label", "Empty slot");
        cell.disabled = true;
      }

      board.appendChild(cell);
    });
  }

  function setPuzzleImage(image) {
    puzzleImage = image;
    preview.src = image;
    preview.alt = "Selected Pulsebit puzzle reference";
    board.style.setProperty("--puzzle-image", `url("${puzzleImage}")`);
  }

  function newPuzzle(message = "Puzzle shuffled. Find the empty slot and rebuild the logo.") {
    tiles = shuffleTiles(puzzleSize);
    resetStats(message);
    renderPuzzle();
    renderLeaderboard();
  }

  board.addEventListener("click", (event) => {
    const tileButton = event.target.closest(".puzzle-tile");
    if (!tileButton || tileButton.classList.contains("is-empty") || isSolved()) return;

    const tileIndex = Number(tileButton.dataset.index);
    const emptyIndex = tiles.indexOf(null);

    if (!adjacentIndexes(emptyIndex, puzzleSize).includes(tileIndex)) {
      statusValue.textContent = "That tile is locked. Choose one touching the empty slot.";
      return;
    }

    startTimer();
    tiles[emptyIndex] = tiles[tileIndex];
    tiles[tileIndex] = null;
    moves += 1;
    movesValue.textContent = String(moves);
    renderPuzzle();

    if (isSolved()) {
      const seconds = elapsedSeconds();
      stopTimer();
      timeValue.textContent = formatTime(seconds);
      saveLeaderboardEntry(seconds);
      renderLeaderboard();
      statusValue.textContent = `Signal rebuilt in ${moves} moves. Score saved.`;
    } else {
      statusValue.textContent = "Signal shifted. Keep solving.";
    }
  });

  sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      puzzleSize = Number(button.dataset.puzzleSize);
      sizeButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      newPuzzle(`${puzzleSize}x${puzzleSize} grid loaded.`);
    });
  });

  imageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPuzzleImage(button.dataset.puzzleImage);
      imageButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      newPuzzle("New logo loaded and shuffled.");
    });
  });

  shuffleButton.addEventListener("click", () => newPuzzle("Puzzle shuffled. Rebuild the logo."));

  resetButton.addEventListener("click", () => {
    tiles = solvedTiles(puzzleSize);
    resetStats("Puzzle reset. Hit shuffle when you are ready.");
    renderPuzzle();
    renderLeaderboard();
  });

  puzzleOpenButton?.addEventListener("click", openPuzzleModal);
  puzzleCloseButton?.addEventListener("click", closePuzzleModal);
  puzzleModal?.addEventListener("click", (event) => {
    if (event.target === puzzleModal) closePuzzleModal();
  });
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && puzzleModal?.classList.contains("is-open")) {
      closePuzzleModal();
    }
  });

  setPuzzleImage(puzzleImage);
  newPuzzle();
}

/* Pulse-Maze arcade game */
if (pacmanRoot) {
  const pacmanModal = document.querySelector("[data-pacman-modal]");
  const pacmanOpenButton = document.querySelector("[data-pacman-open]");
  const pacmanCloseButton = document.querySelector("[data-pacman-close]");
  const pacmanCanvas = pacmanRoot.querySelector("[data-pacman-canvas]");
  const pacmanCtx = pacmanCanvas.getContext("2d");
  const scoreValue = pacmanRoot.querySelector("[data-pacman-score]");
  const livesValue = pacmanRoot.querySelector("[data-pacman-lives]");
  const statusValue = pacmanRoot.querySelector("[data-pacman-status]");
  const startButton = pacmanRoot.querySelector("[data-pacman-start]");
  const pauseButton = pacmanRoot.querySelector("[data-pacman-pause]");
  const resetButton = pacmanRoot.querySelector("[data-pacman-reset]");
  const directionButtons = pacmanRoot.querySelectorAll("[data-pacman-dir]");
  const maze = [
    "###############",
    "#.............#",
    "#.###.###.###.#",
    "#o#.........#o#",
    "#.#.#.###.#.#.#",
    "#...#..#..#...#",
    "###.##...##.###",
    "#.............#",
    "#.##.#####.##.#",
    "#o...#...#...o#",
    "###.#.#.#.#.###",
    "#...#.....#...#",
    "#.###.###.###.#",
    "#.............#",
    "###############",
  ];
  const tileSize = pacmanCanvas.width / maze.length;
  const halfTile = tileSize / 2;
  const playerRadius = tileSize * 0.34;
  const startPlayer = { x: 1, y: 1 };
  const startGhosts = [
    { x: 13, y: 13, color: "#ff4f8b", dir: "left", speed: 4.55 },
    { x: 13, y: 1, color: "#38f6d6", dir: "left", speed: 4.25 },
    { x: 1, y: 13, color: "#ff7b2f", dir: "right", speed: 4.05 },
  ];
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const reverseDirections = {
    up: "down",
    down: "up",
    left: "right",
    right: "left",
  };
  let pellets = new Set();
  let player = createMover(startPlayer.x, startPlayer.y, "right", 5.55);
  let ghosts = startGhosts.map(createGhost);
  let currentDirection = "right";
  let nextDirection = "right";
  let score = 0;
  let lives = 3;
  let running = false;
  let gameOver = false;
  let loopId = null;
  let lastFrame = 0;
  let levelFlash = 0;
  let invulnerableTimer = 0;
  let powerTimer = 0;

  function openPacmanModal() {
    pacmanModal.classList.add("is-open");
    pacmanModal.setAttribute("aria-hidden", "false");
    body.classList.add("has-puzzle-modal");
    window.setTimeout(() => startButton?.focus(), 180);
  }

  function closePacmanModal() {
    pacmanModal.classList.remove("is-open");
    pacmanModal.setAttribute("aria-hidden", "true");
    body.classList.remove("has-puzzle-modal");
    stopPacman();
    pacmanOpenButton?.focus();
  }

  function isWall(x, y) {
    return maze[y]?.[x] === "#";
  }

  function tileCenter(x, y) {
    return {
      x: x * tileSize + halfTile,
      y: y * tileSize + halfTile,
    };
  }

  function createMover(x, y, dir = "right", speed = 5, color = null) {
    const center = tileCenter(x, y);
    return {
      cellX: x,
      cellY: y,
      targetX: x,
      targetY: y,
      x: center.x,
      y: center.y,
      dir,
      speed,
      color,
      moving: false,
    };
  }

  function createGhost(ghost) {
    return {
      ...createMover(ghost.x, ghost.y, ghost.dir, ghost.speed, ghost.color),
      spawnX: ghost.x,
      spawnY: ghost.y,
      spawnDir: ghost.dir,
      active: true,
      respawnTimer: 0,
    };
  }

  function pelletKey(x, y) {
    return `${x},${y}`;
  }

  function seedPellets() {
    pellets = new Set();
    maze.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === "." || cell === "o") pellets.add(pelletKey(x, y));
      });
    });
    pellets.delete(pelletKey(startPlayer.x, startPlayer.y));
  }

  function updatePacmanHud(message) {
    scoreValue.textContent = String(score);
    livesValue.textContent = String(lives);
    if (message) statusValue.textContent = message;
  }

  function drawRoundedCell(x, y, color, inset = 3) {
    const size = tileSize - inset * 2;
    pacmanCtx.fillStyle = color;
    pacmanCtx.beginPath();
    pacmanCtx.roundRect(x * tileSize + inset, y * tileSize + inset, size, size, 7);
    pacmanCtx.fill();
  }

  function drawPacman() {
    const centerX = player.x;
    const centerY = player.y;
    const angleMap = { right: 0, down: Math.PI / 2, left: Math.PI, up: Math.PI * 1.5 };
    const facing = angleMap[currentDirection] ?? 0;
    const chomp = running ? 0.22 + Math.abs(Math.sin(performance.now() / 82)) * 0.24 : 0.18;
    pacmanCtx.save();
    pacmanCtx.globalAlpha = invulnerableTimer > 0 && Math.floor(performance.now() / 90) % 2 === 0 ? 0.52 : 1;
    pacmanCtx.shadowColor = "rgba(197, 255, 47, 0.55)";
    pacmanCtx.shadowBlur = 18;
    pacmanCtx.fillStyle = "#c5ff2f";
    pacmanCtx.beginPath();
    pacmanCtx.moveTo(centerX, centerY);
    pacmanCtx.arc(centerX, centerY, playerRadius, facing + chomp, facing + Math.PI * 2 - chomp);
    pacmanCtx.closePath();
    pacmanCtx.fill();
    pacmanCtx.restore();
  }

  function drawGhost(ghost) {
    const centerX = ghost.x;
    const centerY = ghost.y;
    if (!ghost.active) {
      const pulse = 0.35 + Math.abs(Math.sin(performance.now() / 180)) * 0.25;
      pacmanCtx.save();
      pacmanCtx.strokeStyle = `rgba(255, 79, 139, ${pulse})`;
      pacmanCtx.lineWidth = 2;
      pacmanCtx.beginPath();
      pacmanCtx.arc(centerX, centerY, tileSize * 0.28, 0, Math.PI * 2);
      pacmanCtx.stroke();
      pacmanCtx.restore();
      return;
    }

    const vulnerable = powerTimer > 0;
    const warningBlink = vulnerable && powerTimer < 2 && Math.floor(performance.now() / 120) % 2 === 0;
    const ghostColor = vulnerable ? (warningBlink ? "#f8f7ee" : "#284cff") : ghost.color;
    pacmanCtx.save();
    pacmanCtx.shadowColor = ghostColor;
    pacmanCtx.shadowBlur = vulnerable ? 20 : 12;
    pacmanCtx.fillStyle = ghostColor;
    pacmanCtx.beginPath();
    pacmanCtx.arc(centerX, centerY - 2, tileSize * 0.35, Math.PI, 0);
    pacmanCtx.lineTo(centerX + tileSize * 0.35, centerY + tileSize * 0.32);
    pacmanCtx.lineTo(centerX + tileSize * 0.14, centerY + tileSize * 0.22);
    pacmanCtx.lineTo(centerX, centerY + tileSize * 0.32);
    pacmanCtx.lineTo(centerX - tileSize * 0.14, centerY + tileSize * 0.22);
    pacmanCtx.lineTo(centerX - tileSize * 0.35, centerY + tileSize * 0.32);
    pacmanCtx.closePath();
    pacmanCtx.fill();
    pacmanCtx.fillStyle = "#050809";
    pacmanCtx.beginPath();
    pacmanCtx.arc(centerX - 7, centerY - 5, 3, 0, Math.PI * 2);
    pacmanCtx.arc(centerX + 7, centerY - 5, 3, 0, Math.PI * 2);
    pacmanCtx.fill();
    pacmanCtx.restore();
  }

  function drawPacmanGame() {
    pacmanCtx.clearRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);
    pacmanCtx.fillStyle = "#050809";
    pacmanCtx.fillRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);

    maze.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        if (cell === "#") {
          drawRoundedCell(x, y, "rgba(56, 246, 214, 0.16)", 3);
          pacmanCtx.strokeStyle = "rgba(56, 246, 214, 0.48)";
          pacmanCtx.lineWidth = 1.5;
          pacmanCtx.strokeRect(x * tileSize + 7, y * tileSize + 7, tileSize - 14, tileSize - 14);
        }
      });
    });

    pellets.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const isPower = maze[y][x] === "o";
      pacmanCtx.fillStyle = isPower ? "#ff4f8b" : "#f8f7ee";
      pacmanCtx.beginPath();
      pacmanCtx.arc(x * tileSize + tileSize / 2, y * tileSize + tileSize / 2, isPower ? 6.5 : 3.2, 0, Math.PI * 2);
      pacmanCtx.fill();
    });

    drawPacman();
    ghosts.forEach(drawGhost);

    if (levelFlash > 0) {
      pacmanCtx.fillStyle = `rgba(197, 255, 47, ${Math.min(levelFlash, 0.35)})`;
      pacmanCtx.fillRect(0, 0, pacmanCanvas.width, pacmanCanvas.height);
    }
  }

  function canMoveFrom(x, y, direction) {
    const vector = directions[direction];
    if (!vector) return false;
    return !isWall(x + vector.x, y + vector.y);
  }

  function availableDirections(entity) {
    return Object.keys(directions).filter((direction) => canMoveFrom(entity.cellX, entity.cellY, direction));
  }

  function setEntityTarget(entity, direction) {
    const vector = directions[direction];
    if (!vector || !canMoveFrom(entity.cellX, entity.cellY, direction)) {
      entity.moving = false;
      return false;
    }

    entity.dir = direction;
    entity.targetX = entity.cellX + vector.x;
    entity.targetY = entity.cellY + vector.y;
    entity.moving = true;
    return true;
  }

  function arriveAtTarget(entity) {
    const center = tileCenter(entity.targetX, entity.targetY);
    entity.x = center.x;
    entity.y = center.y;
    entity.cellX = entity.targetX;
    entity.cellY = entity.targetY;
    entity.moving = false;
  }

  function advanceEntity(entity, deltaSeconds) {
    if (!entity.moving) return;

    const target = tileCenter(entity.targetX, entity.targetY);
    const distance = Math.hypot(target.x - entity.x, target.y - entity.y);
    const step = entity.speed * tileSize * deltaSeconds;

    if (distance <= step) {
      arriveAtTarget(entity);
      return;
    }

    entity.x += ((target.x - entity.x) / distance) * step;
    entity.y += ((target.y - entity.y) / distance) * step;
  }

  function resetPositions() {
    player = createMover(startPlayer.x, startPlayer.y, "right", 5.55);
    ghosts = startGhosts.map(createGhost);
    currentDirection = "right";
    nextDirection = "right";
    invulnerableTimer = 1.2;
  }

  function stopPacman() {
    running = false;
    if (loopId) {
      window.cancelAnimationFrame(loopId);
      loopId = null;
    }
    lastFrame = 0;
  }

  function resetPacman(message = "Press start, then use arrow keys or the controls.") {
    stopPacman();
    score = 0;
    lives = 3;
    gameOver = false;
    invulnerableTimer = 0;
    powerTimer = 0;
    seedPellets();
    resetPositions();
    invulnerableTimer = 0;
    updatePacmanHud(message);
    drawPacmanGame();
  }

  function chooseGhostDirection(ghost) {
    const options = availableDirections(ghost);
    const reverse = reverseDirections[ghost.dir];
    const filteredOptions = options.length > 1 ? options.filter((direction) => direction !== reverse) : options;
    const chaseOptions = filteredOptions.sort((first, second) => {
      const firstVector = directions[first];
      const secondVector = directions[second];
      const firstDistance = Math.abs(player.cellX - (ghost.cellX + firstVector.x)) + Math.abs(player.cellY - (ghost.cellY + firstVector.y));
      const secondDistance = Math.abs(player.cellX - (ghost.cellX + secondVector.x)) + Math.abs(player.cellY - (ghost.cellY + secondVector.y));
      return firstDistance - secondDistance;
    });

    return Math.random() < 0.72 ? chaseOptions[0] : chaseOptions[Math.floor(Math.random() * chaseOptions.length)];
  }

  function moveGhosts(deltaSeconds) {
    ghosts.forEach((ghost) => {
      if (!ghost.active) {
        ghost.respawnTimer = Math.max(0, ghost.respawnTimer - deltaSeconds);
        if (ghost.respawnTimer <= 0) {
          const respawned = createGhost({
            x: ghost.spawnX,
            y: ghost.spawnY,
            dir: ghost.spawnDir,
            speed: ghost.speed,
            color: ghost.color,
          });
          Object.assign(ghost, respawned);
        }
        return;
      }

      if (!ghost.moving) setEntityTarget(ghost, chooseGhostDirection(ghost));
      advanceEntity(ghost, deltaSeconds);
    });
  }

  function handleCollision() {
    if (invulnerableTimer > 0) return;

    const collision = ghosts.find((ghost) => ghost.active && Math.hypot(ghost.x - player.x, ghost.y - player.y) < tileSize * 0.52);
    if (!collision) return;

    if (powerTimer > 0) {
      collision.active = false;
      collision.moving = false;
      collision.respawnTimer = 8;
      score += 200;
      levelFlash = 0.18;
      updatePacmanHud("Blocker cleared. Respawn in 8 seconds.");
      return;
    }

    lives -= 1;
    if (lives <= 0) {
      gameOver = true;
      stopPacman();
      updatePacmanHud("Game over. Reset the maze for another run.");
      return;
    }

    resetPositions();
    levelFlash = 0.28;
    updatePacmanHud("Signal hit. Brief shield active.");
  }

  function pacmanStep(timestamp) {
    if (!running || gameOver) return;

    if (!lastFrame) lastFrame = timestamp;
    const deltaSeconds = Math.min((timestamp - lastFrame) / 1000, 0.05);
    lastFrame = timestamp;

    if (!player.moving) {
      if (setEntityTarget(player, nextDirection)) {
        currentDirection = nextDirection;
      } else if (setEntityTarget(player, currentDirection)) {
        nextDirection = currentDirection;
      }
    }

    advanceEntity(player, deltaSeconds);

    if (!player.moving && nextDirection !== currentDirection && canMoveFrom(player.cellX, player.cellY, nextDirection)) {
      currentDirection = nextDirection;
    }

    const currentKey = pelletKey(player.cellX, player.cellY);
    if (pellets.has(currentKey)) {
      const isPowerPellet = maze[player.cellY][player.cellX] === "o";
      score += isPowerPellet ? 50 : 10;
      pellets.delete(currentKey);
      if (isPowerPellet) {
        powerTimer = 7;
        updatePacmanHud("Power dot active. Clear the blockers.");
      } else {
        updatePacmanHud("Signal node collected. Keep moving.");
      }
    }

    moveGhosts(deltaSeconds);
    invulnerableTimer = Math.max(0, invulnerableTimer - deltaSeconds);
    powerTimer = Math.max(0, powerTimer - deltaSeconds);
    handleCollision();
    levelFlash = Math.max(0, levelFlash - deltaSeconds * 1.6);

    if (!pellets.size) {
      gameOver = true;
      stopPacman();
      score += lives * 100;
      updatePacmanHud("Signal sweep complete. You cleared the maze.");
    } else if (!gameOver) {
      scoreValue.textContent = String(score);
      livesValue.textContent = String(lives);
    }

    drawPacmanGame();
    if (running && !gameOver) loopId = window.requestAnimationFrame(pacmanStep);
  }

  function startPacman() {
    if (gameOver) resetPacman("New run armed. Keep the blockers away.");
    if (running) return;

    running = true;
    lastFrame = 0;
    updatePacmanHud("Run live. Smooth through the corners.");
    loopId = window.requestAnimationFrame(pacmanStep);
  }

  function setPacmanDirection(direction) {
    if (directions[direction]) nextDirection = direction;
  }

  pacmanOpenButton?.addEventListener("click", openPacmanModal);
  pacmanCloseButton?.addEventListener("click", closePacmanModal);
  pacmanModal?.addEventListener("click", (event) => {
    if (event.target === pacmanModal) closePacmanModal();
  });
  startButton?.addEventListener("click", startPacman);
  pauseButton?.addEventListener("click", () => {
    stopPacman();
    updatePacmanHud("Paused. Hit start to continue.");
  });
  resetButton?.addEventListener("click", () => resetPacman("Maze reset. Press start when ready."));
  directionButtons.forEach((button) => {
    button.addEventListener("click", () => setPacmanDirection(button.dataset.pacmanDir));
  });
  window.addEventListener("keydown", (event) => {
    const keyMap = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };

    if (event.key === "Escape" && pacmanModal?.classList.contains("is-open")) {
      closePacmanModal();
      return;
    }

    if (!pacmanModal?.classList.contains("is-open")) return;
    const direction = keyMap[event.key];
    if (!direction) return;
    event.preventDefault();
    setPacmanDirection(direction);
  });

  resetPacman();
}

/* Interactive Lab software build console */
const workflowContent = {
  mail: {
    mode: "Workflow cockpit",
    title: "Structured intake system",
    summary: "Turn inbox requests into a visible workflow with ownership, context and next actions.",
    steps: ["capture", "classify", "assign", "track"],
    outputs: ["A shared intake dashboard", "Assignment rules and notifications", "A record of every open request"],
    buildType: "Portal + API + automation",
  },
  sheet: {
    mode: "Data control room",
    title: "Operational records layer",
    summary: "Move important spreadsheet work into structured records that can be checked, searched and reused.",
    steps: ["import", "normalize", "dedupe", "sync"],
    outputs: ["A cleaner data model", "Validation before records are saved", "Reusable reporting views"],
    buildType: "Database + admin panel + sync jobs",
  },
  crm: {
    mode: "Sales signal layer",
    title: "CRM context engine",
    summary: "Turn loose sales notes into structured context that supports follow-ups and clearer pipeline views.",
    steps: ["parse", "map", "enrich", "surface"],
    outputs: ["Better account context", "Consistent follow-up prompts", "Clearer pipeline views"],
    buildType: "CRM integration + enrichment service",
  },
  chat: {
    mode: "Request router",
    title: "Chat-to-workflow system",
    summary: "Convert chat-based requests into assigned tasks, approvals, alerts or workflow events.",
    steps: ["listen", "convert", "approve", "notify"],
    outputs: ["Less lost context", "Clear approval paths", "Team notifications"],
    buildType: "Bot + rules engine + task queue",
  },
  form: {
    mode: "Lead router",
    title: "Lead qualification system",
    summary: "Turn form submissions into validated records, CRM updates and the right next step for the team.",
    steps: ["capture", "validate", "route", "notify"],
    outputs: ["Validated submissions", "CRM-ready records", "Cleaner handoffs"],
    buildType: "Form logic + CRM API + alerts",
  },
};

function updateWorkflowDemo(key) {
  const content = workflowContent[key];
  if (!content) return;

  workflowButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.workflow === key);
  });

  document.querySelector("[data-engine-mode]").textContent = content.mode;
  document.querySelector("[data-workflow-title]").textContent = content.title;
  document.querySelector("[data-workflow-summary]").textContent = content.summary;
  document.querySelector("[data-step='one']").textContent = content.steps[0];
  document.querySelector("[data-step='two']").textContent = content.steps[1];
  document.querySelector("[data-step='three']").textContent = content.steps[2];
  document.querySelector("[data-step='four']").textContent = content.steps[3];
  document.querySelector("[data-output='one']").textContent = content.outputs[0];
  document.querySelector("[data-output='two']").textContent = content.outputs[1];
  document.querySelector("[data-output='three']").textContent = content.outputs[2];
  document.querySelector("[data-build-type]").textContent = content.buildType;
}

workflowButtons.forEach((button) => {
  button.addEventListener("click", () => updateWorkflowDemo(button.dataset.workflow));
});

serviceExplainButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const details = document.getElementById(button.getAttribute("aria-controls"));
    if (!details) return;

    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    /* FAQ toggles keep their question as the label; service panels swap it. */
    if (!button.hasAttribute("data-keep-label")) {
      button.textContent = isOpen ? "What does this mean?" : "Hide explanation";
    }
    details.hidden = isOpen;
  });
});

/* Animated background canvas field */
let width = 0;
let height = 0;
let points = [];
let pointer = { x: 0, y: 0, active: false };

function resize() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  points = Array.from({ length: Math.min(90, Math.floor(width / 18)) }, (_, index) => ({
    x: (index / 90) * width + Math.random() * 80,
    y: Math.random() * height,
    vx: Math.random() * 0.4 + 0.1,
    vy: Math.random() * 0.2 - 0.1,
    r: Math.random() * 2 + 0.8,
  }));
}

function draw() {
  ctx.clearRect(0, 0, width, height);
  const software = body.dataset.mode === "software";
  ctx.lineWidth = 1;

  points.forEach((point, index) => {
    point.x += software ? point.vx * 1.9 : point.vx;
    point.y += point.vy;

    if (point.x > width + 30) point.x = -30;
    if (point.y > height + 30) point.y = -30;
    if (point.y < -30) point.y = height + 30;

    const color = software ? "56, 246, 214" : "255, 79, 139";
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${color}, 0.34)`;
    ctx.fill();

    for (let nextIndex = index + 1; nextIndex < points.length; nextIndex += 1) {
      const next = points[nextIndex];
      const distance = Math.hypot(point.x - next.x, point.y - next.y);
      if (distance < 118) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.strokeStyle = `rgba(${color}, ${0.09 * (1 - distance / 118)})`;
        ctx.stroke();
      }
    }

    if (pointer.active) {
      const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
      if (distance < 180) {
        point.x += (point.x - pointer.x) * 0.003;
        point.y += (point.y - pointer.y) * 0.003;
      }
    }
  });

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
window.addEventListener("pointermove", (event) => {
  pointer = { x: event.clientX, y: event.clientY, active: true };
});
window.addEventListener("pointerleave", () => {
  pointer.active = false;
});

resize();
draw();
