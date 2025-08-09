const bunjangUI = document.getElementById('bunjangUI');
const notBunjangMessage = document.getElementById('notBunjangMessage');
const autoSearchToggle = document.getElementById('autoSearchToggle');
const refreshBtn = document.getElementById('refreshBtn');
const goBunjangBtn = document.getElementById('goBunjangBtn');

function isBunjangHost(hostname) {
  return hostname.endsWith('bunjang.co.kr');
}

function showBunjangUI() {
  bunjangUI.style.display = 'block';
  notBunjangMessage.style.display = 'none';

  chrome.storage.sync.get(['autoSearchEnabled'], (data) => {
    autoSearchToggle.checked = data.autoSearchEnabled ?? true;
  });

  refreshBtn.style.display = 'none'; // 초기엔 숨김

  // 토글 이벤트: 상태 저장 + 새로고침 버튼 보이기
  autoSearchToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ autoSearchEnabled: autoSearchToggle.checked });
    refreshBtn.style.display = 'block';
  });

  // 새로고침 버튼 클릭 시 현재 활성 탭 새로고침
  refreshBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      chrome.tabs.reload(tabs[0].id);
    });
    refreshBtn.style.display = 'none'; // 새로고침 후 버튼 숨김
  });
}

function showNotBunjangUI() {
  bunjangUI.style.display = 'none';
  notBunjangMessage.style.display = 'block';

  refreshBtn.style.display = 'none'; // 숨김 혹시 모르니까

  goBunjangBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://m.bunjang.co.kr/' });
  });
}

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (!tabs[0]) {
    showNotBunjangUI();
    return;
  }
  try {
    const url = new URL(tabs[0].url);
    if (isBunjangHost(url.hostname)) {
      showBunjangUI();
    } else {
      showNotBunjangUI();
    }
  } catch {
    showNotBunjangUI();
  }
});
