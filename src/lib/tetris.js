// Tetris 게임 로직 모듈

export const COLS = 10;
export const ROWS = 20;

// 테트로미노 정의 (7가지)
export const TETROMINOS = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f0f0'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#a000f0'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#f0a000'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#0000f0'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00f000'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#f00000'
  }
};

// 빈 보드 생성
export function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

// 랜덤 테트로미노 생성
export function randomTetromino() {
  const keys = Object.keys(TETROMINOS);
  const key = keys[Math.floor(Math.random() * keys.length)];
  return {
    type: key,
    shape: TETROMINOS[key].shape,
    color: TETROMINOS[key].color,
    x: Math.floor(COLS / 2) - Math.floor(TETROMINOS[key].shape[0].length / 2),
    y: 0
  };
}

// 테트로미노 회전
export function rotate(piece) {
  const shape = piece.shape;
  const rows = shape.length;
  const cols = shape[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = shape[r][c];
    }
  }
  
  return { ...piece, shape: rotated };
}

// 충돌 감지
export function collides(board, piece) {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const boardX = piece.x + c;
        const boardY = piece.y + r;
        
        // 경계 체크
        if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
          return true;
        }
        
        // 보드와 충돌 체크
        if (boardY >= 0 && board[boardY][boardX]) {
          return true;
        }
      }
    }
  }
  return false;
}

// 보드에 테트로미노 병합
export function merge(board, piece) {
  const newBoard = board.map(row => [...row]);
  
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c]) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        if (boardY >= 0) {
          newBoard[boardY][boardX] = piece.color;
        }
      }
    }
  }
  
  return newBoard;
}

// 완성된 줄 찾기 & 제거
export function clearLines(board) {
  let linesCleared = 0;
  const newBoard = [];
  
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(cell => cell !== 0)) {
      linesCleared++;
    } else {
      newBoard.unshift(board[r]);
    }
  }
  
  // 위쪽에 빈 줄 추가
  while (newBoard.length < ROWS) {
    newBoard.unshift(Array(COLS).fill(0));
  }
  
  return { board: newBoard, linesCleared };
}

// 점수 계산
export function calculateScore(lines) {
  const scores = {
    1: 100,
    2: 300,
    3: 500,
    4: 800
  };
  return scores[lines] || 0;
}

// 레벨에 따른 낙하 속도 계산 (ms)
export function getFallSpeed(level) {
  return Math.max(100, 1000 - (level - 1) * 50);
}
