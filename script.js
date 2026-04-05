// Chapter loading & tab navigation
const chapters = ['intro', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'appendix', 'story'];
const container = document.getElementById('chapters-container');

// 스토리 → 다른 탭 돌아가기 기능
let storyScrollPos = 0;
let cameFromStory = false;
let savedStoryStage = 0; // 돌아갈 때 복원할 스테이지
let currentStoryStage = 0;

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

  // 스토리 탭으로 돌아올 때 (네비 클릭으로 직접 이동하는 경우만 허브 리셋)
  if (chId === 'story' && !cameFromStory) {
    const stageContainer = document.getElementById('story-stage-container');
    if (stageContainer) stageContainer.innerHTML = '';
    currentStoryStage = 0;
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
      loadStoryStage(card.dataset.story).then(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    });
  });
}

function showStoryHub(show) {
  const storyChapter = document.getElementById('story');
  if (!storyChapter) return;
  Array.from(storyChapter.children).forEach(el => {
    if (el.id === 'story-stage-container') return;
    el.style.display = show ? '' : 'none';
  });
}

async function loadStoryStage(num) {
  const stageContainer = document.getElementById('story-stage-container');
  if (!stageContainer) return;

  try {
    const res = await fetch(`chapters/story-${num}.html`);
    const html = await res.text();
    showStoryHub(false);
    stageContainer.innerHTML = html;
    currentStoryStage = num;
  } catch (e) {
    console.error('Failed to load story stage', e);
  }
}

// 스테이지에서 허브로 돌아가기
window.closeStoryStage = function() {
  const stageContainer = document.getElementById('story-stage-container');
  if (stageContainer) stageContainer.innerHTML = '';
  currentStoryStage = 0;
  showStoryHub(true);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 스토리 내 링크 클릭 처리 (용어사전 + 챕터 탭 모두 지원)
function initTermLinks() {
  document.addEventListener('click', (e) => {
    // 용어사전 링크 (data-term)
    const termLink = e.target.closest('.term-link[data-term]');
    if (termLink) {
      e.preventDefault();
      saveStoryPosition();
      switchTab('intro', termLink.dataset.term);
      return;
    }

    // 챕터 탭 링크 (data-ch, data-section)
    const chLink = e.target.closest('.ch-link[data-ch]');
    if (chLink) {
      e.preventDefault();
      saveStoryPosition();
      switchTab(chLink.dataset.ch, chLink.dataset.section || null);
      return;
    }
  });

  // 돌아가기 버튼 생성
  const backBtn = document.createElement('button');
  backBtn.id = 'back-to-story';
  backBtn.className = 'back-to-story-btn';
  backBtn.innerHTML = '← 스토리로 돌아가기';
  backBtn.style.display = 'none';
  backBtn.addEventListener('click', () => {
    const savedPos = storyScrollPos;
    const savedStage = savedStoryStage;

    backBtn.style.display = 'none';

    // 스토리 탭으로 전환 (허브 리셋 방지를 위해 cameFromStory 이용)
    cameFromStory = true;

    // 탭 전환 (스크롤 없이)
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));
    const btn = document.querySelector('[data-ch="story"]');
    if (btn) btn.classList.add('active');
    const chapter = document.getElementById('story');
    if (chapter) chapter.classList.add('active');

    cameFromStory = false;

    // 스테이지가 열려있었으면 다시 로드 후 스크롤 복원
    if (savedStage > 0) {
      loadStoryStage(savedStage).then(() => {
        setTimeout(() => window.scrollTo(0, savedPos), 150);
      });
    } else {
      setTimeout(() => window.scrollTo(0, savedPos), 100);
    }
  });
  document.body.appendChild(backBtn);
}

// 스토리 위치 저장
function saveStoryPosition() {
  storyScrollPos = window.scrollY;
  savedStoryStage = currentStoryStage;
  cameFromStory = true;
}

loadChapters();
