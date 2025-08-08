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
        fontSize: '30px',  // 허위매물 글자 크기 조정하는곳
        fontWeight: 'bold',
        color: 'black',
        marginBottom: '10px',
      });
      message.innerText = '허위매물 검색중!';

      const subMessage = document.createElement('div');
      subMessage.id = 'priceAgroSubMessage';
      Object.assign(subMessage.style, {
        fontSize: '14px',  // 시간 걸리는거 글자 크기 조정하는곳
        color: 'black',
      });
      subMessage.innerText = '시간이 조금 걸릴 수 있습니다.';

      overlay.appendChild(message);
      overlay.appendChild(subMessage);
      document.body.appendChild(overlay);
    }
    return overlay;
  }

  function setOverlayMessage(mainText, subText, color, fontSize = '14px') {
    const message = document.getElementById('priceAgroMessage');
    const subMessage = document.getElementById('priceAgroSubMessage');
    if (message) {
      message.innerText = mainText;
      message.style.color = color;
      message.style.fontSize = fontSize;
    }
    if (subMessage) {
      subMessage.innerText = subText || '';
      subMessage.style.color = color;
      subMessage.style.fontSize = fontSize;
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
      const description = json.data.product.description || '';
      const descLower = description.toLowerCase();

      if (
        (descLower.includes('가격어그로') || descLower.includes('어그로')) &&
        !/(가격어그로\s?x|가격어그로\s?아님|가격어그로\s?ㄴ+|가격어그로\s?아닙니다)/.test(descLower)
      ) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  function markPriceAgro(el) {
    if (el.dataset.priceAgroMarked) return;
    el.dataset.priceAgroMarked = 'true';
    el.style.border = '3px solid red';
  }

  function clearAllMarks() {
    document.querySelectorAll('[data-price-agro-marked]').forEach(el => {
      el.style.border = '';
      delete el.dataset.priceAgroMarked;
    });
  }

  async function scanAllPriceAgro() {
    if (isProductDetailPage()) {
      clearAllMarks();
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

    chrome.storage.sync.get(['autoSearchEnabled'], async (data) => {
      const enabled = data.autoSearchEnabled ?? true;
      if (!enabled) {
        clearAllMarks();
        return;
      }

      clearAllMarks();

      const overlay = createOverlay();
      overlay.style.display = 'flex';
      overlay.style.pointerEvents = 'auto';
      disableScroll();
      setOverlayMessage('허위매물 검색중!', '시간이 조금 걸릴 수 있습니다.', 'black');

      const productAnchors = Array.from(document.querySelectorAll('a[data-pid]'));
      const pidElements = productAnchors.map(a => ({
        pid: a.getAttribute('data-pid'),
        el: a,
      }));

      for (const { pid, el } of pidElements) {
        if (!pid) continue;
        const hasAgro = await checkPriceAgro(pid);
        if (hasAgro) {
          markPriceAgro(el);
        }
      }

      setOverlayMessage('완료!', '', 'green');

      setTimeout(() => {
        overlay.style.opacity = '0';
        enableScroll();
        setTimeout(() => {
          overlay.style.display = 'none';
          overlay.style.opacity = '1';
        }, 1500);
      }, 1500);
    });
  }

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(() => {
        scanAllPriceAgro();
      }, 500);
    }
  }).observe(document, { subtree: true, childList: true });

  window.addEventListener('load', () => {
    scanAllPriceAgro();
  });

  setInterval(() => {
    scanAllPriceAgro();
  }, 60000);
})();
