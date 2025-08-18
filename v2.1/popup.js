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

  const infoBtn = document.getElementById('infoBtn');
  const infoPage = document.getElementById('infoPage');
  const updateBtn = document.getElementById('updateBtn');
  const contactBtn = document.getElementById('contactBtn');
  const updatePage = document.getElementById('updatePage');
  const backFromInfo = document.getElementById('backFromInfo');
  const backFromUpdate = document.getElementById('backFromUpdate');

  function renderList(container, arr, type) {
    container.innerHTML = '';
    arr.forEach((item, idx) => {
      const li = document.createElement('li');
      li.textContent = item;
      const delBtn = document.createElement('button');
      delBtn.textContent = '삭제';
      delBtn.className = 'delBtn';
      delBtn.addEventListener('click', () => deleteItem(type, idx));
      li.appendChild(delBtn);
      container.appendChild(li);
    });
  }

  function deleteItem(type, index) {
    const key = type === 'keyword' ? 'userKeywords' : 'userNegatives';
    chrome.storage.sync.get([key], data => {
      const arr = data[key] || [];
      if(index<0 || index>=arr.length) return;
      arr.splice(index,1);
      chrome.storage.sync.set({[key]:arr}, () => renderList(type==='keyword'?keywordList:negativeList, arr,type));
      refreshBtn.style.display='block';
    });
  }

  function fadeIn(element) {
    element.style.opacity = 0;
    element.style.display = 'block';
    let last = +new Date();
    const tick = function() {
      element.style.opacity = +element.style.opacity + (new Date() - last) / 200;
      last = +new Date();
      if (+element.style.opacity < 1) {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
      }
    };
    tick();
  }

  function fadeOut(element, callback) {
    element.style.opacity = 1;
    let last = +new Date();
    const tick = function() {
      element.style.opacity = +element.style.opacity - (new Date() - last) / 200;
      last = +new Date();
      if (+element.style.opacity > 0) {
        (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 16);
      } else {
        element.style.display = 'none';
        if(callback) callback();
      }
    };
    tick();
  }

  function showBunjangUI() {
    fadeIn(bunjangUI);
    notBunjangMessage.style.display='none';
    fadeOut(infoPage);
    fadeOut(updatePage);

    chrome.storage.sync.get(['autoSearchEnabled','userKeywords','userNegatives'], data => {
      autoSearchToggle.checked=data.autoSearchEnabled ?? true;
      renderList(keywordList, data.userKeywords || [], 'keyword');
      renderList(negativeList, data.userNegatives || [], 'negative');
    });
    refreshBtn.style.display='none';
    infoBtn.style.display='block';
  }

  function showNotBunjangUI() {
    fadeOut(bunjangUI);
    fadeIn(notBunjangMessage);
    fadeOut(infoPage);
    fadeOut(updatePage);
    refreshBtn.style.display='none';
    infoBtn.style.display='block';
  }

  // 자동검색
  autoSearchToggle.addEventListener('change', () => {
    chrome.storage.sync.set({autoSearchEnabled:autoSearchToggle.checked});
    refreshBtn.style.display='block';
  });

  refreshBtn.addEventListener('click', () => {
    chrome.tabs.query({active:true,currentWindow:true}, tabs => {
      if(!tabs[0]) return;
      chrome.tabs.reload(tabs[0].id);
    });
    refreshBtn.style.display='none';
  });

  addKeywordBtn.addEventListener('click', () => {
    const val = keywordInput.value.trim(); if(!val) return alert('키워드를 입력하세요.');
    chrome.storage.sync.get(['userKeywords'], data => {
      const arr = data.userKeywords || [];
      arr.push(val);
      chrome.storage.sync.set({userKeywords:arr}, () => { renderList(keywordList, arr,'keyword'); keywordInput.value=''; refreshBtn.style.display='block'; });
    });
  });

  addNegativeBtn.addEventListener('click', () => {
    const val = negativeInput.value.trim(); if(!val) return alert('부정 표현을 입력하세요.');
    chrome.storage.sync.get(['userNegatives'], data => {
      const arr = data.userNegatives || [];
      arr.push(val);
      chrome.storage.sync.set({userNegatives:arr}, () => { renderList(negativeList, arr,'negative'); negativeInput.value=''; refreshBtn.style.display='block'; });
    });
  });

  negativeHelpToggle.addEventListener('click', () => {
    negativeHelp.style.display = negativeHelp.style.display === 'none' ? 'block' : 'none';
  });

  advancedToggleBtn.addEventListener('click', () => { advancedSettings.classList.toggle('open'); });
  goBunjangBtn.addEventListener('click', () => { window.open('https://m.bunjang.co.kr'); });

  // 정보 페이지
  infoBtn.addEventListener('click', () => {
    fadeOut(bunjangUI);
    fadeOut(notBunjangMessage);
    fadeIn(infoPage);
    infoBtn.style.display='none';
  });

  backFromInfo.addEventListener('click', () => {
    fadeOut(infoPage, showBunjangUI);
  });

  updateBtn.addEventListener('click', () => {
    fadeOut(infoPage, () => fadeIn(updatePage));
  });

  backFromUpdate.addEventListener('click', () => {
    fadeOut(updatePage, () => fadeIn(infoPage));
  });

  contactBtn.addEventListener('click',()=>{
    chrome.tabs.create({ url: 'mailto:minsikebub@gmail.com?subject=문의하기' });
  });

  // 초기화
  chrome.tabs.query({active:true,currentWindow:true}, tabs => {
    const url = tabs[0]?.url || '';
    if(url.includes('bunjang.co.kr')) showBunjangUI();
    else showNotBunjangUI();
  });
});
