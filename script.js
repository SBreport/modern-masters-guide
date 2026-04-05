// Chapter loading & tab navigation
const chapters = ['intro', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'appendix', 'story'];
const container = document.getElementById('chapters-container');

// 스토리 → 용어사전 돌아가기 기능
let storyScrollPos = 0;
let cameFromStory = false;
let currentStoryStage = 0; // 현재 열린 스토리 스테이지 번호

async function loadChapters() {
  const results = await Promise.all(
    chapters.map(ch =>
      fetch(`chapters/${ch}.html`).then(r => r.text())
    )
  );

  results.forEach((html, i) => {
    const div = document.createElement('div');
    div.className = 'chapter' + (i === 0 ? ' active' : '');
    div.id = chapters[i];
    div.innerHTML = html;
    container.appendChild(div);
  });

  wrapTables();
  initNav();
  initTermLinks();
  initStorySelect();
}

// 넓은 테이블을 스크롤 래퍼로 감싸기 (모바일 대응)
function wrapTables() {
  container.querySelectorAll('.compare-table').forEach(table => {
    if (table.parentElement.classList.contains('table-scroll')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'table-scroll';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.ch);
    });
  });
}

function switchTab(chId, scrollTarget) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));

  const btn = document.querySelector(`[data-ch="${chId}"]`);
  if (btn) btn.classList.add('active');

  const chapter = document.getElementById(chId);
  if (chapter) chapter.classList.add('active');

  // 스토리 탭으로 돌아올 때 스테이지 컨테이너 초기화
  if (chId === 'story') {
    const stageContainer = document.getElementById('story-stage-container');
    if (stageContainer) stageContainer.innerHTML = '';
    currentStoryStage = 0;
    // 허브 요소들 다시 표시
    showStoryHub(true);
  }

  if (scrollTarget) {
    setTimeout(() => {
      const el = document.getElementById(scrollTarget);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('glossary-highlight');
        setTimeout(() => el.classList.remove('glossary-highlight'), 2000);
      }
    }, 100);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 돌아가기 버튼 표시/숨김
  const backBtn = document.getElementById('back-to-story');
  if (backBtn) {
    backBtn.style.display = (chId !== 'story' && cameFromStory) ? 'flex' : 'none';
  }
}

// 스토리 스테이지 선택 카드 초기화
function initStorySelect() {
  document.querySelectorAll('.stage-select-card').forEach(card => {
    card.addEventListener('click', () => {
      const stageNum = card.dataset.story;
      loadStoryStage(stageNum);
    });
  });
}

// 스토리 허브 요소 표시/숨김
function showStoryHub(show) {
  const storyChapter = document.getElementById('story');
  if (!storyChapter) return;
  const hubElements = storyChapter.querySelectorAll('.story-header, .story-header + .sub-desc, .story-header ~ p, h3, .story-characters, .stage-select');
  // 직접 자식 중 stage-container가 아닌 것들을 제어
  Array.from(storyChapter.children).forEach(el => {
    if (el.id === 'story-stage-container') return;
    el.style.display = show ? '' : 'none';
  });
}

// 스테이지 로딩
async function loadStoryStage(num) {
  const stageContainer = document.getElementById('story-stage-container');
  if (!stageContainer) return;

  try {
    const res = await fetch(`chapters/story-${num}.html`);
    const html = await res.text();

    // 허브 요소 숨기기
    showStoryHub(false);

    // 스테이지 내용 표시
    stageContainer.innerHTML = html;
    currentStoryStage = num;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    console.error('Failed to load story stage', e);
  }
}

// 스테이지에서 허브로 돌아가기 (글로벌 함수)
window.closeStoryStage = function() {
  const stageContainer = document.getElementById('story-stage-container');
  if (stageContainer) stageContainer.innerHTML = '';
  currentStoryStage = 0;
  showStoryHub(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 스토리 내 용어 링크 클릭 처리
function initTermLinks() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('.term-link');
    if (!link) return;
    if (!link.dataset.term) return; // 안내 텍스트의 가짜 링크 무시
    e.preventDefault();

    const termId = link.dataset.term;
    storyScrollPos = window.scrollY;
    cameFromStory = true;

    switchTab('intro', termId);
  });

  // 돌아가기 버튼 생성
  const backBtn = document.createElement('button');
  backBtn.id = 'back-to-story';
  backBtn.className = 'back-to-story-btn';
  backBtn.innerHTML = '← 스토리로 돌아가기';
  backBtn.style.display = 'none';
  backBtn.addEventListener('click', () => {
    cameFromStory = false;
    backBtn.style.display = 'none';
    switchTab('story');
    // 스테이지가 열려있었으면 다시 로드
    if (currentStoryStage > 0) {
      setTimeout(() => {
        loadStoryStage(currentStoryStage);
        setTimeout(() => window.scrollTo({ top: storyScrollPos, behavior: 'smooth' }), 200);
      }, 100);
    }
  });
  document.body.appendChild(backBtn);
}

loadChapters();
