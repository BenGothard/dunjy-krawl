// main.js — Entry point for Dunjy Krawl by Ben Gothard

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensions
const TILE_SIZE = 32;
const COLS = Math.floor(canvas.width / TILE_SIZE);
const ROWS = Math.floor(canvas.height / TILE_SIZE);

// Game state placeholders
let dungeon = [];
let player = { x: 1, y: 1, hp: 3 };
let enemies = [];

// Initialize dungeon array (all walls for now)
function initDungeon() {
  dungeon = new Array(ROWS)
    .fill(0)
    .map(() => new Array(COLS).fill(1)); // 1 = wall, 0 = floor
}

// ----- Dungeon Generation -----
// Utility to get a random integer in [min, max]
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Carve a rectangular room in the dungeon array
function carveRoom(x, y, w, h) {
  for (let ry = y; ry < y + h; ry++) {
    for (let rx = x; rx < x + w; rx++) {
      dungeon[ry][rx] = 0;
    }
  }
}

// Connect two room centers with a corridor (horizontal then vertical)
function carveCorridor(x1, y1, x2, y2) {
  for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
    dungeon[y1][x] = 0;
  }
  for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
    dungeon[y][x2] = 0;
  }
}

// Procedurally generate rooms and corridors
function generateDungeon() {
  initDungeon();

  const rooms = [];
  const maxRooms = 8;
  const minSize = 4;
  const maxSize = 8;

  for (let i = 0; i < maxRooms; i++) {
    const w = randInt(minSize, maxSize);
    const h = randInt(minSize, maxSize);
    const x = randInt(1, COLS - w - 1);
    const y = randInt(1, ROWS - h - 1);
    const newRoom = { x, y, w, h };

    // check for overlap
    let failed = false;
    for (const r of rooms) {
      if (
        x <= r.x + r.w &&
        x + w >= r.x &&
        y <= r.y + r.h &&
        y + h >= r.y
      ) {
        failed = true;
        break;
      }
    }
    if (failed) continue;

    carveRoom(x, y, w, h);
    const center = {
      x: Math.floor(x + w / 2),
      y: Math.floor(y + h / 2)
    };

    if (rooms.length > 0) {
      const prev = rooms[rooms.length - 1];
      const prevCenter = {
        x: Math.floor(prev.x + prev.w / 2),
        y: Math.floor(prev.y + prev.h / 2)
      };
      carveCorridor(prevCenter.x, prevCenter.y, center.x, center.y);
    }

    rooms.push(newRoom);
  }

  // Place player in the first room
  if (rooms.length) {
    const first = rooms[0];
    player = {
      x: Math.floor(first.x + first.w / 2),
      y: Math.floor(first.y + first.h / 2),
      hp: 3
    };
  }

  // Place two enemies in the last rooms (or random positions)
  enemies = [];
  if (rooms.length >= 2) {
    const last = rooms[rooms.length - 1];
    enemies.push({
      x: Math.floor(last.x + last.w / 2),
      y: Math.floor(last.y + last.h / 2)
    });
  }
  if (rooms.length >= 3) {
    const last2 = rooms[rooms.length - 2];
    enemies.push({
      x: Math.floor(last2.x + last2.w / 2),
      y: Math.floor(last2.y + last2.h / 2)
    });
  }
  while (enemies.length < 2) {
    enemies.push({ x: COLS - 3, y: ROWS - 3 });
  }
}

// Draw dungeon + player + enemies + HUD
function render() {
  // Clear the canvas
  ctx.fillStyle = '#222';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw each tile
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (dungeon[row][col] === 1) {
        ctx.fillStyle = '#444'; // wall
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      } else {
        ctx.fillStyle = '#111'; // floor
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  // Draw player as a green square
  ctx.fillStyle = '#0f0';
  ctx.fillRect(
    player.x * TILE_SIZE + 2,
    player.y * TILE_SIZE + 2,
    TILE_SIZE - 4,
    TILE_SIZE - 4
  );

  // Draw enemies as red squares
  ctx.fillStyle = '#f00';
  enemies.forEach((e) => {
    ctx.fillRect(
      e.x * TILE_SIZE + 2,
      e.y * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4
    );
  });

  // Draw HUD: Player HP
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('HP: ' + player.hp, 10, 20);
}

// Basic input handling
let keysDown = {};
window.addEventListener(
  'keydown',
  (e) => {
    keysDown[e.key] = true;
  },
  false
);
window.addEventListener(
  'keyup',
  (e) => {
    delete keysDown[e.key];
  },
  false
);

// Move player if no wall ahead
function updatePlayer() {
  let newX = player.x;
  let newY = player.y;

  if (keysDown['ArrowUp'] || keysDown['w']) newY--;
  if (keysDown['ArrowDown'] || keysDown['s']) newY++;
  if (keysDown['ArrowLeft'] || keysDown['a']) newX--;
  if (keysDown['ArrowRight'] || keysDown['d']) newX++;

  if (
    newX >= 0 &&
    newX < COLS &&
    newY >= 0 &&
    newY < ROWS &&
    dungeon[newY][newX] === 0
  ) {
    player.x = newX;
    player.y = newY;
  }
}

// Simple enemy AI (random movement)
function updateEnemies() {
  enemies.forEach((e) => {
    const dir = Math.floor(Math.random() * 4);
    let nx = e.x;
    let ny = e.y;
    if (dir === 0) ny--;
    if (dir === 1) ny++;
    if (dir === 2) nx--;
    if (dir === 3) nx++;
    if (
      nx >= 0 &&
      nx < COLS &&
      ny >= 0 &&
      ny < ROWS &&
      dungeon[ny][nx] === 0
    ) {
      e.x = nx;
      e.y = ny;
    }
  });
}

// Check collisions: if player and enemy share a tile
function checkCollisions() {
  enemies.forEach((e) => {
    if (e.x === player.x && e.y === player.y) {
      console.log('Game Over');
      // Stop the game loop by not requesting another frame
      gameRunning = false;
    }
  });
}

let gameRunning = true;

// Main game loop
function gameLoop() {
  if (!gameRunning) return;
  updatePlayer();
  updateEnemies();
  checkCollisions();
  render();
  requestAnimationFrame(gameLoop);
}

// Entry point
function init() {
  generateDungeon();
  gameLoop();
}

init();
