document.documentElement.dataset.ready = "true";

const canvas = document.querySelector("#game-canvas");

if (canvas) {
  const context = canvas.getContext("2d");
  const size = 20;
  const cell = canvas.width / size;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const scoreElement = document.querySelector("#score");
  const bestElement = document.querySelector("#best-score");
  const statusElement = document.querySelector("#game-status");
  const pauseButton = document.querySelector("#pause-game");
  let snake;
  let food;
  let enemies;
  let direction;
  let queuedDirection;
  let score;
  let bestScore = Number(localStorage.getItem("worm-best") || 0);
  let timerId = null;
  let running = false;
  let paused = false;
  let gameOver = false;

  function randomCell() {
    return { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
  }

  function sameCell(a, b) {
    return a.x === b.x && a.y === b.y;
  }

  function occupied(cellToCheck) {
    return snake.some((part) => sameCell(part, cellToCheck))
      || enemies.some((enemy) => sameCell(enemy, cellToCheck))
      || sameCell(food, cellToCheck);
  }

  function freeCell() {
    let next;
    do {
      next = randomCell();
    } while (occupied(next));
    return next;
  }

  function updateHud() {
    scoreElement.textContent = String(score);
    bestElement.textContent = String(bestScore);
    statusElement.textContent = gameOver ? "GAME OVER" : paused ? "PAUSED" : running ? "RUNNING" : "READY";
    pauseButton.disabled = !running;
    pauseButton.textContent = paused ? "RESUME" : "PAUSE";
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }];
    direction = directions.right;
    queuedDirection = direction;
    score = 0;
    gameOver = false;
    paused = false;
    food = randomCell();
    enemies = [];
    const enemyCount = Math.floor(Math.random() * 10);
    while (enemies.length < enemyCount) {
      const enemy = randomCell();
      if (!occupied(enemy)) enemies.push({ ...enemy, cooldown: Math.floor(Math.random() * 3) + 1 });
    }
    updateHud();
    draw();
  }

  function stopLoop() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function startLoop() {
    stopLoop();
    timerId = setInterval(tick, 140);
  }

  function startGame() {
    if (running) return;
    if (gameOver) resetGame();
    running = true;
    updateHud();
    startLoop();
  }

  function endGame() {
    running = false;
    gameOver = true;
    stopLoop();
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem("worm-best", String(bestScore));
    }
    updateHud();
    draw();
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    updateHud();
  }

  function changeDirection(name) {
    const next = directions[name];
    if (!next || (next.x + direction.x === 0 && next.y + direction.y === 0)) return;
    queuedDirection = next;
  }

  function moveEnemies() {
    enemies = enemies.map((enemy) => {
      if (enemy.cooldown > 1) return { ...enemy, cooldown: enemy.cooldown - 1 };
      const options = Object.values(directions).sort(() => Math.random() - 0.5);
      for (const option of options) {
        const next = { x: enemy.x + option.x, y: enemy.y + option.y };
        if (next.x >= 0 && next.x < size && next.y >= 0 && next.y < size) {
          return { ...next, cooldown: Math.floor(Math.random() * 3) + 1 };
        }
      }
      return enemy;
    });
  }

  function tick() {
    if (!running || paused) return;
    direction = queuedDirection;
    const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
    const hitWall = head.x < 0 || head.x >= size || head.y < 0 || head.y >= size;
    const hitSelf = snake.some((part) => sameCell(part, head));
    const hitEnemy = enemies.some((enemy) => sameCell(enemy, head));
    if (hitWall || hitSelf || hitEnemy) {
      endGame();
      return;
    }
    snake.unshift(head);
    if (sameCell(head, food)) {
      score += 1;
      food = freeCell();
    } else {
      snake.pop();
    }
    moveEnemies();
    draw();
    updateHud();
  }

  function drawCell(item, color) {
    context.fillStyle = color;
    context.fillRect(item.x * cell + 1, item.y * cell + 1, cell - 2, cell - 2);
  }

  function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#161616";
    for (let position = 0; position <= size; position += 1) {
      context.beginPath();
      context.moveTo(position * cell, 0);
      context.lineTo(position * cell, canvas.height);
      context.moveTo(0, position * cell);
      context.lineTo(canvas.width, position * cell);
      context.stroke();
    }
    if (food) drawCell(food, "#e22718");
    enemies.forEach((enemy) => drawCell(enemy, "#0066b1"));
    snake.forEach((part, index) => drawCell(part, index === 0 ? "#ffffff" : "#bbbbbb"));
  }

  document.querySelector("#start-game").addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  document.querySelector("#restart-game").addEventListener("click", () => {
    stopLoop();
    running = false;
    resetGame();
    startGame();
  });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("click", () => changeDirection(button.dataset.direction));
  });
  document.addEventListener("keydown", (event) => {
    const keys = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
    const directionName = keys[event.key];
    if (directionName) {
      event.preventDefault();
      changeDirection(directionName);
    }
    if (event.key === "p") togglePause();
  });

  resetGame();
}
