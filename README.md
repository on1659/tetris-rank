# Tetris Rank 🎮

클래식 테트리스 + 랭킹 시스템

## 요구사항

### 게임 기능
- [ ] 클래식 테트리스 게임 (10x20 그리드)
- [ ] 7가지 테트로미노 (I, O, T, L, J, S, Z)
- [ ] 키보드 조작:
  - ← → : 좌우 이동
  - ↓ : 빠르게 내리기
  - ↑ 또는 스페이스 : 회전
- [ ] **시간 지날수록 속도 증가** (레벨 시스템)
  - 30초마다 레벨 +1
  - 또는 10줄 클리어마다 레벨 +1
  - 레벨 ↑ → 블록 낙하 속도 ↑
- [ ] 점수 계산:
  - 1줄: 100점
  - 2줄: 300점
  - 3줄: 500점
  - 4줄 (테트리스): 800점
- [ ] 게임 오버 → 이름 입력 → 랭킹 저장

### 랭킹 시스템
- [ ] 상위 10명 표시
- [ ] 플레이어명, 점수, 레벨, 줄 수, 날짜
- [ ] 게임 화면 옆에 실시간 랭킹 표시

### UI/UX
- [ ] 모바일 대응 (터치 버튼)
- [ ] 다음 블록 미리보기
- [ ] 일시정지 기능
- [ ] 깔끔한 한글 UI

## 기술 스택

- **Frontend:** Svelte + Vite
- **Backend:** Express
- **DB:** PostgreSQL
- **Deploy:** Railway

## 개발 가이드

### 이미 완료된 것
- ✅ 프로젝트 구조 생성
- ✅ Express 서버 (server/index.js)
- ✅ PostgreSQL DB 스키마 (server/db.js)
- ✅ 랭킹 API (/api/rankings GET/POST)

### TODO
1. **src/App.svelte** - 테트리스 게임 UI + 로직 구현
2. **src/lib/tetris.js** - 게임 로직 (보드, 테트로미노, 충돌 감지, 줄 클리어)
3. **src/lib/api.js** - 랭킹 API 호출
4. 테스트 & 디버그
5. GitHub push
6. Railway 배포

### 로컬 개발
```bash
npm run dev      # Frontend (localhost:5173)
npm start        # Backend (localhost:3000)
```

Railway 배포 시 환경변수:
- `DATABASE_URL` (자동 주입됨)
- `PORT` (Railway가 설정)

## 레벨 시스템 상세

```javascript
// 예시
let level = 1;
let fallSpeed = 1000; // ms

// 레벨 증가 조건
if (gameTime > 30000 * level || linesCleared >= 10 * level) {
  level++;
  fallSpeed = Math.max(100, 1000 - (level * 50)); // 점점 빨라짐
}
```

## 게임 오버 플로우

1. 블록이 천장에 닿으면 게임 오버
2. 모달 띄우기: "게임 오버! 점수: 1234"
3. 이름 입력란
4. "랭킹 등록" 버튼 → POST /api/rankings
5. 랭킹 업데이트 → 게임 재시작 or 종료

## 완성 기준

- [ ] 게임 플레이 가능
- [ ] 레벨 시스템 작동 (시간/줄수로 속도 증가)
- [ ] 랭킹 저장/조회 정상 작동
- [ ] 모바일에서도 플레이 가능
- [ ] Railway 배포 성공

---

**작업자:** Claude Code CLI (서브에이전트)
**예상 소요:** 30분~1시간
