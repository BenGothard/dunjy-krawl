#!/usr/bin/env bash
#
# setup.sh — Scaffold a minimal web-based “Dunjy Krawl” game
# All defaults and commit messages reference BenGothard

# 1. Create index.html with a <canvas> and links
cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Dunjy Krawl</title>
  <meta name="author" content="Ben Gothard" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <canvas id="gameCanvas" width="800" height="600"></canvas>
  <script src="main.js"></script>
</body>
</html>
EOF

# 2. Create style.css for basic styling
cat > style.css << 'EOF'
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  background: #111;
  color: #fff;
  font-family: sans-serif;
}
canvas {
  display: block;
  margin: 20px auto;
  background: #222;
  border: 2px solid #555;
}
EOF

# 3. Create main.js with placeholder game loop and comments
cat > main.js << 'EOF'
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

// TODO: Procedural dungeon generation for Dunjy Krawl
function generateDungeon() {
  initDungeon();
  // e.g., carve out rooms and corridors
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
  player = { x: 2, y: 2, hp: 3 };
  enemies = [
    { x: COLS - 3, y: ROWS - 3 },
    { x: COLS - 5, y: ROWS - 5 }
  ];
  gameLoop();
}

init();
EOF

# 4. Create a simple .gitignore
cat > .gitignore << 'EOF'
# Ignore macOS files
.DS_Store

# Ignore node_modules (if added later)
node_modules/
EOF

# 5. Initialize npm project and install Jest
npm init -y
npm install --save-dev jest

# 6. Initialize Git and commit
git init
git add .
git commit -m "Initial scaffold for Dunjy Krawl by BenGothard (index.html, style.css, main.js, .gitignore)"

echo "✔︎ Scaffold created. Run 'git remote add origin https://github.com/BenGothard/dunjy-krawl.git' and 'git push -u origin main'."
