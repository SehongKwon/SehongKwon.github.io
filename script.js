document.documentElement.dataset.ready = "true";

const qs = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const saveBest = (key, score) => { const best = Math.max(score, Number(localStorage.getItem(key) || 0)); localStorage.setItem(key, String(best)); return best; };
const difficulty = () => qs("#difficulty-select")?.value === "high" ? 2 : 1;

function bindButton(id, handler) { const button = qs(id); if (button) button.addEventListener("click", handler); }

function wormGame() {
  const canvas = qs("#game-canvas"); if (!canvas) return;
  const ctx = canvas.getContext("2d"), size = 20, cell = canvas.width / size;
  const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  let snake, food, enemies, direction, queued, score = 0, best = Number(localStorage.getItem("worm-best") || 0), timer = null, running = false, paused = false, over = false;
  const same = (a, b) => a.x === b.x && a.y === b.y;
  const random = () => ({ x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) });
  const occupied = (p) => snake.some((part) => same(part, p)) || enemies.some((enemy) => same(enemy, p)) || same(food, p);
  const free = () => { let p; do p = random(); while (occupied(p)); return p; };
  function hud() { qs("#score").textContent = score; qs("#best-score").textContent = best; qs("#game-status").textContent = over ? `GAME OVER · ${score}` : paused ? "PAUSED" : running ? "RUNNING" : "READY"; qs("#pause-game").disabled = !running; qs("#pause-game").textContent = paused ? "RESUME" : "PAUSE"; }
  function reset() { snake = [{ x: 10, y: 10 }]; direction = directions.right; queued = direction; score = 0; over = paused = false; food = random(); enemies = []; while (enemies.length < Math.floor(Math.random() * 10) * difficulty()) { const p = random(); if (!occupied(p)) enemies.push({ ...p, cooldown: 1 + Math.floor(Math.random() * 3 * difficulty()) }); } hud(); draw(); }
  function drawPart(p, color, head = false) { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(p.x * cell + 2, p.y * cell + 2, cell - 4, cell - 4, cell * .25); ctx.fill(); if (head) { ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(p.x * cell + cell * .38, p.y * cell + cell * .38, 2, 0, 7); ctx.arc(p.x * cell + cell * .62, p.y * cell + cell * .38, 2, 0, 7); ctx.fill(); } }
  function draw() { ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.strokeStyle = "#161616"; for (let i = 0; i <= size; i++) { ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, canvas.height); ctx.moveTo(0, i * cell); ctx.lineTo(canvas.width, i * cell); ctx.stroke(); } drawPart(food, "#e22718"); enemies.forEach((enemy) => drawPart(enemy, "#0066b1")); snake.forEach((part, i) => drawPart(part, i ? "#bbbbbb" : "#fff", !i)); }
  function moveEnemies() { enemies = enemies.map((enemy) => { if (enemy.cooldown-- > 0) return enemy; const options = Object.values(directions).sort(() => Math.random() - .5); const option = options.find(([x, y]) => enemy.x + x >= 0 && enemy.x + x < size && enemy.y + y >= 0 && enemy.y + y < size) || [0, 0]; return { x: enemy.x + option[0], y: enemy.y + option[1], cooldown: 1 + Math.floor(Math.random() * 3 * difficulty()) }; }); }
  function end() { running = false; over = true; clearInterval(timer); timer = null; best = saveBest("worm-best", score); hud(); draw(); }
  function tick() { if (!running || paused) return; direction = queued; const head = { x: snake[0].x + direction[0], y: snake[0].y + direction[1] }; if (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size || snake.some((part) => same(part, head)) || enemies.some((enemy) => same(enemy, head))) return end(); snake.unshift(head); if (same(head, food)) food = free(); else snake.pop(); score += snake.length * 100; moveEnemies(); draw(); hud(); }
  function start() { if (running) return; if (over) reset(); running = true; hud(); clearInterval(timer); timer = setInterval(tick, 140); }
  function pause() { if (running) { paused = !paused; hud(); } }
  function turn(name) { const next = directions[name]; if (next && next[0] + direction[0] !== 0 && next[1] + direction[1] !== 0) queued = next; }
  bindButton("#start-game", start); bindButton("#pause-game", pause); bindButton("#restart-game", () => { clearInterval(timer); running = false; reset(); start(); });
  document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => turn(button.dataset.direction)));
  document.addEventListener("keydown", (event) => { const map = { ArrowUp: "up", w: "up", W: "up", k: "up", K: "up", ArrowDown: "down", s: "down", S: "down", j: "down", J: "down", ArrowLeft: "left", a: "left", A: "left", h: "left", H: "left", ArrowRight: "right", d: "right", D: "right", l: "right", L: "right" }; if (map[event.key]) { event.preventDefault(); turn(map[event.key]); } if (event.key.toLowerCase() === "p") pause(); });
  reset();
}

function flappyGame() {
  const canvas = qs("#flappy-canvas"); if (!canvas) return; const ctx = canvas.getContext("2d");
  let bird, pipes, started = false, paused = false, over = false, score = 0, best = Number(localStorage.getItem("flappy-best") || 0), timer = null, startedAt = 0;
  function hud() { qs("#flappy-score").textContent = score; qs("#flappy-best").textContent = best; qs("#flappy-status").textContent = over ? `GAME OVER · ${score}` : paused ? "PAUSED" : started ? "RUNNING" : "READY"; qs("#flappy-pause").disabled = !started; }
  function reset() { bird = { x: 90, y: 160, velocity: 0 }; pipes = []; score = 0; started = paused = over = false; draw(); hud(); }
  function addPipe(x) { const gap = 105, top = 30 + Math.random() * 150; pipes.push({ x, top, gap }); }
  function draw() { ctx.fillStyle = "#06121e"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = "#0066b1"; pipes.forEach((p) => { ctx.fillRect(p.x, 0, 34, p.top); ctx.fillRect(p.x, p.top + p.gap, 34, canvas.height); }); ctx.fillStyle = "#e22718"; ctx.beginPath(); ctx.arc(bird.x, bird.y, 14, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillRect(bird.x + 7, bird.y - 5, 5, 5); }
  function end() { started = false; over = true; clearInterval(timer); timer = null; best = saveBest("flappy-best", score); hud(); draw(); }
  function flap() { if (!started) { if (over) reset(); started = true; startedAt = Date.now(); addPipe(canvas.width); clearInterval(timer); timer = setInterval(tick, 30); } bird.velocity = -5.5; hud(); }
  function tick() { if (!started || paused) return; const high = difficulty(); bird.velocity += .28 * high; bird.y += bird.velocity; pipes.forEach((p) => { p.x -= 2 * high; }); if (!pipes.length || pipes[pipes.length - 1].x < canvas.width - 180 / high) addPipe(canvas.width); pipes = pipes.filter((p) => p.x > -40); score = Math.floor((Date.now() - startedAt) / 1000) * 100; const hit = bird.y < 0 || bird.y > canvas.height || pipes.some((p) => bird.x + 14 > p.x && bird.x - 14 < p.x + 34 && (bird.y - 14 < p.top || bird.y + 14 > p.top + p.gap)); if (hit) return end(); draw(); hud(); }
  function pause() { if (started) { paused = !paused; hud(); } }
  bindButton("#flappy-start", flap); bindButton("#flappy-pause", pause); bindButton("#flappy-restart", () => { clearInterval(timer); reset(); flap(); }); canvas.addEventListener("pointerdown", flap);
  document.addEventListener("keydown", (event) => { if (!started) return; if ([" ", "ArrowUp", "w", "W"].includes(event.key)) { event.preventDefault(); flap(); } }); reset();
}

function tetrisGame() {
  const canvas = qs("#tetris-canvas"); if (!canvas) return; const ctx = canvas.getContext("2d"), cols = 10, rows = 20, cell = 30;
  const pieces = [[[1, 1, 1, 1]], [[1, 1], [1, 1]], [[0, 1, 0], [1, 1, 1]], [[1, 0, 0], [1, 1, 1]], [[0, 0, 1], [1, 1, 1]], [[0, 1, 1], [1, 1, 0]], [[1, 1, 0], [0, 1, 1]]];
  let board, piece, x, y, started = false, paused = false, over = false, score = 0, best = Number(localStorage.getItem("tetris-best") || 0), timer = null, startedAt = 0;
  function hud() { qs("#tetris-score").textContent = score; qs("#tetris-best").textContent = best; qs("#tetris-status").textContent = over ? `GAME OVER · ${score}` : paused ? "PAUSED" : started ? "RUNNING" : "READY"; qs("#tetris-pause").disabled = !started; }
  function reset() { board = Array.from({ length: rows }, () => Array(cols).fill(0)); score = 0; x = 3; y = 0; piece = pieces[Math.floor(Math.random() * pieces.length)].map((row) => [...row]); started = paused = over = false; draw(); hud(); }
  function cells(dx = 0, dy = 0, shape = piece) { return shape.flatMap((row, py) => row.map((value, px) => value ? [x + px + dx, y + py + dy] : null).filter(Boolean)); }
  function collides(dx = 0, dy = 0, shape = piece) { return cells(dx, dy, shape).some(([cx, cy]) => cx < 0 || cx >= cols || cy >= rows || (cy >= 0 && board[cy][cx])); }
  function rotate() { const rotated = piece[0].map((_, i) => piece.map((row) => row[row.length - 1 - i])); const counter = rotated.reverse(); if (!collides(0, 0, counter)) piece = counter; }
  function lock() { cells().forEach(([cx, cy]) => { if (cy >= 0) board[cy][cx] = 1; }); board = board.filter((row) => row.some((cellValue) => !cellValue)); while (board.length < rows) board.unshift(Array(cols).fill(0)); piece = pieces[Math.floor(Math.random() * pieces.length)].map((row) => [...row]); x = 3; y = 0; if (collides()) end(); }
  function drop() { if (collides(0, 1)) lock(); else y += 1; }
  function draw() { ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height); board.forEach((row, cy) => row.forEach((value, cx) => { if (value) { ctx.fillStyle = "#0066b1"; ctx.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2); } })); ctx.fillStyle = "#e22718"; cells().forEach(([cx, cy]) => { if (cy >= 0) ctx.fillRect(cx * cell + 1, cy * cell + 1, cell - 2, cell - 2); }); }
  function end() { started = false; over = true; clearInterval(timer); timer = null; best = saveBest("tetris-best", score); hud(); draw(); }
  function start() { if (started) return; if (over) reset(); started = true; startedAt = Date.now(); clearInterval(timer); timer = setInterval(() => { if (!paused) { drop(); score = Math.floor((Date.now() - startedAt) / 1000) * 100; draw(); hud(); } }, 700 / difficulty()); hud(); }
  function act(key) { if (!started || paused) return; if (key === "left" && !collides(-1)) x--; if (key === "right" && !collides(1)) x++; if (key === "down") drop(); if (key === "rotate") rotate(); if (key === "hard") while (!collides(0, 1)) y++; drop(); draw(); }
  bindButton("#tetris-start", start); bindButton("#tetris-pause", () => { if (started) { paused = !paused; hud(); } }); bindButton("#tetris-restart", () => { clearInterval(timer); reset(); start(); });
  document.addEventListener("keydown", (event) => { const map = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowDown: "down", s: "down", S: "down", ArrowUp: "rotate", w: "rotate", W: "rotate", x: "rotate", X: "rotate", " ": "hard" }; if (map[event.key]) { event.preventDefault(); act(map[event.key]); } }); reset();
}

function wiperScene() {
  const canvas = qs("#wiper-canvas"); if (!canvas) return; const ctx = canvas.getContext("2d"), consonants = "ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ"; let drops = [], raf = 0, last = 0, sweepStart = performance.now();
  function spawn() { if (drops.length < 72) drops.push({ x: Math.random() * canvas.width, y: -20, speed: 35 + Math.random() * 75, char: consonants[Math.floor(Math.random() * consonants.length)] }); }
  function draw(now) { const multiplier = Number(qs("#wiper-speed").value || 1), duration = 1600 * multiplier, elapsed = now - sweepStart, phase = (elapsed % (duration * 2)) / duration, angle = phase <= 1 ? phase * Math.PI : (2 - phase) * Math.PI, pivot = { x: canvas.width / 2, y: canvas.height * .9 }, length = canvas.width * .46, dt = Math.min(40, now - last); last = now; if (Math.random() < .16 || drops.length < 72) spawn(); drops.forEach((drop) => { if (!drop.attached) { drop.y += drop.speed * dt / 1000; const dx = drop.x - pivot.x, dy = drop.y - pivot.y, projected = clamp(-(dx * Math.cos(angle) + dy * Math.sin(angle)), 0, length), closest = { x: pivot.x - projected * Math.cos(angle), y: pivot.y - projected * Math.sin(angle) }; if (Math.hypot(drop.x - closest.x, drop.y - closest.y) < 18 && drop.y < pivot.y) { drop.attached = true; drop.radius = Math.hypot(dx, dy); drop.offset = Math.atan2(-dy, -dx) - angle; drop.removeAt = phase <= 1 ? "right" : "left"; } } else { const carriedAngle = angle + drop.offset; drop.x = pivot.x - drop.radius * Math.cos(carriedAngle); drop.y = pivot.y - drop.radius * Math.sin(carriedAngle); } }); drops = drops.filter((drop) => drop.y < canvas.height + 30 && !(drop.attached && ((drop.removeAt === "right" && phase >= 1) || (drop.removeAt === "left" && phase < .05)))); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.font = "24px Arial"; drops.forEach((drop) => { ctx.fillStyle = "#0066b1"; ctx.fillText(drop.char, drop.x, drop.y); }); ctx.save(); ctx.translate(pivot.x, pivot.y); ctx.rotate(angle); ctx.fillStyle = "#fff"; ctx.fillRect(-length, -4, length, 8); ctx.restore(); raf = requestAnimationFrame(draw); }
  bindButton("#wiper-sweep", () => { sweepStart = performance.now(); drops = []; }); requestAnimationFrame(draw);
}

wormGame(); flappyGame(); tetrisGame(); wiperScene();
