// main.js — Entry point for Dunjy Krawl by Ben Gothard

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Dimensions
const TILE_SIZE = 32;
const COLS = Math.floor(canvas.width / TILE_SIZE);
const ROWS = Math.floor(canvas.height / TILE_SIZE);

// Game state placeholders
let dungeon = [];
let player = { x: 1, y: 1, hp: 3, dir: { x: 0, y: 1 } };
let enemies = [];
let projectiles = [];
let arrowCount = 10;
let level = 1;
let difficulty = 1;
const MAX_LEVEL = 3;
let gameState = 'start';
let mouseTile = { x: 0, y: 0 };

// Movement timing (in ms) to slow things down
const PLAYER_MOVE_DELAY = 150;
const ENEMY_MOVE_DELAY = 400;
const PROJECTILE_MOVE_DELAY = 100;
let lastPlayerMove = 0;
let lastEnemyMove = 0;
let lastProjectileMove = 0;

// Visual effect for weapon swings
let swingEffect = { x: 0, y: 0, timer: 0 };

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
function generateDungeon(currentLevel = 1) {
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
      hp: 3,
      dir: { x: 0, y: 1 }
    };
  }

  // Place enemies in the other rooms or random positions
  enemies = [];
  const enemyCount = 2 + currentLevel + (difficulty - 1);
  for (let i = 1; i < rooms.length && enemies.length < enemyCount; i++) {
    const r = rooms[i];
    enemies.push({
      x: Math.floor(r.x + r.w / 2),
      y: Math.floor(r.y + r.h / 2)
    });
  }
  while (enemies.length < enemyCount) {
    enemies.push({ x: COLS - 3, y: ROWS - 3 });
  }
  projectiles = [];
}

// ----- Rendering helpers -----
function drawPlayerSprite(p) {
  const x = p.x * TILE_SIZE;
  const y = p.y * TILE_SIZE;

  // head
  ctx.fillStyle = '#ffe0bd';
  ctx.beginPath();
  ctx.arc(x + TILE_SIZE / 2, y + 8, 6, 0, Math.PI * 2);
  ctx.fill();

  // body
  ctx.fillStyle = '#09f';
  ctx.fillRect(x + TILE_SIZE / 2 - 6, y + 14, 12, 14);

  // legs
  ctx.fillRect(x + TILE_SIZE / 2 - 6, y + 28, 4, 8);
  ctx.fillRect(x + TILE_SIZE / 2 + 2, y + 28, 4, 8);
}

function drawEnemySprite(e) {
  const x = e.x * TILE_SIZE;
  const y = e.y * TILE_SIZE;

  // head with horns
  ctx.fillStyle = '#b00';
  ctx.beginPath();
  ctx.arc(x + TILE_SIZE / 2, y + 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ccc';
  ctx.fillRect(x + 6, y + 2, 4, 4);
  ctx.fillRect(x + TILE_SIZE - 10, y + 2, 4, 4);

  // body
  ctx.fillStyle = '#d22';
  ctx.fillRect(x + TILE_SIZE / 2 - 8, y + 14, 16, 16);

  // legs
  ctx.fillRect(x + TILE_SIZE / 2 - 8, y + 30, 6, 6);
  ctx.fillRect(x + TILE_SIZE / 2 + 2, y + 30, 6, 6);
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

  // Draw player and enemies with simple sprites
  drawPlayerSprite(player);
  enemies.forEach((e) => {
    drawEnemySprite(e);
  });

  // Draw arrows as small yellow lines
  ctx.strokeStyle = '#ff0';
  ctx.lineWidth = 4;
  projectiles.forEach((p) => {
    const cx = p.x * TILE_SIZE + TILE_SIZE / 2;
    const cy = p.y * TILE_SIZE + TILE_SIZE / 2;
    ctx.beginPath();
    ctx.moveTo(cx - p.dx * TILE_SIZE / 4, cy - p.dy * TILE_SIZE / 4);
    ctx.lineTo(cx + p.dx * TILE_SIZE / 4, cy + p.dy * TILE_SIZE / 4);
    ctx.stroke();
  });

  // Draw weapon swing effect
  if (swingEffect.timer > 0) {
    ctx.fillStyle = '#880';
    ctx.fillRect(
      swingEffect.x * TILE_SIZE + 2,
      swingEffect.y * TILE_SIZE + 2,
      TILE_SIZE - 4,
      TILE_SIZE - 4
    );
    swingEffect.timer--;
  }

  // Draw HUD: Player HP
  ctx.fillStyle = '#fff';
  ctx.font = '16px sans-serif';
  ctx.fillText('HP: ' + player.hp + '  Arrows: ' + arrowCount +
    '  Level: ' + level + '  Difficulty: ' + difficulty, 10, 20);
}

// Basic input handling
let keysDown = {};
window.addEventListener(
  'keydown',
  (e) => {
    if (gameState === 'start' && e.key === 'Enter') {
      startGame();
      return;
    }
    if (gameState === 'gameover' && e.key.toLowerCase() === 'r') {
      gameState = 'start';
      return;
    }
    if (gameState !== 'running') return;

    keysDown[e.key] = true;
    if (e.code === 'Space') {
      swingWeapon();
    }
    if (e.key === 'f') {
      shootArrow();
    }
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

// Track mouse position relative to the canvas
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  mouseTile.x = Math.floor(mx / TILE_SIZE);
  mouseTile.y = Math.floor(my / TILE_SIZE);
});

// Move player if no wall ahead
function updatePlayer() {
  if (performance.now() - lastPlayerMove < PLAYER_MOVE_DELAY) return;
  lastPlayerMove = performance.now();

  let newX = player.x;
  let newY = player.y;

  if (keysDown['ArrowUp'] || keysDown['w']) {
    newY--;
    player.dir = { x: 0, y: -1 };
  }
  if (keysDown['ArrowDown'] || keysDown['s']) {
    newY++;
    player.dir = { x: 0, y: 1 };
  }
  if (keysDown['ArrowLeft'] || keysDown['a']) {
    newX--;
    player.dir = { x: -1, y: 0 };
  }
  if (keysDown['ArrowRight'] || keysDown['d']) {
    newX++;
    player.dir = { x: 1, y: 0 };
  }

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
  if (performance.now() - lastEnemyMove < ENEMY_MOVE_DELAY) return;
  lastEnemyMove = performance.now();
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

// Arrow projectile handling
function shootArrow() {
  if (arrowCount <= 0) return;
  const dx = Math.sign(mouseTile.x - player.x);
  const dy = Math.sign(mouseTile.y - player.y);
  if (dx === 0 && dy === 0) return;
  projectiles.push({ x: player.x + dx, y: player.y + dy, dx, dy });
  arrowCount--;
}

function swingWeapon() {
  const tx = player.x + player.dir.x;
  const ty = player.y + player.dir.y;
  enemies = enemies.filter((e) => !(e.x === tx && e.y === ty));
  swingEffect = { x: tx, y: ty, timer: 6 };
}

function updateProjectiles() {
  if (performance.now() - lastProjectileMove < PROJECTILE_MOVE_DELAY) return;
  lastProjectileMove = performance.now();
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    p.x += p.dx;
    p.y += p.dy;
    if (
      p.x < 0 ||
      p.x >= COLS ||
      p.y < 0 ||
      p.y >= ROWS ||
      dungeon[p.y][p.x] === 1
    ) {
      projectiles.splice(i, 1);
      continue;
    }
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (enemies[j].x === p.x && enemies[j].y === p.y) {
        enemies.splice(j, 1);
        projectiles.splice(i, 1);
        break;
      }
    }
  }
}

// Check collisions: if player and enemy share a tile
function checkCollisions() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (e.x === player.x && e.y === player.y) {
      player.hp--;
      enemies.splice(i, 1);
      if (player.hp <= 0) {
        gameState = 'gameover';
      }
    }
  }
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2 - 20);
  ctx.font = '20px sans-serif';
  ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
}

function drawStartScreen() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Dunjy Krawl: Epic Quest',
    canvas.width / 2,
    canvas.height / 2 - 50
  );
  ctx.font = '24px sans-serif';
  ctx.fillText(
    'An Epic Adventure Awaits',
    canvas.width / 2,
    canvas.height / 2 - 10
  );
  ctx.font = '20px sans-serif';
  ctx.fillText('Press Enter to begin', canvas.width / 2, canvas.height / 2 + 40);
}


function initLevel() {
  arrowCount = 10;
  generateDungeon(level);
}

function startGame() {
  level = 1;
  gameState = 'running';
  initLevel();
}

function nextLevel() {
  level++;
  if (level > MAX_LEVEL) {
    difficulty++;
    gameState = 'start';
  } else {
    initLevel();
  }
}

function checkLevelComplete() {
  if (gameState === 'running' && enemies.length === 0) {
    nextLevel();
  }
}

// Main game loop
// Update all game entities
function update() {
  updatePlayer();
  updateEnemies();
  updateProjectiles();
  checkCollisions();
  checkLevelComplete();
}

// Main game loop
function gameLoop() {
  render();
  if (gameState === 'start') {
    drawStartScreen();
  } else if (gameState === 'running') {
    update();
  } else if (gameState === 'gameover') {
    drawGameOver();
  }
  requestAnimationFrame(gameLoop);
}

// Entry point
function init() {
  gameState = 'start';
  gameLoop();
}

init();
