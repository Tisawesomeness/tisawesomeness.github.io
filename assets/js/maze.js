// Inputs

const widthInput = document.getElementById('mazeWidth');
const widthValue = document.getElementById('widthValue');
const heightInput = document.getElementById('mazeHeight');
const heightValue = document.getElementById('heightValue');
const breachesInput = document.getElementById('breachesInput');
const breachesValue = document.getElementById('breachesValue');

const probNewestInput = document.getElementById('probNewest');
const probNewestValue = document.getElementById('probNewestValue');
const probRandomInput = document.getElementById('probRandom');
const probRandomValue = document.getElementById('probRandomValue');
const probOldestInput = document.getElementById('probOldest');
const probOldestValue = document.getElementById('probOldestValue');

const stepBtn = document.getElementById('stepMaze');
const runPauseBtn = document.getElementById('runPauseMaze');
const solveCheckbox = document.getElementById('solveCheckbox');
const animateCheckbox = document.getElementById('animateCheckbox');
const speedInput = document.getElementById('animationSpeed');
const speedValue = document.getElementById('speedValue');

let width = 10;
let height = 10;
let probNewest = 75;
let probOldest = 0;
let probRandom = 25;

let mazeState = 'not_started';

// Ensures probabilities are integers that sum to 100 after each change.
// Sliders are adjusted in right-to-left order.
function adjustProbabilities(event) {
  if (adjustProbabilities.isAdjusting) return;

  const targetSlider = event.target;
  const sliders = [
    { input: probNewestInput, value: parseInt(probNewestInput.value) || 0 },
    { input: probRandomInput, value: parseInt(probRandomInput.value) || 0 },
    { input: probOldestInput, value: parseInt(probOldestInput.value) || 0 }
  ];

  const total = sliders.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return;

  adjustProbabilities.isAdjusting = true; // prevent infinite loop

  const sliderMap = { probNewest: 0, probRandom: 1, probOldest: 2 };
  const adjustedIndex = sliderMap[targetSlider.id];
  sliders[adjustedIndex].value = parseInt(targetSlider.value) || 0;

  let diff = 100 - sliders.reduce((sum, s) => sum + s.value, 0);

  if (diff !== 0) {
    for (const index of [2, 1, 0]) {
      if (index === adjustedIndex) continue;

      if (diff > 0) {
        const increase = Math.min(100 - sliders[index].value, diff);
        sliders[index].value += increase;
        diff -= increase;
      } else {
        const decrease = Math.min(sliders[index].value, Math.abs(diff));
        sliders[index].value -= decrease;
        diff += decrease;
      }

      if (diff === 0) break;
    }
  }

  sliders.forEach(slider => {
    slider.input.value = Math.max(0, Math.min(100, slider.value));
  });

  const finalTotal = sliders.reduce((sum, s) => sum + s.value, 0);
  if (finalTotal !== 100) {
    const scale = 100 / finalTotal;
    probNewest = probNewestInput.value = Math.round(sliders[0].value * scale);
    probRandom = probRandomInput.value = Math.round(sliders[1].value * scale);
    probOldest = probOldestInput.value = 100 - parseInt(probNewestInput.value) - parseInt(probRandomInput.value);
  }

  probNewestValue.textContent = probNewestInput.value;
  probRandomValue.textContent = probRandomInput.value;
  probOldestValue.textContent = probOldestInput.value;

  setTimeout(() => { adjustProbabilities.isAdjusting = false; }, 0);
}

widthInput.addEventListener('input', () => { widthValue.textContent = widthInput.value; });
heightInput.addEventListener('input', () => { heightValue.textContent = heightInput.value; });
breachesInput.addEventListener('input', () => { breachesValue.textContent = breachesInput.value; });
probNewestInput.addEventListener('input', (e) => adjustProbabilities(e));
probRandomInput.addEventListener('input', (e) => adjustProbabilities(e));
probOldestInput.addEventListener('input', (e) => adjustProbabilities(e));
speedInput.addEventListener('input', () => { speedValue.textContent = speedInput.value; });

function disableInputs() {
  widthInput.disabled = true;
  heightInput.disabled = true;
  breachesInput.disabled = true;
  probNewestInput.disabled = true;
  probRandomInput.disabled = true;
  probOldestInput.disabled = true;
}

function enableInputs() {
  widthInput.disabled = false;
  heightInput.disabled = false;
  breachesInput.disabled = false;
  probNewestInput.disabled = false;
  probRandomInput.disabled = false;
  probOldestInput.disabled = false;
}

// Grid

const grid = document.getElementById('mazeGrid');
grid.classList.add('solve-hidden');

const colors = [
  '#e74c3c', '#2ecc71', '#3498db', '#f1c40f',
  '#9b59b6', '#e67e22', '#1abc9c', '#c43895',
  '#ffcdd2', '#c8e6c9', '#bbdefb', '#f7e58b',
  '#e1bee7', '#ffe0b2', '#b2dfdb', '#7f8c8d',
];
const directions = [
  { dx: 1, dy: 0, wallClass: 'wall-right', oppositeWallClass: 'wall-left' },   // right
  { dx: 0, dy: 1, wallClass: 'wall-bottom', oppositeWallClass: 'wall-top' },   // down
  { dx: -1, dy: 0, wallClass: 'wall-left', oppositeWallClass: 'wall-right' },  // left
  { dx: 0, dy: -1, wallClass: 'wall-top', oppositeWallClass: 'wall-bottom' }   // up
];

let targets = [];
let cells = [];
let regionFrontier = {};

// (0, 0) is top-left corner
// +X is right, +Y is down
function getCellAt(x, y) {
  return cells.find(c => parseInt(c.dataset.x) === x && parseInt(c.dataset.y) === y);
}

// Not started: Step, Run, and Reset are enabled (as long as there is at least one target cell)
// Running: Step is disabled, Run becomes Pause, Reset stops generation + resets
// Paused: Step and Run are both enabled
// Finished: Step is disabled, Run starts generating again with same inputs, inputs re-enabled
function updateButtonStates() {
  const hasTargets = targets.length > 0;

  if (mazeState === 'not_started' || mazeState === 'paused') {
    stepBtn.disabled = !hasTargets;
  } else if (mazeState === 'running') {
    stepBtn.disabled = true;
  } else if (mazeState === 'finished') {
    stepBtn.disabled = false;
  }

  if (mazeState === 'running') {
    runPauseBtn.textContent = 'Pause';
    runPauseBtn.disabled = false;
  } else if (mazeState === 'paused') {
    runPauseBtn.textContent = 'Run';
    runPauseBtn.disabled = false;
  } else if (mazeState === 'not_started') {
    runPauseBtn.textContent = 'Run';
    runPauseBtn.disabled = !hasTargets;
  } else if (mazeState === 'finished') {
    runPauseBtn.textContent = 'Run';
    runPauseBtn.disabled = false;
  }

  const hasWallBlock = wallBlockInput.value.trim().length > 0;
  exportMazeBtn.disabled = !(mazeState === 'finished' && hasWallBlock);

  exportOutput.readOnly = false;
  exportOutput.disabled = true;
  exportOutput.value = '';

  downloadButton.disabled = true;
}

// Resets the grid, leaving all target cells.
function reset() {
  mazeState = 'not_started';
  generationState = null;
  initializeGrid();
}

function initializeGrid() {
  width = Math.max(1, Math.min(100, parseInt(widthInput.value) || 1));
  height = Math.max(1, Math.min(100, parseInt(heightInput.value) || 1));

  widthInput.value = width;
  heightInput.value = height;

  grid.style.setProperty('--width', width);
  grid.innerHTML = '';
  cells = [];
  regionFrontier = {};

  targets = targets.filter(t => t.x >= 0 && t.x < width && t.y >= 0 && t.y < height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = document.createElement('div');
      cell.className = 'maze-cell wall-right wall-bottom wall-left wall-top';
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.dataset.discovered = 'false';
      cell.dataset.set = '-1';
      cell.addEventListener('click', () => clickCell(cell, x, y));

      // Tooltips on the top row must be flipped
      if (y === 0) {
        cell.classList.add('tooltip-top-row');
      }
      const tooltip = document.createElement('span');
      tooltip.className = 'maze-tooltip';
      tooltip.textContent = `(${x}, ${y})`;

      cell.appendChild(tooltip);
      grid.appendChild(cell);
      cells.push(cell);
    }
  }

  updateButtonStates();
  updateTargetDisplay();
  updateDimensions();
}

widthInput.addEventListener('change', reset);
heightInput.addEventListener('change', reset);

function clickCell(cell, x, y) {
  if (mazeState === 'not_started') {
    toggleTarget(cell, x, y);
  } else if (mazeState === 'finished') {
    reset();
    stepBtn.disabled = false;
    runPauseBtn.textContent = 'Run';
    runPauseBtn.disabled = false;
  }
}

function toggleTarget(cell, x, y) {
  const index = targets.findIndex(t => t.x === x && t.y === y);

  if (index >= 0) {
    targets.splice(index, 1);
    renumberTargets();
  } else {
    targets.push({
      x,
      y
    });
    updateCell(cell, targets.length - 1, true);
  }

  updateButtonStates();
}

// If targets [1, 2, 3, 4] and 2 removed, targets 3 and 4 should be renumbered to 2 and 3
function renumberTargets() {
  cells.forEach(cell => {
    cell.classList.remove('target');
    cell.style.background = '';
    cell.removeAttribute('data-number');
    if (cell.dataset.set !== '-1') {
      cell.dataset.set = '-1';
      cell.dataset.discovered = 'false';
      cell.classList.remove('discovered');
    }
  });

  targets.forEach((target, i) => {
    const cell = cells.find(c =>
      parseInt(c.dataset.x) === target.x &&
      parseInt(c.dataset.y) === target.y
    );
    if (cell) updateCell(cell, i, true);
  });
}

function updateTargetDisplay() {
  targets.forEach((target, i) => {
    const cell = cells.find(c =>
      parseInt(c.dataset.x) === target.x &&
      parseInt(c.dataset.y) === target.y
    );
    if (cell) updateCell(cell, i, true);
  });
}

function updateCell(cell, targetNum, isTarget) {
  if (isTarget) {
    cell.classList.add('target');
    const color = colors[targetNum % colors.length];
    cell.style.background = color;
    cell.setAttribute('data-number', targetNum + 1);
    cell.dataset.targetColor = color;
  } else {
    const targetColor = cell.dataset.targetColor || colors[targetNum % colors.length];
    cell.style.background = darkenColor(targetColor, 0.5);
  }
  cell.dataset.set = targetNum;
  cell.dataset.discovered = 'true';
  cell.classList.add('discovered');
}

function darkenColor(hex, factor) {
  const rgb = hexToRgb(hex);
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : {
    r: 0,
    g: 0,
    b: 0
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}

function getNeighbors(x, y) {
  const neighbors = [];
  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      neighbors.push({
        x: nx,
        y: ny,
        direction: dir,
        cellIndex: ny * width + nx
      });
    }
  }
  return neighbors;
}

function removeWall(fromCell, toCell, direction) {
  fromCell.classList.remove(direction.wallClass);
  toCell.classList.remove(direction.oppositeWallClass);
  fromCell.classList.remove('breach-' + direction.wallClass.replace('wall-', ''));
  toCell.classList.remove('breach-' + direction.oppositeWallClass.replace('wall-', ''));
}

// Region Generation

// For each target cell, expands each region by adding one random neighboring cell
function generateRegionsStep() {
  const undiscoveredCells = cells.filter(cell => cell.dataset.discovered === 'false');
  if (undiscoveredCells.length === 0) {
    return false;
  }

  // Iterate over each region in random order
  const setIndexes = Array.from({ length: targets.length }, (_, i) => i);
  for (let i = setIndexes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [setIndexes[i], setIndexes[j]] = [setIndexes[j], setIndexes[i]];
  }

  let madeProgress = false;
  for (const setIndex of setIndexes) {
    const walls = getWalls(setIndex, -1);

    if (walls.length > 0) {
      const wallIndex = Math.floor(Math.random() * walls.length);
      const wall = walls[wallIndex];

      wall.to.dataset.set = setIndex;
      wall.to.dataset.discovered = 'true';
      wall.to.dataset.targetColor = wall.from.dataset.targetColor;
      updateCell(wall.to, setIndex, false);
      madeProgress = true;
    }
  }

  return madeProgress;
}

function getWalls(cellSet, neighborSet) {
  const walls = [];
  cells.forEach(cell => {
    if (parseInt(cell.dataset.set) === cellSet) {
      const x = parseInt(cell.dataset.x);
      const y = parseInt(cell.dataset.y);
      const neighbors = getNeighbors(x, y);
      neighbors.forEach(neighbor => {
        const neighborCell = cells[neighbor.cellIndex];
        if (parseInt(neighborCell.dataset.set) === neighborSet) {
          walls.push({
            from: cell,
            to: neighborCell,
            direction: neighbor.direction
          });
        }
      });
    }
  });
  return walls;
}

// Maze Generation

// Generates a maze within each region using the Growing Tree algorithm
// https://weblog.jamisbuck.org/2011/1/27/maze-generation-growing-tree-algorithm
function generateRegionMazeStep(setIndex) {
  // Initialize C if this is the first call for this region
  if (!regionFrontier[setIndex]) {
    const regionCells = cells.filter(cell => parseInt(cell.dataset.set) === setIndex);
    if (regionCells.length === 0) return false;
    regionFrontier[setIndex] = [regionCells[Math.floor(Math.random() * regionCells.length)]];
  }

  const C = regionFrontier[setIndex];

  // Continue until C is empty
  if (C.length === 0) {
    return false;
  }

  // Choose a cell from C based on probabilities
  const cell = chooseCellFromC(C);

  // Find unvisited neighbors of this cell
  const unvisitedNeighbors = getUnvisitedNeighbors(cell);

  if (unvisitedNeighbors.length > 0) {
    // Carve passage to a random unvisited neighbor
    const neighbor = unvisitedNeighbors[Math.floor(Math.random() * unvisitedNeighbors.length)];
    const dir = neighbor.direction;
    const neighborCell = neighbor.cell;
    removeWall(cell, neighborCell, dir);

    // Add neighbor to C
    neighborCell.dataset.set = setIndex;
    neighborCell.dataset.discovered = 'true';
    neighborCell.dataset.targetColor = cell.dataset.targetColor;
    updateCellVisualization(neighborCell, setIndex, true);
    C.push(neighborCell);
  } else {
    // No unvisited neighbors, remove cell from C
    regionFrontier[setIndex] = C.filter(c => c !== cell);
    updateCellVisualization(cell, setIndex, false);
  }

  return true;
}

function chooseCellFromC(C) {
  const total = probNewest + probRandom + probOldest;
  const r = Math.random() * total;
  if (r < probNewest) {
    return C[C.length - 1]; // newest cell
  } else if (r < probNewest + probRandom) {
    const index = Math.floor(Math.random() * C.length);
    return C[index]; // random cell
  } else {
    return C[0]; // oldest cell
  }
}

function getUnvisitedNeighbors(cell) {
  const x = parseInt(cell.dataset.x);
  const y = parseInt(cell.dataset.y);
  const neighbors = [];

  for (const dir of directions) {
    const nx = x + dir.dx;
    const ny = y + dir.dy;

    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
      const neighborCell = cells[ny * width + nx];
      if (neighborCell && neighborCell.dataset.discovered === 'false') {
        neighbors.push({
          cell: neighborCell,
          direction: dir
        });
      }
    }
  }

  return neighbors;
}

function updateCellVisualization(cell, setIndex, inC) {
  const x = parseInt(cell.dataset.x);
  const y = parseInt(cell.dataset.y);
  const isTarget = parseInt(cell.dataset.x) === targets[setIndex].x &&
    parseInt(cell.dataset.y) === targets[setIndex].y;

  if (isTarget) {
    cell.classList.add('target');
    const color = colors[setIndex % colors.length];
    cell.style.background = color;
    cell.setAttribute('data-number', setIndex + 1);
    cell.dataset.targetColor = color;
    cell.dataset.discovered = 'true';
    cell.classList.add('discovered');
  } else if (inC) {
    const color = cell.dataset.targetColor || colors[setIndex % colors.length];
    cell.style.background = darkenColor(color, 0.2);
    cell.dataset.discovered = 'true';
    cell.classList.add('discovered');
  } else {
    const color = cell.dataset.targetColor || colors[setIndex % colors.length];
    cell.style.background = darkenColor(color, 0.5);
    cell.dataset.discovered = 'true';
    cell.classList.add('discovered');
  }

  cell.dataset.set = setIndex;
}

// Breaches

// For each pair of adjacent regions, randomly chooses the specified number of walls to remove from their border
function createBreaches() {
  const breaches = parseInt(breachesInput.value) || 1;
  if (breaches <= 0) return;

  const breachWalls = [];
  const processedPairs = new Set();

  cells.forEach(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = cells[ny * width + nx];
        const setA = parseInt(cell.dataset.set);
        const setB = parseInt(neighbor.dataset.set);

        if (setA !== setB) {
          // Create a unique key for this pair of sets
          const pairKey = `${Math.min(setA, setB)}-${Math.max(setA, setB)}`;

          if (!processedPairs.has(pairKey)) {
            processedPairs.add(pairKey);
            const walls = getWalls(setA, setB);

            const remainingWalls = [...walls];
            for (let i = 0; i < Math.min(breaches, walls.length); i++) {
              const wallIndex = Math.floor(Math.random() * remainingWalls.length);
              const wall = remainingWalls[wallIndex];
              breachWalls.push(wall);
              remainingWalls.splice(wallIndex, 1);
            }
          }
        }
      }
    }
  });

  return breachWalls;
}

// Solving

function findShortestPath(startX, startY, endX, endY) {
  if (startX === endX && startY === endY) return [];

  const visited = new Set();
  const queue = [{
    x: startX,
    y: startY,
    path: [],
    parent: null
  }];
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const { x, y, path } = queue.shift();
    
    if (x === endX && y === endY) return path;

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !visited.has(`${nx},${ny}`)) {
        const cell = cells[y * width + x];
        if (!cell.classList.contains(dir.wallClass)) {
          visited.add(`${nx},${ny}`);
          queue.push({
            x: nx,
            y: ny,
            path: [...path, dir],
            parent: { x, y, dir },
          });
        }
      }
    }
  }

  return null;
}

// Draws a white line along the shortest path
// from one region's target cell to another region's target cell
function drawPathBetweenRegions(setA, setB) {
  const targetA = cells.find(c =>
    parseInt(c.dataset.x) === targets[setA].x &&
    parseInt(c.dataset.y) === targets[setA].y
  );
  const targetB = cells.find(c =>
    parseInt(c.dataset.x) === targets[setB].x &&
    parseInt(c.dataset.y) === targets[setB].y
  );

  if (!targetA || !targetB) return;

  const startX = parseInt(targetA.dataset.x);
  const startY = parseInt(targetA.dataset.y);
  const endX = parseInt(targetB.dataset.x);
  const endY = parseInt(targetB.dataset.y);

  const path = findShortestPath(startX, startY, endX, endY);
  if (!path) return;

  const points = [];
  let currentX = startX;
  let currentY = startY;
  points.push(`${currentX + 0.5},${currentY + 0.5}`);

  path.forEach(dir => {
    currentX += dir.dx;
    currentY += dir.dy;
    points.push(`${currentX + 0.5},${currentY + 0.5}`);
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'path-line');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = '0';
  svg.style.width = '100%';
  svg.style.height = '100%';
  svg.style.zIndex = '10';
  svg.style.pointerEvents = 'none';

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', points.join(' '));
  polyline.setAttribute('stroke', 'white');
  polyline.setAttribute('stroke-width', '0.2');
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('opacity', '0.85');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  grid.appendChild(svg);
}

// Draws shortest paths between all adjacent regions
function drawRegionConnections() {
  document.querySelectorAll('.maze-grid .path-line').forEach(el => el.remove());

  const borderingPairs = new Set();
  cells.forEach(cell => {
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    const setA = parseInt(cell.dataset.set);

    if (setA < 0) return;

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const neighbor = cells[ny * width + nx];
        const setB = parseInt(neighbor.dataset.set);
        if (setB >= 0 && setA !== setB) {
          borderingPairs.add(`${Math.min(setA, setB)}-${Math.max(setA, setB)}`);
        }
      }
    }
  });

  borderingPairs.forEach(pairKey => {
    const [setA, setB] = pairKey.split('-').map(Number);
    drawPathBetweenRegions(setA, setB);
  });

  markTargetCells();
}

// Draw small white circles at each target cell
function markTargetCells() {
  const targetSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  targetSvg.setAttribute('class', 'path-line');
  targetSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  targetSvg.style.position = 'absolute';
  targetSvg.style.top = '0';
  targetSvg.style.left = '0';
  targetSvg.style.width = '100%';
  targetSvg.style.height = '100%';
  targetSvg.style.zIndex = '10';
  targetSvg.style.pointerEvents = 'none';

  targets.forEach(target => {
    const cell = cells.find(c =>
      parseInt(c.dataset.x) === target.x &&
      parseInt(c.dataset.y) === target.y
    );
    if (cell) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', target.x + 0.5);
      circle.setAttribute('cy', target.y + 0.5);
      circle.setAttribute('r', '0.3');
      circle.setAttribute('fill', 'white');
      targetSvg.appendChild(circle);
    }
  });

  grid.appendChild(targetSvg);
}

// Generation State

let generationState = null;

// Advance generation by one step and pause
async function stepGenerate() {
  if (mazeState === 'finished') return;
  if (mazeState === 'running') return;
  if (targets.length === 0) return;

  // If starting fresh, initialize generation
  if (mazeState === 'not_started' || mazeState === 'finished') {
    generationState = null;
    disableInputs();
    initializeGrid();

    generationState = {
      phase: 'regions',
      setIndex: 0,
      regionIndex: 0,
      breachWalls: [],
      breachStep: 0
    };
  }

  mazeState = 'running';
  updateButtonStates();

  const done = await generate();
  if (done) {
    // Remove breach walls (highlighted for visualization)
    for (const wall of generationState.breachWalls) {
      removeWall(wall.from, wall.to, wall.direction);
    }
    drawRegionConnections();

    mazeState = 'finished';
    enableInputs();
  } else {
    mazeState = 'paused';
  }

  updateButtonStates();
}

// Run generation continuously
async function loopGenerate() {
  // If starting fresh, initialize
  if (mazeState === 'running' && generationState === null) {
    disableInputs();
    initializeGrid();

    generationState = {
      phase: 'regions',
      setIndex: 0,
      regionIndex: 0,
      breachWalls: [],
      breachStep: 0
    };
  }

  while (mazeState === 'running') {
    const done = generate();
    if (done) break;
    if (animateCheckbox.checked) {
      if (generationState.phase === 'breaches') {
        await new Promise(resolve => setTimeout(resolve, getBreachDelay()));
      } else {
        await new Promise(resolve => setTimeout(resolve, getRegularDelay()));
      }
    }
  }

  if (mazeState !== 'running') return;

    // Remove breach walls (highlighted for visualization)
  for (const wall of generationState.breachWalls) {
    removeWall(wall.from, wall.to, wall.direction);
  }

  drawRegionConnections();

  mazeState = 'finished';
  enableInputs();
  updateButtonStates();
}

// Advances generation by one step and update generation state
function generate() {
  if (!generationState || mazeState !== 'running') return true;

  const state = generationState;

  if (state.phase === 'regions') {
    const progress = generateRegionsStep();
    if (!progress) {
      state.phase = 'maze';
      state.setIndex = 0;
    }
    return false;
  }

  if (state.phase === 'maze') {
    if (state.setIndex >= targets.length) {
      state.phase = 'breaches';
      state.breachWalls = createBreaches();
      state.breachStep = 0;
      return false;
    }

    const setIndex = state.setIndex;
    cells.forEach((cell) => {
      if (parseInt(cell.dataset.set) === setIndex) {
        cell.dataset.discovered = 'false';
        cell.classList.remove('discovered');
        const isTargetCell = parseInt(cell.dataset.x) === targets[setIndex].x &&
          parseInt(cell.dataset.y) === targets[setIndex].y;
        if (!isTargetCell) {
          cell.style.background = '';
        }
      }
    });
    regionFrontier[setIndex] = null;
    state.phase = 'regionMaze';
    state.regionIndex = setIndex;

    const progress = generateRegionMazeStep(setIndex);
    if (!progress) {
      state.setIndex++;
      state.phase = 'maze';
    }
    return false;
  }

  if (state.phase === 'regionMaze') {
    const setIndex = state.regionIndex;
    const progress = generateRegionMazeStep(setIndex);
    if (!progress) {
      state.setIndex = setIndex + 1;
      state.phase = 'maze';
    }
    return false;
  }

  if (state.phase === 'breaches') {
    if (state.breachStep >= state.breachWalls.length) {
      return true;
    }

    const wall = state.breachWalls[state.breachStep];
    wall.from.classList.add('breach-' + wall.direction.wallClass.replace('wall-', ''));
    wall.to.classList.add('breach-' + wall.direction.oppositeWallClass.replace('wall-', ''));
    state.breachStep++;
    return false;
  }

  return true;
}

async function toggleRunPause() {
  if (mazeState === 'not_started') {
    // Start fresh
    if (targets.length === 0) return;
    mazeState = 'running';
    updateButtonStates();
    await loopGenerate();
  } else if (mazeState === 'running') {
    // Pause
    mazeState = 'paused';
    updateButtonStates();
  } else if (mazeState === 'paused') {
    // Resume
    mazeState = 'running';
    updateButtonStates();
    await loopGenerate();
  } else {
    // Reset and start fresh
    mazeState = 'running';
    generationState = null;
    initializeGrid();
    updateButtonStates();
    await loopGenerate();
  }
}

function step() {
  if (mazeState === 'not_started' || mazeState === 'paused') {
    stepGenerate();
  } else if (mazeState === 'finished') {
    generationState = null;
    mazeState = 'not_started';
    updateButtonStates();
    stepGenerate();
  }
}

function getRegularDelay() {
  const delay = parseInt(speedInput.value);
  if (delay === 11) {
    return 1;
  }
  return 200 / (delay * delay);
}

function getBreachDelay() {
  const delay = parseInt(speedInput.value);
  if (delay === 11) {
    return 1;
  }
  return 1000 / delay;
}

stepBtn.addEventListener('click', step);
runPauseBtn.addEventListener('click', toggleRunPause);
solveCheckbox.addEventListener('change', () => {
  grid.classList.toggle('solve-hidden', !solveCheckbox.checked);
});

const resetBtn = document.getElementById('resetMaze');
resetBtn.addEventListener('click', () => {
  targets = [];
  reset();
});

// Minecraft Export

const dimensionsText = document.getElementById('dimensionsText');
const pathWidthInput = document.getElementById('pathWidth');
const pathWidthValue = document.getElementById('pathWidthValue');
const wallWidthInput = document.getElementById('wallWidth');
const wallWidthValue = document.getElementById('wallWidthValue');
const wallHeightInput = document.getElementById('wallHeight');
const wallHeightValue = document.getElementById('wallHeightValue');
const wallBlockInput = document.getElementById('wallBlock');

const exportMazeBtn = document.getElementById('exportMaze');
const replaceCheckbox = document.getElementById('replaceCheckbox');
const exportOutput = document.getElementById('exportOutput');
const downloadButton = document.getElementById('downloadButton');

function updateDimensions() {
  pathWidthValue.textContent = pathWidthInput.value;
  wallWidthValue.textContent = wallWidthInput.value;
  wallHeightValue.textContent = wallHeightInput.value;

  const pathWidth = parseInt(pathWidthInput.value) || 1;
  const wallWidth = parseInt(wallWidthInput.value) || 1;

  const totalWidth = width * pathWidth + (width + 1) * wallWidth;
  const totalHeight = height * pathWidth + (height + 1) * wallWidth;

  dimensionsText.textContent = `Dimensions: ${totalWidth} x ${totalHeight} blocks`;
}

pathWidthInput.addEventListener('input', updateDimensions);
wallWidthInput.addEventListener('input', updateDimensions);
wallHeightInput.addEventListener('input', updateDimensions);
wallBlockInput.addEventListener('input', updateButtonStates);

function exportMaze() {
  const pathWidth = parseInt(pathWidthInput.value) || 1;
  const wallWidth = parseInt(wallWidthInput.value) || 1;
  const wallHeight = parseInt(wallHeightInput.value) || 1;
  const wallBlock = wallBlockInput.value.trim();
  const replace = replaceCheckbox.checked;

  const totalWidth = width * pathWidth + (width + 1) * wallWidth;
  const totalHeight = height * pathWidth + (height + 1) * wallWidth;

  // Step 1: Create the export grid (2D array of 'X' for wall, 'O' for path)
  const grid = Array.from({ length: totalHeight }, () => 
    Array(totalWidth).fill('X')
  );

  // Mark path areas and removed walls
  for (let cellY = 0; cellY < height; cellY++) {
    for (let cellX = 0; cellX < width; cellX++) {
      const cell = cells[cellY * width + cellX];

      // Calculate cell's path area in export grid
      const pathStartX = cellX * (pathWidth + wallWidth) + wallWidth;
      const pathStartY = cellY * (pathWidth + wallWidth) + wallWidth;
      const pathEndX = pathStartX + pathWidth;
      const pathEndY = pathStartY + pathWidth;

      // Fill the cell's path area with 'O'
      for (let y = pathStartY; y < pathEndY; y++) {
        for (let x = pathStartX; x < pathEndX; x++) {
          grid[y][x] = 'O';
        }
      }

      // Check and mark removed left wall as path (shared with cell to the left)
      if (!cell.classList.contains('wall-left') && cellX > 0) {
        const wallStartX = cellX * (pathWidth + wallWidth);
        const wallStartY = cellY * (pathWidth + wallWidth) + wallWidth;
        const wallEndX = wallStartX + wallWidth;
        const wallEndY = wallStartY + pathWidth;

        for (let y = wallStartY; y < wallEndY; y++) {
          for (let x = wallStartX; x < wallEndX; x++) {
            grid[y][x] = 'O';
          }
        }
      }

      // Check and mark removed top wall as path (shared with cell above)
      if (!cell.classList.contains('wall-top') && cellY > 0) {
        const wallStartX = cellX * (pathWidth + wallWidth) + wallWidth;
        const wallStartY = cellY * (pathWidth + wallWidth);
        const wallEndX = wallStartX + pathWidth;
        const wallEndY = wallStartY + wallWidth;

        for (let y = wallStartY; y < wallEndY; y++) {
          for (let x = wallStartX; x < wallEndX; x++) {
            grid[y][x] = 'O';
          }
        }
      }

      // Check and mark removed right wall as path (exterior boundary)
      if (!cell.classList.contains('wall-right') && cellX === width - 1) {
        const wallStartX = (cellX + 1) * (pathWidth + wallWidth);
        const wallStartY = cellY * (pathWidth + wallWidth) + wallWidth;
        const wallEndX = wallStartX + wallWidth;
        const wallEndY = wallStartY + pathWidth;

        for (let y = wallStartY; y < wallEndY; y++) {
          for (let x = wallStartX; x < wallEndX; x++) {
            grid[y][x] = 'O';
          }
        }
      }

      // Check and mark removed bottom wall as path (exterior boundary)
      if (!cell.classList.contains('wall-bottom') && cellY === height - 1) {
        const wallStartX = cellX * (pathWidth + wallWidth) + wallWidth;
        const wallStartY = (cellY + 1) * (pathWidth + wallWidth);
        const wallEndX = wallStartX + pathWidth;
        const wallEndY = wallStartY + wallWidth;

        for (let y = wallStartY; y < wallEndY; y++) {
          for (let x = wallStartX; x < wallEndX; x++) {
            grid[y][x] = 'O';
          }
        }
      }
    }
  }

  // Step 2: Generate fill commands by greedily filling as much as possible
  const commands = ["# Enter spectator mode, then run this function at the northwest corner of the maze, at the bottom of the wall"];
  const visited = Array.from({ length: totalHeight }, () => 
    Array(totalWidth).fill(false)
  );

  for (let row = 0; row < totalHeight; row++) {
    for (let col = 0; col < totalWidth; col++) {
      if (visited[row][col]) continue;

      const currentChar = grid[row][col];
      // Skip path blocks when replace is off
      if (currentChar === 'O' && !replace) {
        continue;
      }

      // Look right until different char or edge or visited
      let rightCount = 0;
      while (col + rightCount < totalWidth &&
        grid[row][col + rightCount] === currentChar &&
        !visited[row][col + rightCount]) {
        rightCount++;
      }

      // Look down until different char or edge or visited
      let downCount = 0;
      while (row + downCount < totalHeight &&
        grid[row + downCount][col] === currentChar &&
        !visited[row + downCount][col]) {
        downCount++;
      }

      let x1, x2, z1, z2;
      if (rightCount >= downCount) {
        // Horizontal rectangle: from (row, col) to (row, col+rightCount-1)
        // Mark cells as visited
        for (let c = col; c < col + rightCount; c++) {
          visited[row][c] = true;
        }
        x1 = col;
        x2 = col + rightCount - 1;
        z1 = row;
        z2 = row;
      } else {
        // Vertical rectangle: from (row, col) to (row+downCount-1, col)
        // Mark cells as visited
        for (let r = row; r < row + downCount; r++) {
          visited[r][col] = true;
        }
        x1 = col;
        x2 = col;
        z1 = row;
        z2 = row + downCount - 1;
      }

      // Build fill command
      const block = currentChar === 'X' ? wallBlock : "minecraft:air";
      const keepFlag = replace ? "" : "keep";
      let command = `fill ~${x1} ~0 ~${z1} ~${x2} ~${wallHeight - 1} ~${z2} ${block}`;
      if (keepFlag) {
        command += ` ${keepFlag}`;
      }
      commands.push(command);
    }
  }

  // Set export output
  exportOutput.value = commands.join('\n');
  exportOutput.disabled = false;
  exportOutput.readOnly = true;
  downloadButton.disabled = commands.length === 0;
}

exportMazeBtn.addEventListener('click', exportMaze);

function download() {
  const text = exportOutput.value;
  const blob = new Blob([text], {
    type: 'text/plain'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'maze.mcfunction';
  a.click();
  URL.revokeObjectURL(url);
}

downloadButton.addEventListener('click', download);

initializeGrid();