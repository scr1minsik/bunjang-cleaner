const bunjangUI = document.getElementById('bunjangUI');
const notBunjangMessage = document.getElementById('notBunjangMessage');
const autoSearchToggle = document.getElementById('autoSearchToggle');

function isBunjangHost(hostname) {
  return hostname.endsWith('bunjang.co.kr');
}

function showBunjangUI() {
  bunjangUI.style.display = 'block';
  notBunjangMessage.style.display = 'none';

  chrome.storage.sync.get(['autoSearchEnabled'], (data) => {
    autoSearchToggle.checked = data.autoSearchEnabled ?? true;
  });

  autoSearchToggle.addEventListener('change', () => {
    chrome.storage.sync.set({ autoSearchEnabled: autoSearchToggle.checked });
  });
}

function showNotBunjangUI() {
  bunjangUI.style.display = 'none';
  notBunjangMessage.style.display = 'block';
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
