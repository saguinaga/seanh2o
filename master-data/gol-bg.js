/** Subtle Conway background for MDM case study — low opacity, respects reduced motion */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('golBg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const CELL = 10;
  let cols = 0;
  let rows = 0;
  let grid;
  let nextGrid;
  let lastTick = 0;
  const TICK_MS = 320;

  function idx(x, y) {
    return y * cols + x;
  }

  function seed() {
    grid = new Uint8Array(cols * rows);
    nextGrid = new Uint8Array(cols * rows);
    for (let i = 0; i < grid.length; i += 1) {
      grid[i] = Math.random() < 0.065 ? 1 : 0;
    }
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL);
    rows = Math.ceil(h / CELL);
    seed();
    draw();
  }

  function step() {
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            if (dx === 0 && dy === 0) continue;
            const cy = (y + dy + rows) % rows;
            const cx = (x + dx + cols) % cols;
            neighbors += grid[idx(cx, cy)];
          }
        }
        const alive = grid[idx(x, y)];
        nextGrid[idx(x, y)] = neighbors === 3 || (alive && (neighbors === 2 || neighbors === 3)) ? 1 : 0;
      }
    }
    const swap = grid;
    grid = nextGrid;
    nextGrid = swap;
  }

  function draw() {
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(103, 232, 249, 0.09)';
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (!grid[idx(x, y)]) continue;
        ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    ctx.strokeStyle = 'rgba(103, 232, 249, 0.025)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, h);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(w, y * CELL);
      ctx.stroke();
    }
  }

  function loop(ts) {
    if (ts - lastTick >= TICK_MS) {
      step();
      draw();
      lastTick = ts;
    }
    requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });
  requestAnimationFrame(loop);
})();
