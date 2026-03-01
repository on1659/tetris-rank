<script>
  import { onMount, onDestroy } from 'svelte';
  import * as Tetris from './lib/tetris.js';
  import { getRankings, saveRanking } from './lib/api.js';

  // 게임 상태
  let board = Tetris.createBoard();
  let currentPiece = null;
  let nextPiece = null;
  let score = 0;
  let level = 1;
  let lines = 0;
  let gameOver = false;
  let paused = false;
  let gameStarted = false;
  let playerName = '';
  let showNameInput = false;
  let rankings = [];

  // 타이머
  let gameInterval = null;
  let startTime = null;
  let gameTime = 0;

  // 랭킹 불러오기 + 모바일 확대 방지
  onMount(async () => {
    rankings = await getRankings();
    
    // 더블탭 확대 방지
    let lastTap = 0;
    document.addEventListener('touchend', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        e.preventDefault();
      }
      lastTap = now;
    }, { passive: false });
  });

  // 게임 시작
  function startGame() {
    board = Tetris.createBoard();
    currentPiece = Tetris.randomTetromino();
    nextPiece = Tetris.randomTetromino();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    paused = false;
    gameStarted = true;
    showNameInput = false;
    startTime = Date.now();
    gameTime = 0;
    
    startGameLoop();
  }

  // 게임 루프
  function startGameLoop() {
    if (gameInterval) clearInterval(gameInterval);
    
    gameInterval = setInterval(() => {
      if (!paused && !gameOver) {
        gameTime = Date.now() - startTime;
        updateLevel();
        moveDown();
      }
    }, Tetris.getFallSpeed(level));
  }

  // 레벨 업데이트 (시간 또는 줄 수)
  function updateLevel() {
    const newLevel = Math.floor(gameTime / 30000) + Math.floor(lines / 10) + 1;
    if (newLevel > level) {
      level = newLevel;
      startGameLoop(); // 속도 재조정
    }
  }

  // 아래로 이동
  function moveDown() {
    if (!currentPiece) return;
    
    const moved = { ...currentPiece, y: currentPiece.y + 1 };
    
    if (Tetris.collides(board, moved)) {
      // 병합
      board = Tetris.merge(board, currentPiece);
      
      // 줄 클리어
      const result = Tetris.clearLines(board);
      if (result.linesCleared > 0) {
        lines += result.linesCleared;
        score += Tetris.calculateScore(result.linesCleared);
        board = result.board;
      }
      
      // 다음 블록
      currentPiece = nextPiece;
      nextPiece = Tetris.randomTetromino();
      
      // 게임 오버 체크
      if (Tetris.collides(board, currentPiece)) {
        endGame();
      }
    } else {
      currentPiece = moved;
    }
  }

  // 좌우 이동
  function moveHorizontal(dx) {
    if (!currentPiece || paused || gameOver) return;
    
    const moved = { ...currentPiece, x: currentPiece.x + dx };
    if (!Tetris.collides(board, moved)) {
      currentPiece = moved;
    }
  }

  // 회전
  function rotatePiece() {
    if (!currentPiece || paused || gameOver) return;
    
    const rotated = Tetris.rotate(currentPiece);
    if (!Tetris.collides(board, rotated)) {
      currentPiece = rotated;
    }
  }

  // 빠르게 내리기
  function drop() {
    if (!currentPiece || paused || gameOver) return;
    
    let dropping = true;
    while (dropping) {
      const moved = { ...currentPiece, y: currentPiece.y + 1 };
      if (Tetris.collides(board, moved)) {
        dropping = false;
      } else {
        currentPiece = moved;
      }
    }
    moveDown(); // 마지막 병합
  }

  // 일시정지
  function togglePause() {
    if (!gameStarted || gameOver) return;
    paused = !paused;
  }

  // 게임 종료
  function endGame() {
    gameOver = true;
    showNameInput = true;
    if (gameInterval) clearInterval(gameInterval);
  }

  // 랭킹 저장
  async function submitRanking() {
    if (!playerName.trim()) {
      alert('이름을 입력해주세요!');
      return;
    }
    
    try {
      await saveRanking({
        player_name: playerName,
        score,
        level,
        lines
      });
      
      rankings = await getRankings();
      showNameInput = false;
      playerName = '';
    } catch (error) {
      alert('랭킹 저장 실패: ' + error.message);
    }
  }

  // 키보드 조작
  function handleKeydown(e) {
    if (!gameStarted || gameOver) return;
    
    switch(e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        moveHorizontal(-1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        moveHorizontal(1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        moveDown();
        break;
      case 'ArrowUp':
      case ' ':
        e.preventDefault();
        rotatePiece();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        togglePause();
        break;
    }
  }

  // 보드 렌더링 (현재 블록 포함)
  $: displayBoard = (() => {
    const temp = board.map(row => [...row]);
    if (currentPiece) {
      for (let r = 0; r < currentPiece.shape.length; r++) {
        for (let c = 0; c < currentPiece.shape[r].length; c++) {
          if (currentPiece.shape[r][c]) {
            const y = currentPiece.y + r;
            const x = currentPiece.x + c;
            if (y >= 0 && y < Tetris.ROWS && x >= 0 && x < Tetris.COLS) {
              temp[y][x] = currentPiece.color;
            }
          }
        }
      }
    }
    return temp;
  })();

  // 정리
  onDestroy(() => {
    if (gameInterval) clearInterval(gameInterval);
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<main>
  <div class="container">
    <h1>🎮 Tetris Rank</h1>
    
    <div class="game-area">
      <!-- 게임 보드 -->
      <div class="game-panel">
        <div class="info">
          <div>점수: <strong>{score}</strong></div>
          <div>레벨: <strong>{level}</strong></div>
          <div>줄: <strong>{lines}</strong></div>
        </div>
        
        <div class="board">
          {#each displayBoard as row, r}
            <div class="row">
              {#each row as cell, c}
                <div 
                  class="cell" 
                  style="background-color: {cell || '#1a1a1a'}"
                ></div>
              {/each}
            </div>
          {/each}
        </div>
        
        {#if !gameStarted}
          <div class="overlay">
            <button class="btn-start" on:click={startGame}>게임 시작</button>
          </div>
        {/if}
        
        {#if paused}
          <div class="overlay">
            <p>일시정지</p>
            <button class="btn-resume" on:click={togglePause}>계속하기</button>
          </div>
        {/if}
        
        {#if gameOver && showNameInput}
          <div class="overlay">
            <h2>게임 오버!</h2>
            <p>점수: <strong>{score}</strong></p>
            <p>레벨: {level} | 줄: {lines}</p>
            <input 
              type="text" 
              placeholder="이름 입력" 
              bind:value={playerName}
              on:keydown={(e) => e.key === 'Enter' && submitRanking()}
            />
            <button class="btn-submit" on:click={submitRanking}>랭킹 등록</button>
            <button class="btn-restart" on:click={startGame}>다시 시작</button>
          </div>
        {/if}
        
        <!-- 모바일 컨트롤 -->
        <div class="mobile-controls">
          <div class="row-1">
            <button on:click={() => moveHorizontal(-1)}>←</button>
            <button on:click={rotatePiece}>↻</button>
            <button on:click={() => moveHorizontal(1)}>→</button>
          </div>
          <div class="row-2">
            <button on:click={moveDown}>↓</button>
            <button on:click={drop}>Drop</button>
            <button on:click={togglePause}>||</button>
          </div>
        </div>
      </div>
      
      <!-- 사이드바 -->
      <div class="sidebar">
        <!-- 다음 블록 -->
        {#if nextPiece}
          <div class="next-piece">
            <h3>다음 블록</h3>
            <div class="preview">
              {#each nextPiece.shape as row}
                <div class="preview-row">
                  {#each row as cell}
                    <div 
                      class="preview-cell" 
                      style="background-color: {cell ? nextPiece.color : 'transparent'}"
                    ></div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- 랭킹 -->
        <div class="rankings">
          <h3>🏆 랭킹</h3>
          {#if rankings.length === 0}
            <p class="empty">아직 랭킹이 없습니다</p>
          {:else}
            <ol>
              {#each rankings as rank, i}
                <li>
                  <span class="rank-num">{i + 1}</span>
                  <span class="rank-name">{rank.player_name}</span>
                  <span class="rank-score">{rank.score}</span>
                </li>
              {/each}
            </ol>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
  }

  main {
    padding: 20px;
    color: white;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  h1 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 30px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }

  .game-area {
    display: flex;
    gap: 30px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .game-panel {
    position: relative;
  }

  .info {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 15px;
    font-size: 1.1rem;
  }

  .board {
    background: #000;
    border: 4px solid #fff;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    padding: 4px;
  }

  .row {
    display: flex;
  }

  .cell {
    width: 25px;
    height: 25px;
    border: 1px solid #333;
    box-sizing: border-box;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 15px;
    border-radius: 8px;
  }

  .overlay h2 {
    margin: 0;
    font-size: 2rem;
  }

  .overlay p {
    margin: 5px 0;
    font-size: 1.2rem;
  }

  .overlay input {
    padding: 10px 15px;
    font-size: 1rem;
    border: 2px solid #667eea;
    border-radius: 5px;
    background: white;
    color: black;
    width: 200px;
  }

  button {
    padding: 12px 24px;
    font-size: 1rem;
    font-weight: bold;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: transform 0.1s, background 0.2s;
  }

  button:hover {
    transform: scale(1.05);
  }

  button:active {
    transform: scale(0.95);
  }

  .btn-start, .btn-resume, .btn-submit, .btn-restart {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    padding: 15px 30px;
    font-size: 1.2rem;
  }

  .mobile-controls {
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-controls .row-1,
  .mobile-controls .row-2 {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .mobile-controls button {
    width: 70px;
    height: 50px;
    background: rgba(255,255,255,0.2);
    color: white;
    font-size: 1.2rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }

  .next-piece {
    background: rgba(255,255,255,0.1);
    padding: 20px;
    border-radius: 8px;
  }

  .next-piece h3 {
    margin-top: 0;
    text-align: center;
  }

  .preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .preview-row {
    display: flex;
    gap: 2px;
  }

  .preview-cell {
    width: 20px;
    height: 20px;
    border: 1px solid rgba(255,255,255,0.2);
  }

  .rankings {
    background: rgba(255,255,255,0.1);
    padding: 20px;
    border-radius: 8px;
    min-width: 280px;
  }

  .rankings h3 {
    margin-top: 0;
    text-align: center;
  }

  .rankings ol {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .rankings li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px;
    background: rgba(0,0,0,0.2);
    margin-bottom: 5px;
    border-radius: 5px;
  }

  .rank-num {
    font-weight: bold;
    width: 25px;
    text-align: center;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    padding: 5px;
  }

  .rank-name {
    flex: 1;
  }

  .rank-score {
    font-weight: bold;
    color: #ffd700;
  }

  .empty {
    text-align: center;
    color: rgba(255,255,255,0.5);
    font-style: italic;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 2rem;
    }

    .cell {
      width: 20px;
      height: 20px;
    }

    .game-area {
      flex-direction: column;
      align-items: center;
    }
  }
</style>
