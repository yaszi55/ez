function attachedYellowInOneLine(yellowSquares, orangeSquares, squareSize, gap) {
  const attachedCoords = [];

  for (let yellow of yellowSquares) {
    const yRect = yellow.getBoundingClientRect();
    for (let orange of orangeSquares) {
      const oRect = orange.getBoundingClientRect();
      const overlapX = Math.max(0, Math.min(oRect.right, yRect.right) - Math.max(oRect.left, yRect.left));
      const overlapY = Math.max(0, Math.min(oRect.bottom, yRect.bottom) - Math.max(oRect.top, yRect.top));
      const overlapArea = overlapX * overlapY;
      const yellowArea = yRect.width * yRect.height;

      if (overlapArea / yellowArea >= 0.7) {
        const index = orangeSquares.indexOf(orange);
        const row = Math.floor(index / 17);
        const col = index % 17;

        yellow.gridRow = row;
        yellow.gridCol = col;

        attachedCoords.push({ row, col });
        break;
      }
    }
  }

  if (attachedCoords.length === 0) return true;

  const sameRow = attachedCoords.every(coord => coord.row === attachedCoords[0].row);
  const sameCol = attachedCoords.every(coord => coord.col === attachedCoords[0].col);
  return sameRow || sameCol;
}

function checkAttachedYellowNeighbors({
  orangeSquares,
  yellowSquares,
  squareSize,
  gap,
  startMessageElement,
  onRoundEnd,
  enforceLayout
}) {

  if (enforceLayout && !attachedYellowInOneLine(yellowSquares, orangeSquares, squareSize, gap)) {
    yellowSquares.forEach(square => square.remove());
    yellowSquares.length = 0;
    startMessageElement.textContent = "Nem meg engedett elrendezés";
    startMessageElement.classList.remove("hidden");
    setTimeout(() => startMessageElement.classList.add("hidden"), 3000);
    setTimeout(() => startNextRound(), 4000);
    return;
  }

  if (!enforceLayout && !attachedYellowInOneLine(yellowSquares, orangeSquares, squareSize, gap)) {
    startMessageElement.textContent = "Hiba, nem egy szó!";
    startMessageElement.classList.remove("hidden");
    setTimeout(() => startMessageElement.classList.add("hidden"), 4000);
    return;
  }

  const grid = Array.from({ length: 12 }, () => Array(17).fill(0));
  const redPositions = [];
  const yellowPositions = [];

  const allRedSquares = document.querySelectorAll(".square.red");
  for (let red of allRedSquares) {
    const rRect = red.getBoundingClientRect();
    for (let orange of orangeSquares) {
      const oRect = orange.getBoundingClientRect();
      const overlapX = Math.max(0, Math.min(oRect.right, rRect.right) - Math.max(oRect.left, rRect.left));
      const overlapY = Math.max(0, Math.min(oRect.bottom, rRect.bottom) - Math.max(oRect.top, rRect.top));
      const overlapArea = overlapX * overlapY;
      const redArea = rRect.width * rRect.height;

      if (overlapArea / redArea >= 0.7) {
        const index = orangeSquares.indexOf(orange);
        const row = Math.floor(index / 17);
        const col = index % 17;

        red.gridRow = row;
        red.gridCol = col;

        grid[row][col] = 1;
        redPositions.push({ row, col, element: red });
        break;
      }
    }
  }

  for (let yellow of yellowSquares) {
    if (typeof yellow.gridRow === "number" && typeof yellow.gridCol === "number") {
      const row = yellow.gridRow;
      const col = yellow.gridCol;
      grid[row][col] = 2;
      yellowPositions.push({ row, col, element: yellow });
    }
  }

  function isRed(row, col) {
    return grid[row]?.[col] === 1;
  }

  function hasMixedDirectionStrict(row, col) {
    const horizontal = isRed(row, col - 1) || isRed(row, col + 1);
    const vertical = isRed(row - 1, col) || isRed(row + 1, col);
    return horizontal && vertical;
  }

  for (let yellow of yellowPositions) {
    const { row, col } = yellow;
    if (hasMixedDirectionStrict(row, col)) {
      if (!onRoundEnd && startMessageElement) {
        startMessageElement.textContent = "Hiba, nem egy szó!";
        startMessageElement.classList.remove("hidden");
        setTimeout(() => startMessageElement.classList.add("hidden"), 4000);
      }
      if (onRoundEnd) {
        onRoundEnd({ totalScore: 0, validWord: "", usedSquares: [] });
      }
      return;
    }
  }

  const positions = [...yellowPositions, ...redPositions];
  let fullText = "";
  const positionsInWord = [];
  let direction = null;
  if (positions.length > 0) {
    const { row, col } = positions[0];

    let startCol = col;
    while (startCol > 0 && grid[row][startCol - 1] >= 1) startCol--;
    let endCol = col;
    while (endCol < 16 && grid[row][endCol + 1] >= 1) endCol++;

    if (endCol - startCol + 1 >= 2) {
      direction = "horizontal";
      for (let c = startCol; c <= endCol; c++) {
        const square = positions.find(el => el.row === row && el.col === c);
        if (square?.element) {
          const letter = square.element.firstChild?.textContent?.trim()?.charAt(0) || "";
          fullText += letter;
          positionsInWord.push(square.element);
        }
      }
    } else {
      let startRow = row;
      while (startRow > 0 && grid[startRow - 1]?.[col] >= 1) startRow--;
      let endRow = row;
      while (endRow < 11 && grid[endRow + 1]?.[col] >= 1) endRow++;

      if (endRow - startRow + 1 >= 2) {
        direction = "vertical";
        for (let r = startRow; r <= endRow; r++) {
          const square = positions.find(el => el.row === r && el.col === col);
          if (square?.element) {
            const letter = square.element.firstChild?.textContent?.trim()?.charAt(0) || "";
            fullText += letter;
            positionsInWord.push(square.element);
          }
        }
      }
    }
  }

  function hasForbiddenRedSequence(squares) {
    const pattern = squares.map(el => el.classList.contains("red") ? "P" : "S").join("");
    return pattern.includes("PP");
  }

  if (hasForbiddenRedSequence(positionsInWord)) {
    if (!onRoundEnd && startMessageElement) {
      startMessageElement.textContent = "Hiba, piros betűk egymás után!";
      startMessageElement.classList.remove("hidden");
      setTimeout(() => startMessageElement.classList.add("hidden"), 4000);
    }
    if (onRoundEnd) {
      onRoundEnd({ totalScore: 0, validWord: "", usedSquares: [] });
    }
    return;
  }

  const jokerIndexes = [];
  let cleanedWord = "";
  for (let i = 0; i < fullText.length; i++) {
    const c = fullText[i];
    if (c === "*") {
      jokerIndexes.push(i);
      cleanedWord += "*";
    } else if (magyarABC.includes(c.toUpperCase())) {
      cleanedWord += c;
    }
  }

  let resolvedWord = cleanedWord;
  let isValid = false;

  if (jokerIndexes.length > 0) {
    const generateCombinations = (word, indexes, alphabet) => {
      const results = [];
      const helper = (base, depth) => {
        if (depth === indexes.length) {
          results.push(base);
          return;
        }
        for (let letter of alphabet) {
          let chars = base.split("");
          chars[indexes[depth]] = letter;
          helper(chars.join(""), depth + 1);
        }
      };
      helper(word, 0);
      return results    };

    const candidates = generateCombinations(cleanedWord, jokerIndexes, magyarABC.split(""));
    for (let candidate of candidates) {
      if (validWords.has(candidate.toUpperCase())) {
        resolvedWord = candidate;
        isValid = true;
        break;
      }
    }
  } else {
    isValid = validWords.has(cleanedWord.toUpperCase());
    resolvedWord = cleanedWord;
  }

  const scoreSum = positionsInWord.reduce((sum, square) => {
    const num = square.querySelector(".number");
    const val = parseInt(num?.textContent || "0", 10);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const redCount = positionsInWord.filter(el => el.classList.contains("red")).length;
  const redBonus = redCount * 10;
  const totalScore = scoreSum + redBonus;

  if (onRoundEnd) {
    onRoundEnd({
      totalScore: isValid ? totalScore : 0,
      validWord: isValid ? resolvedWord : "",
      usedSquares: isValid ? positionsInWord : []
    });
  } else if (startMessageElement) {
    const msg = `A szó: ${resolvedWord}\nPontszám: ${totalScore}\n` +
      (isValid ? "Szótárban megtalálható ✅" : "Nincs ilyen szó a szótáramban ❌");
    startMessageElement.textContent = msg.trim();
    startMessageElement.classList.remove("hidden");
    setTimeout(() => startMessageElement.classList.add("hidden"), 4000);
  }
}
