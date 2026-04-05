// Chapter loading & tab navigation
const chapters = ['intro', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'appendix'];
const container = document.getElementById('chapters-container');

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
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.chapter').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.ch).classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

loadChapters();
