const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const lineEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const pieceEl = document.getElementById('pieces');

const COLS = 10;
const ROWS = 20;
const CELL = 30;

const COLORS = {
  I: '#6cf6ff',
  O: '#ffd166',
  T: '#c792ea',
  S: '#7be495',
  Z: '#ff6b6b',
  J: '#6ea4ff',
  L: '#f5a962',
};

const SHAPES = {
  I: [
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
  ],
  O: [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  T: [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  S: [
    [1, 0],
    [2, 0],
    [0, 1],
    [1, 1],
  ],
  Z: [
    [0, 0],
    [1, 0],
    [1, 1],
    [2, 1],
  ],
  J: [
    [0, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
  L: [
    [2, 0],
    [0, 1],
    [1, 1],
    [2, 1],
  ],
};

let board;
let active;
let lastTime = 0;
let dropTimer = 0;
let dropInterval = 800;
let linesCleared = 0;
let piecesPlaced = 0;
let paused = false;
let gameOver = false;

const shapeKeys = Object.keys(SHAPES);
const rotations = buildRotations();

function buildRotations() {
  const maps = {};
  for (const key of shapeKeys) {
    const initial = SHAPES[key].map(([x, y]) => ({ x, y }));
    const list = [initial];
    for (let i = 0; i < 3; i++) {
      const last = list[list.length - 1];
      list.push(last.map(({ x, y }) => ({ x: -y, y: x })));
    }
    maps[key] = list;
  }
  return maps;
}

function resetBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  linesCleared = 0;
  piecesPlaced = 0;
  dropInterval = 800;
  spawnPiece();
  gameOver = false;
  paused = false;
  updateStatus();
  updateStats();
}

function spawnPiece() {
  const shape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
  active = {
    shape,
    rotation: 0,
    x: 3,
    y: ROWS - 4,
  };

  if (collides(active)) {
    gameOver = true;
    paused = true;
    updateStatus('Game over – the tower hit the stars.');
  }
}

function collides(piece, offsetX = 0, offsetY = 0, rotateDelta = 0) {
  const rotationIndex = (piece.rotation + rotateDelta + 4) % 4;
  const cells = rotations[piece.shape][rotationIndex];

  return cells.some(({ x, y }) => {
    const boardX = piece.x + x + offsetX;
    const boardY = piece.y + y + offsetY;
    return (
      boardX < 0 ||
      boardX >= COLS ||
      boardY < 0 ||
      boardY >= ROWS ||
      board[boardY][boardX]
    );
  });
}

function lockPiece() {
  const cells = rotations[active.shape][active.rotation];
  cells.forEach(({ x, y }) => {
    const bx = active.x + x;
    const by = active.y + y;
    if (by >= 0 && by < ROWS) {
      board[by][bx] = COLORS[active.shape];
    }
  });
  piecesPlaced += 1;
  clearLines();
  spawnPiece();
  updateStats();
}

function clearLines() {
  let cleared = 0;
  for (let y = 0; y < ROWS; y++) {
    if (board[y].every(Boolean)) {
      board.splice(y, 1);
      board.push(Array(COLS).fill(null));
      cleared += 1;
      y -= 1;
    }
  }
  if (cleared > 0) {
    linesCleared += cleared;
    const level = getLevel();
    dropInterval = Math.max(140, 800 - (level - 1) * 60);
  }
}

function getLevel() {
  return 1 + Math.floor(linesCleared / 10);
}

function update(time = 0) {
  const delta = time - lastTime;
  lastTime = time;

  if (!paused && !gameOver) {
    dropTimer += delta;
    if (dropTimer > dropInterval) {
      dropTimer = 0;
      stepUp();
    }
  }

  draw();
  requestAnimationFrame(update);
}

function stepUp() {
  if (!collides(active, 0, -1)) {
    active.y -= 1;
  } else {
    lockPiece();
  }
}

function move(direction) {
  if (!collides(active, direction, 0)) {
    active.x += direction;
  }
}

function rotate() {
  const next = (active.rotation + 1) % 4;
  if (!collides(active, 0, 0, 1)) {
    active.rotation = next;
  }
}

function hardDrop() {
  let distance = 0;
  while (!collides(active, 0, -(distance + 1))) {
    distance += 1;
  }
  if (distance > 0) {
    active.y -= distance;
  }
  lockPiece();
}

function handleKey(event) {
  if (event.code === 'Space') {
    event.preventDefault();
  }
  if (paused && event.key.toLowerCase() !== 'p') return;
  if (gameOver) return;

  switch (event.key) {
    case 'ArrowLeft':
      move(-1);
      break;
    case 'ArrowRight':
      move(1);
      break;
    case 'ArrowUp':
      rotate();
      break;
    case 'ArrowDown':
      if (!collides(active, 0, -1)) {
        active.y -= 1;
        dropTimer = 0;
      }
      break;
    case ' ': // Spacebar
      hardDrop();
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
  }
}

function drawCell(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = board[y][x];
      if (cell) {
        drawCell(x, y, cell);
      }
    }
  }

  if (!gameOver) {
    const cells = rotations[active.shape][active.rotation];
    cells.forEach(({ x, y }) => {
      const drawX = active.x + x;
      const drawY = active.y + y;
      drawCell(drawX, drawY, COLORS[active.shape]);
    });
  }
}

function updateStats() {
  lineEl.textContent = linesCleared;
  levelEl.textContent = getLevel();
  pieceEl.textContent = piecesPlaced;
}

function updateStatus(message = '') {
  if (message) {
    statusEl.textContent = message;
    statusEl.classList.add('show');
  } else {
    statusEl.textContent = '';
    statusEl.classList.remove('show');
  }
}

function togglePause() {
  if (gameOver) return;
  paused = !paused;
  updateStatus(paused ? 'Paused' : '');
}

function restart() {
  resetBoard();
  dropTimer = 0;
  lastTime = 0;
  updateStatus('');
}

window.addEventListener('keydown', handleKey);
document.getElementById('restart').addEventListener('click', restart);
document.getElementById('pause').addEventListener('click', togglePause);

ctx.canvas.width = COLS * CELL;
ctx.canvas.height = ROWS * CELL;
resetBoard();
requestAnimationFrame(update);
