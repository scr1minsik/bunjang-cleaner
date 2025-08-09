(async () => {
  const overlayId = 'priceAgroOverlay';

  function createOverlay() {
    let overlay = document.getElementById(overlayId);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = overlayId;
      Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255,255,255,0.85)',
        zIndex: '9999999',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        userSelect: 'none',
        transition: 'opacity 1.5s ease',
      });

      const message = document.createElement('div');
      message.id = 'priceAgroMessage';
      Object.assign(message.style, {
        fontSize: '36px',
        fontWeight: 'bold',
        color: 'red',
        marginBottom: '10px',
        textAlign: 'center',
      });
      overlay.appendChild(message);

      const checkGif = document.createElement('img');
      checkGif.id = 'checkGif';
      checkGif.src = chrome.runtime.getURL('check.gif');
      Object.assign(checkGif.style, {
        width: '80px',
        height: '80px',
        display: 'none',
        marginBottom: '10px',
      });
      overlay.appendChild(checkGif);

      const subMessage = document.createElement('div');
      subMessage.id = 'priceAgroSubMessage';
      Object.assign(subMessage.style, {
        fontSize: '18px',
        color: 'black',
        textAlign: 'center',
      });
      overlay.appendChild(subMessage);

      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function setOverlayMessage(mainText, subText, mainColor, mainFontSize = '14px') {
    const message = document.getElementById('priceAgroMessage');
    const subMessage = document.getElementById('priceAgroSubMessage');
    const checkGif = document.getElementById('checkGif');

    if (message) {
      message.innerText = mainText;
      message.style.color = mainColor;
      message.style.fontSize = mainFontSize;
    }

    if (subMessage) {
      subMessage.innerText = subText || '';
      subMessage.style.color = 'black';
      subMessage.style.fontSize = (parseInt(mainFontSize) / 2) + 'px';
    }

    if (checkGif) {
      if (mainText === '완료!') {
        checkGif.style.display = 'block';
      } else {
        checkGif.style.display = 'none';
      }
    }
  }

  function disableScroll() {
    document.body.style.overflow = 'hidden';
  }

  function enableScroll() {
    document.body.style.overflow = '';
  }

  function isProductDetailPage() {
    const path = location.pathname;
    return /^\/products\/\d+/.test(path);
  }

  function isMainPage() {
    return location.hostname === 'm.bunjang.co.kr' && location.pathname === '/';
  }

  async function checkPriceAgro(pid) {
    try {
      const url = `https://api.bunjang.co.kr/api/pms/v3/products-detail/${pid}?viewerUid=-1`;
      const res = await fetch(url);
      if (!res.ok) return false;
      const json = await res.json();
      if (!json.data || !json.data.product) return false;

      const title = (json.data.product.title || '').toLowerCase();
      const description = (json.data.product.description || '').toLowerCase();
      const textToCheck = title + ' ' + description;

      const regexExclude = /(가격어그로\s?x|가격어그로\s?아님|가격어그로\s?ㄴ+|가격어그로\s?아닙니다)/;

      if (regexExclude.test(textToCheck)) return false;

      const includeKeywords = [
        '가격 어그로',
        '가격어그로',
        '가격ㅇㄱㄹ',
        'ㄱㄱㅇㄱㄹ',
        '어그로',
      ];

      const excludeKeywords = [
        '가격어그로x',
        '가격어그로 아님',
        '가격어그로 아닙니다',
        '가격어그로 아니예요',
        '가격어그로아님',
        '가격어그로 x',
        '가격 어그로 x',
        '가격 어그로 아닙니다',
        '가격 어그로 아님!',
        '어그로 아니에요',
        '가격어그로ㄴㄴ',
        '가격 어그로 아닙니다',
      ];

      for (const ex of excludeKeywords) {
        if (textToCheck.includes(ex)) return false;
      }

      for (const inc of includeKeywords) {
        if (textToCheck.includes(inc)) return true;
      }

      if (textToCheck.includes('가격어그로') || textToCheck.includes('어그로')) return true;

      return false;
    } catch (err) {
      if (err.message !== 'Extension context invalidated.') {
        console.error('checkPriceAgro error:', err);
      }
      return false;
    }
  }

  function markPriceAgro(el) {
    if (el.dataset.priceAgroMarked) return;
    el.dataset.priceAgroMarked = 'true';

    const img = el.querySelector('img');
    if (img) {
      const imgParent = img.parentElement;
      if (imgParent) {
        imgParent.style.position = 'relative';

        const existingBorder = imgParent.querySelector('.price-agro-border');
        if (existingBorder) existingBorder.remove();

        const borderDiv = document.createElement('div');
        borderDiv.className = 'price-agro-border';
        Object.assign(borderDiv.style, {
          position: 'absolute',
          top: '-3px',
          left: '-3px',
          width: img.offsetWidth + 6 + 'px',
          height: img.offsetHeight + 6 + 'px',
          border: '3px solid red',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: '99999999',
          borderRadius: '4px',
        });
        imgParent.appendChild(borderDiv);

        let warning = imgParent.querySelector('.price-agro-warning');
        if (!warning) {
          warning = document.createElement('div');
          warning.className = 'price-agro-warning';
          warning.innerText = '⚠︎ 가격어그로 탐지됨';
          Object.assign(warning.style, {
            position: 'absolute',
            top: '4px',
            right: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            color: 'red',
            fontWeight: 'bold',
            fontSize: '12px',
            padding: '2px 6px',
            borderRadius: '4px',
            zIndex: '99999999',
            userSelect: 'none',
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(255, 0, 0, 1)',
          });
          imgParent.appendChild(warning);
        }
      }
    }
  }

  function clearAllMarks() {
    document.querySelectorAll('[data-price-agro-marked]').forEach(el => {
      el.style.border = '';
      const warn = el.querySelector('.price-agro-warning');
      if (warn) warn.remove();
      delete el.dataset.priceAgroMarked;
    });

    const detailDesc = document.querySelector('p[style="width: 663px;"]');
    if (detailDesc) {
      detailDesc.style.border = '';
      const detailWarn = detailDesc.querySelector('.price-agro-warning-detail');
      if (detailWarn) detailWarn.remove();
      delete detailDesc.dataset.priceAgroMarked;
    }
  }

  async function markDetailPageAgro() {
    if (!isProductDetailPage()) return;

    const detailDesc = document.querySelector('p[style="width: 663px;"]');
    if (!detailDesc) return;

    if (detailDesc.dataset.priceAgroMarked) return;

    detailDesc.style.border = '3px solid red';
    detailDesc.style.position = 'relative';
    detailDesc.dataset.priceAgroMarked = 'true';

    const warning = document.createElement('div');
    warning.className = 'price-agro-warning-detail';
    warning.innerText = '⚠︎ 가격어그로 탐지됨';
    Object.assign(warning.style, {
      position: 'absolute',
      top: '-28px',
      left: '0',
      width: '100%',
      color: 'red',
      fontWeight: 'bold',
      fontSize: '16px',
      backgroundColor: 'white',
      textAlign: 'center',
      zIndex: '99999999',
      userSelect: 'none',
      pointerEvents: 'none',
      boxShadow: '0 0 4px rgba(255,0,0,0.7)',
    });
    detailDesc.prepend(warning);
  }

  async function scanAllPriceAgro() {
    if (isProductDetailPage()) {
      clearAllMarks();

      const pidMatch = location.pathname.match(/\/products\/(\d+)/);
      if (!pidMatch) return;

      const pid = pidMatch[1];
      const hasAgro = await checkPriceAgro(pid);
      if (hasAgro) {
        await markDetailPageAgro();
      }
      return;
    }

    if (isMainPage()) {
      clearAllMarks();
      const overlay = createOverlay();
      overlay.style.display = 'flex';
      overlay.style.pointerEvents = 'none';
      setOverlayMessage('※ 메인화면에서는 어그로탐지기가 작동하지않습니다!', '', 'red', '13px');
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          overlay.style.opacity = '1';
        }, 1500);
      }, 2000);
      return;
    }

    let enabled;
    try {
      const data = await new Promise((resolve) =>
        chrome.storage.sync.get(['autoSearchEnabled'], resolve)
      );
      enabled = data.autoSearchEnabled ?? true;
      if (!enabled) {
        clearAllMarks();
        return;
      }
    } catch (e) {
      console.error('Storage get error:', e);
      clearAllMarks();
      return;
    }

    clearAllMarks();

    const overlay = createOverlay();
    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'auto';
    disableScroll();
    setOverlayMessage('허위매물 검색중!', '시간이 조금 걸릴 수 있습니다.', 'red', '36px');

    const productAnchors = Array.from(document.querySelectorAll('a[data-pid]')).filter(a => a.getAttribute('data-pid'));
    if (productAnchors.length === 0) {
      setOverlayMessage('상품을 찾을 수 없습니다.', '', 'red');
      setTimeout(() => {
        overlay.style.opacity = '0';
        enableScroll();
        setTimeout(() => {
          overlay.style.display = 'none';
          overlay.style.opacity = '1';
        }, 1500);
      }, 1500);
      return;
    }

    for (const a of productAnchors) {
      const pid = a.getAttribute('data-pid');
      if (!pid) continue;
      const hasAgro = await checkPriceAgro(pid);
      if (hasAgro) {
        markPriceAgro(a);
      }
    }

    setOverlayMessage('완료!', '', 'green', '36px');

    setTimeout(() => {
      overlay.style.opacity = '0';
      enableScroll();
      setTimeout(() => {
        overlay.style.display = 'none';
        overlay.style.opacity = '1';
      }, 1500);
    }, 1500);
  }

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        scanAllPriceAgro();
      }, 300);
    }
  }).observe(document, { subtree: true, childList: true });

  window.addEventListener('load', () => {
    scanAllPriceAgro();
  });
})();
