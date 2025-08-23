const orangeContainer = document.getElementById("orange-container");
const yellowRow = document.getElementById("yellow-row");
const roundLabel = document.getElementById("round-label");
const scoreLabel = document.getElementById("score-label");
const timerContainer = document.getElementById("timer-container");
const startMessage = document.getElementById("start-message");
const dictionaryButton = document.getElementById("dictionary-button");
const okButton = document.getElementById("ok-button");
const newGameButton = document.getElementById("new-game-button");

const squareSize = 40;
const gap = 1;
const orangeSquares = [];
const yellowSquares = [];
const magyarABC = "AÁBCDEÉFGHIÍJKLMNOÓÖŐPQRSTUÚÜŰVWXYZ";
const jokerChar = "***AAEE";
const toplistaContainer = document.getElementById("toplista-container");
const namePrompt = document.getElementById("namePrompt");
const playerNameInput = document.getElementById("playerNameInput");

let currentRound = 0;
let totalScore = 0;
let timerInterval;
let currentScale = 1;
let yellowIsSnapped = false; 



for (let row = 0; row < 12; row++) {
  for (let col = 0; col < 17; col++) {
    const square = document.createElement("div");
    square.classList.add("square", "orange"); // 🔸 minden mező narancs

    square.style.position = "absolute";
    square.originalLeft = col * (squareSize + gap);
    square.originalTop = row * (squareSize + gap);
    square.style.left = `${square.originalLeft}px`;
    square.style.top = `${square.originalTop}px`;

    orangeContainer.appendChild(square);
    orangeSquares.push(square);
  }
}
const labeledSquares = [
  { row: 2, col: 6, letter: "J" },
  { row: 3, col: 6, letter: "Á" },
  { row: 4, col: 6, letter: "T" },
  { row: 5, col: 6, letter: "É" },
  { row: 6, col: 6, letter: "K" },
  { row: 8, col: 4, letter: "A" },
  { row: 9, col: 8, letter: "B" },
  { row: 9, col: 9, letter: "E" },
  { row: 9, col: 10, letter: "T" },
  { row: 9, col: 11, letter: "Ű" },
  { row: 9, col: 12, letter: "K" },
  { row: 9, col: 13, letter: "K" },
  { row: 9, col: 14, letter: "E" },
  { row: 9, col: 15, letter: "L" }
];

const redSquares = [];

for (const pos of labeledSquares) {
  const square = document.createElement("div");
  square.classList.add("square", "red");
  square.textContent = pos.letter;
  square.style.position = "absolute";

  // Megkeressük a megfelelő narancs mezőt
  const orangeTarget = orangeSquares.find(o =>
    o.gridRow === pos.row && o.gridCol === pos.col
  );

  if (orangeTarget) {
    const rect = orangeTarget.getBoundingClientRect();
    const wrapperRect = gameWrapper.getBoundingClientRect();

    // Skálázás figyelembevétele
    const left = (rect.left - wrapperRect.left) / currentScale;
    const top = (rect.top - wrapperRect.top) / currentScale;

    square.style.left = `${left}px`;
    square.style.top = `${top}px`;

    square.snappedTo = orangeTarget;
    square.gridRow = pos.row;
    square.gridCol = pos.col;
  } else {
    // Fallback pozíció
    square.style.left = `${pos.col * (squareSize + gap)}px`;
    square.style.top = `${pos.row * (squareSize + gap)}px`;
  }

  orangeContainer.appendChild(square);
  redSquares.push(square);
}



const originalRedPositions = labeledSquares.map(pos => `${pos.row},${pos.col}`);

dictionaryButton.addEventListener("click", () => {
  checkAttachedYellowNeighbors({
    orangeSquares,
    yellowSquares,
    squareSize,
    gap,
    startMessageElement: startMessage,
    enforceLayout: false
  });
});

newGameButton.addEventListener("click", () => {
  currentRound = 0;
  totalScore = 0;
  scoreLabel.textContent = "Eredmény: 0 pont";
  roundLabel.textContent = "";
  timerContainer.textContent = "3:00";
  startMessage.classList.add("hidden");

  yellowSquares.forEach(square => square.remove());
  yellowSquares.length = 0;

  const allRedSquares = document.querySelectorAll(".square.red");
  allRedSquares.forEach(square => {
    const row = Math.floor(square.offsetTop / (squareSize + gap));
    const col = Math.floor(square.offsetLeft / (squareSize + gap));
    const key = `${row},${col}`;
    if (!originalRedPositions.includes(key)) {
      square.remove();
    }
  });

  startNextRound();
});
okButton.addEventListener("click", () => {
  clearInterval(timerInterval);
  endRound();
});
// 🔹 Skálázás funkció hozzáadva
function scaleGame() {
  const wrapper = document.getElementById("game-wrapper");
  const gameWidth = 800;
  const gameHeight = 800;

  const scaleX = window.innerWidth / gameWidth;
  const scaleY = window.innerHeight / gameHeight;
  currentScale = Math.min(scaleX, scaleY);

  wrapper.style.transform = `scale(${currentScale})`;

  // 🔸 Sárga négyzetek pozíciófrissítése
  yellowSquares.forEach(square => {
    if (square.snappedTo) {
      const oRect = square.snappedTo.getBoundingClientRect();
      const orangeLeft = (oRect.left + window.scrollX) / currentScale;
      const orangeTop = (oRect.top + window.scrollY) / currentScale;
      square.style.left = `${orangeLeft}px`;
      square.style.top = `${orangeTop}px`;
    }
  });

  // 🔸 Piros négyzetek pozíciófrissítése
  const redSquares = document.querySelectorAll(".square.red");
  redSquares.forEach(square => {
  if (square.snappedTo) {
    // 🔶 Narancs mezőhöz kapcsolt piros négyzet
    const oRect = square.snappedTo.getBoundingClientRect();
    const orangeLeft = (oRect.left + window.scrollX) / currentScale;
    const orangeTop = (oRect.top + window.scrollY) / currentScale;
    square.style.left = `${orangeLeft}px`;
    square.style.top = `${orangeTop}px`;
  } else if (square.originalLeft !== undefined && square.originalTop !== undefined) {
    // 🔴 Fix pozíciójú piros négyzet (pl. JÁTÉK A BETŰKKEL felirat)
    square.style.left = `${square.originalLeft / currentScale}px`;
    square.style.top = `${square.originalTop / currentScale}px`;
  }
});

}



window.addEventListener("resize", scaleGame);
window.addEventListener("load", scaleGame);


function snapToOrangeSquare(elem) {
  for (let orange of orangeSquares) {
    const oRect = orange.getBoundingClientRect();
    const yRect = elem.getBoundingClientRect();
    const overlapX = Math.max(0, Math.min(oRect.right, yRect.right) - Math.max(oRect.left, yRect.left));
    const overlapY = Math.max(0, Math.min(oRect.bottom, yRect.bottom) - Math.max(oRect.top, yRect.top));
    const overlapArea = overlapX * overlapY;
    const yellowArea = yRect.width * yRect.height;

    if (overlapArea / yellowArea >= 0.7) {
      const orangeLeft = (oRect.left + window.scrollX) / currentScale;
      const orangeTop = (oRect.top + window.scrollY) / currentScale;
      elem.style.left = `${orangeLeft}px`;
      elem.style.top = `${orangeTop}px`;
      elem.snappedTo = orange;
const index = orangeSquares.indexOf(orange);
elem.gridRow = Math.floor(index / 17);
elem.gridCol = index % 17;

      yellowIsSnapped = true;
      return;
    }
  }
// 🔻 Ha nem volt elég átfedés, töröljük a hozzárendelést
  elem.snappedTo = null;
  elem.gridRow = undefined;
  elem.gridCol = undefined;
  yellowIsSnapped = false;
}


function makeDraggable(elem) {
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  const wrapper = document.getElementById("game-wrapper");

  elem.addEventListener("mousedown", (e) => {
    if (!elem.classList.contains("yellow")) return;
    isDragging = true;

    const rect = elem.getBoundingClientRect();
    offsetX = (e.clientX - rect.left) / currentScale;
    offsetY = (e.clientY - rect.top) / currentScale;

    elem.style.position = "absolute";
    elem.style.zIndex = 1000;
    elem.style.left = `${(e.clientX - offsetX * currentScale) / currentScale}px`;
    elem.style.top = `${(e.clientY - offsetY * currentScale) / currentScale}px`;
    elem.style.cursor = "grabbing";
    wrapper.appendChild(elem);
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    elem.style.left = `${(e.clientX - offsetX * currentScale) / currentScale}px`;
    elem.style.top = `${(e.clientY - offsetY * currentScale) / currentScale}px`;
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    isDragging = false;
    elem.style.cursor = "grab";
    snapToOrangeSquare(elem);
  });

  elem.addEventListener("touchstart", (e) => {
    if (!elem.classList.contains("yellow")) return;
    if (e.touches.length !== 1) return;
    isDragging = true;

    const touch = e.touches[0];
    const rect = elem.getBoundingClientRect();
    offsetX = (touch.clientX - rect.left) / currentScale;
    offsetY = (touch.clientY - rect.top) / currentScale;

    elem.style.position = "absolute";
    elem.style.zIndex = 1000;
    elem.style.left = `${(touch.clientX - offsetX * currentScale) / currentScale}px`;
    elem.style.top = `${(touch.clientY - offsetY * currentScale) / currentScale}px`;
    elem.style.cursor = "grabbing";
    wrapper.appendChild(elem);
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchmove", (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    elem.style.left = `${(touch.clientX - offsetX * currentScale) / currentScale}px`;
    elem.style.top = `${(touch.clientY - offsetY * currentScale) / currentScale}px`;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener("touchend", () => {
    if (!isDragging) return;
    isDragging = false;
    elem.style.cursor = "grab";
    snapToOrangeSquare(elem);
  });
}



function endRound() {
  checkAttachedYellowNeighbors({
    orangeSquares,
    yellowSquares,
    squareSize,
    gap,
    startMessageElement: startMessage,
    onRoundEnd: handleRoundFinish,
    enforceLayout: true
  });
}

function handleRoundFinish({ totalScore: earnedPoints, validWord, usedSquares }) {
  if (!usedSquares || usedSquares.length === 0 || !validWords.has(validWord.toUpperCase())) {
    scoreLabel.textContent = `Eredmény: ${totalScore} pont`;
    yellowSquares.forEach(square => square.remove());
    yellowSquares.length = 0;

    setTimeout(() => {
      startNextRound();
    }, 4000);
    return;
  }

  totalScore += earnedPoints;
  scoreLabel.textContent = `Eredmény: ${totalScore} pont`;

  startMessage.textContent = `A fordulóban a ${validWord} szót raktad ki, ${earnedPoints} pontot szereztél!`;
  startMessage.classList.remove("hidden");
  setTimeout(() => startMessage.classList.add("hidden"), 4000);

  usedSquares.forEach(square => {
    const numberElement = square.querySelector(".number");
    if (numberElement) numberElement.remove();

    square.classList.remove("yellow");
    square.classList.add("red");
    square.style.backgroundColor = "red";
    square.style.color = "white";
    
// 🔹 biztosítjuk, hogy a piros négyzet megtartsa a snappedTo értéket
square.snappedTo = square.snappedTo || null;

    if (!orangeSquares.includes(square)) {
      orangeSquares.push(square);
    }
  });

  yellowSquares.forEach(square => {
    if (!usedSquares.includes(square)) {
      square.remove();
    }
  });

  yellowSquares.length = 0;

  setTimeout(() => {
    startNextRound();
  }, 4000);
}

function startNextRound() {
  currentRound++;
  if (currentRound > 5) {
  startMessage.textContent = "A játék véget ért!";
  startMessage.classList.remove("hidden");

  setTimeout(() => {
    showNamePrompt();
  }, 1000);
  return;
}

  roundLabel.textContent = `Forduló: ${currentRound}`;
  timerContainer.textContent = "3:00";

  startMessage.textContent = "Készülj!";
  startMessage.classList.remove("hidden");
  let flashInterval = setInterval(() => {
    startMessage.classList.toggle("hidden");
  }, 500);

  setTimeout(() => {
    clearInterval(flashInterval);
    startMessage.classList.add("hidden");

    generateYellowSquares();
    startCountdown();
  }, 5000);
}

function generateYellowSquares() {
  yellowSquares.length = 0;
  yellowRow.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const yellow = document.createElement("div");
    yellow.classList.add("square", "yellow");

    const allChars = magyarABC + jokerChar;
    const letter = allChars.charAt(Math.floor(Math.random() * allChars.length));
    yellow.textContent = letter;

    const number = document.createElement("div");
    number.classList.add("number");
    number.textContent = Math.floor(Math.random() * 9) + 1;
    yellow.appendChild(number);

    yellowRow.appendChild(yellow);
    yellowSquares.push(yellow);
    makeDraggable(yellow);
  }
}

function startCountdown() {
  let timeLeft = 180;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerContainer.textContent = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      endRound();
    }
  }, 1000);
}
function showNamePrompt() {
  namePrompt.style.display = "block";
  setTimeout(() => playerNameInput.focus(), 100);

  playerNameInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
      submitName();
    }
  });
}

function submitName() {
  const name = playerNameInput.value.trim();
  if (name === "") return;

  ujEredmenyHozzaadasa(name, totalScore);
  namePrompt.style.display = "none";
  playerNameInput.value = "";
}
function ujEredmenyHozzaadasa(name, score) {
  let toplista = [];

  if (window.AndroidBridge && typeof window.AndroidBridge.loadToplista === "function") {
    try {
      const json = window.AndroidBridge.loadToplista();
      toplista = JSON.parse(json);
    } catch (e) {
      console.error("Hiba a toplista olvasásakor:", e);
    }
  } else {
    toplista = JSON.parse(localStorage.getItem("toplista") || "[]");
  }

  toplista.push({ name, score });
  toplista.sort((a, b) => b.score - a.score);
  toplista = toplista.slice(0, 10);

  const json = JSON.stringify(toplista);
  if (window.AndroidBridge && typeof window.AndroidBridge.saveToplista === "function") {
    window.AndroidBridge.saveToplista(json);
  } else {
    localStorage.setItem("toplista", json);
  }

  renderToplista(toplista);
}
function renderToplista(toplista) {
  toplistaContainer.innerHTML = "<div class='toplista-title'>🏆 Toplista</div>";
  toplista.forEach((entry, index) => {
    const sor = document.createElement("div");
    sor.classList.add("toplista-entry");
    sor.textContent = `${index + 1}. ${entry.name} - ${entry.score} pt`;
    toplistaContainer.appendChild(sor);
  });
}

function megjelenitToplistat() {
  let toplista = [];

  if (window.AndroidBridge && typeof window.AndroidBridge.loadToplista === "function") {
    try {
      const json = window.AndroidBridge.loadToplista();
      toplista = JSON.parse(json);
    } catch (e) {
      console.error("Hiba a toplista fájl olvasásakor:", e);
    }
  } else {
    toplista = JSON.parse(localStorage.getItem("toplista") || "[]");
  }

  renderToplista(toplista);
}


startNextRound();
megjelenitToplistat();