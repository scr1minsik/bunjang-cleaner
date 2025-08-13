window.addEventListener('DOMContentLoaded', () => {
  const bunjangUI = document.getElementById('bunjangUI');
  const notBunjangMessage = document.getElementById('notBunjangMessage');
  const autoSearchToggle = document.getElementById('autoSearchToggle');
  const refreshBtn = document.getElementById('refreshBtn');
  const goBunjangBtn = document.getElementById('goBunjangBtn');

  const advancedToggleBtn = document.getElementById('advancedToggleBtn');
  const advancedSettings = document.getElementById('advancedSettings');

  const keywordInput = document.getElementById('keywordInput');
  const addKeywordBtn = document.getElementById('addKeywordBtn');
  const keywordList = document.getElementById('keywordList');

  const negativeInput = document.getElementById('negativeInput');
  const addNegativeBtn = document.getElementById('addNegativeBtn');
  const negativeList = document.getElementById('negativeList');

  const negativeHelpToggle = document.getElementById('negativeHelpToggle');
  const negativeHelp = document.getElementById('negativeHelp');

  function isBunjangHost(hostname) {
    return hostname.endsWith('bunjang.co.kr');
  }

  function renderList(container, arr, type) {
    container.innerHTML = '';
    arr.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = item;
      const delBtn = document.createElement('button');
      delBtn.textContent = '삭제';
      delBtn.className = 'delBtn';
      delBtn.addEventListener('click', () => {
        deleteItem(type, idx);
      });
      li.appendChild(delBtn);
      container.appendChild(li);
    });
  }

  function deleteItem(type, index) {
    const key = type === 'keyword' ? 'userKeywords' : 'userNegatives';
    chrome.storage.sync.get([key], (data) => {
      const arr = data[key] || [];
      if (index < 0 || index >= arr.length) return;
      arr.splice(index, 1);
      chrome.storage.sync.set({ [key]: arr }, () => {
        if (type === 'keyword') renderList(keywordList, arr, type);
        else renderList(negativeList, arr, type);
        refreshBtn.style.display = 'block';
      });
    });
  }

  function showBunjangUI() {
    bunjangUI.style.display = 'block';
    notBunjangMessage.style.display = 'none';

    chrome.storage.sync.get(['autoSearchEnabled', 'userKeywords', 'userNegatives'], (data) => {
      autoSearchToggle.checked = data.autoSearchEnabled ?? true;
      renderList(keywordList, data.userKeywords || [], 'keyword');
      renderList(negativeList, data.userNegatives || [], 'negative');
    });

    refreshBtn.style.display = 'none';

    autoSearchToggle.addEventListener('change', () => {
      chrome.storage.sync.set({ autoSearchEnabled: autoSearchToggle.checked });
      refreshBtn.style.display = 'block';
    });

    refreshBtn.addEventListener('click', () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        chrome.tabs.reload(tabs[0].id);
      });
      refreshBtn.style.display = 'none';
    });

    addKeywordBtn.addEventListener('click', () => {
      const val = keywordInput.value.trim();
      if (!val) return alert('키워드를 입력하세요.');
      chrome.storage.sync.get(['userKeywords'], (data) => {
        const arr = data.userKeywords || [];
        if (arr.includes(val)) {
          alert('이미 등록된 키워드입니다.');
          return;
        }
        arr.push(val);
        chrome.storage.sync.set({ userKeywords: arr }, () => {
          keywordInput.value = '';
          renderList(keywordList, arr, 'keyword');
          refreshBtn.style.display = 'block';
        });
      });
    });

    addNegativeBtn.addEventListener('click', () => {
      const val = negativeInput.value.trim();
      if (!val) return alert('부정 표현을 입력하세요.');
      chrome.storage.sync.get(['userNegatives'], (data) => {
        const arr = data.userNegatives || [];
        if (arr.includes(val)) {
          alert('이미 등록된 부정 표현입니다.');
          return;
        }
        arr.push(val);
        chrome.storage.sync.set({ userNegatives: arr }, () => {
          negativeInput.value = '';
          renderList(negativeList, arr, 'negative');
          refreshBtn.style.display = 'block';
        });
      });
    });
  }

  function showNotBunjangUI() {
    bunjangUI.style.display = 'none';
    notBunjangMessage.style.display = 'block';

    refreshBtn.style.display = 'none';

    goBunjangBtn.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://m.bunjang.co.kr/' });
    });
  }

  // 고급설정 토글 이벤트
  advancedToggleBtn.addEventListener('click', () => {
  if (!advancedSettings.classList.contains('open')) {
    advancedSettings.classList.add('open');
    advancedToggleBtn.textContent = '< 고급 설정 접기';
  } else {
    advancedSettings.classList.remove('open');
    advancedToggleBtn.textContent = '> 고급 설정 관리';
  }
});

  // 부정 표현 ? 버튼 클릭 이벤트
  negativeHelpToggle.addEventListener('click', () => {
    if (negativeHelp.style.display === 'none' || negativeHelp.style.display === '') {
      negativeHelp.style.display = 'block';
    } else {
      negativeHelp.style.display = 'none';
    }
  });

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
});
