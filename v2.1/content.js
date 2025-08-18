(async () => {
  const overlayId = 'priceAgroOverlay';

  const normalize = (s) => (s || '').toLowerCase();
  const compact = (s) => normalize(s).replace(/\s+/g, '');
  const tokenize = (s) => normalize(s).split(/[^a-z0-9가-힣+\/]+/).filter(Boolean);

  function levenshteinDistance(a, b) {
    const matrix = Array.from({ length: b.length + 1 }, () => new Array(a.length + 1));
    for (let i = 0; i <= b.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b[i - 1] === a[j - 1]
            ? matrix[i - 1][j - 1]
            : Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
    return matrix[b.length][a.length];
  }
  function similarity(a, b) {
    if (!a.length && !b.length) return 1;
    const dist = levenshteinDistance(a, b);
    return 1 - dist / Math.max(a.length, b.length);
  }

  const defaultIncludeKeywords = [
    '가격 어그로',
    '가격어그로',
    '가격ㅇㄱㄹ',
    'ㄱㄱㅇㄱㄹ',
    '어그로',
  ];
  const defaultExcludeKeywords = [
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
    '가격 어그로 아님',
  ];

  const defaultListingKeywords = [
    "검색어", "쓰나미", "콘스탄틴", "비티", "픽시", "로드", "삼천리", "위아위스", "bt", "look", "룩", "엔진11", "언노운",
"써벨로", "자토바이", "스즈키", "로터", "노큐", "크랭크셋", "픽시드", "기어", "고점기어",
"로터노큐", "알듀", "아르곤18", 
, "3t", "에어로노바", "프로", "드롭바", 
"비젼", "디스크", "체인링", "에르고노바", "벨로모빌", "리컴번트", "비앙키", "짚", "앙카", 
"도스노벤타", "스컬트라", "리엑토", "엑라렌", "람보르기니", "페라리", "오토바이", "각기",
"zipp", "이즈미", "스기노", "라케타", "시마노", "신형", "피나로", "신품", "트랙", "트레", "첼로", "인터프로", "펠트", 
"리들리", "bmc", "kmg", "엔진11", "88림", "디스크휠", "mtb", "풀삭", "bmx", 
"트리픽시", "트라이얼", "그래블", "경륜", "소라", "티아그라", "프롤로고", "울레그라",
"후지", "스페셜라이즈드", "에스워스", "어드벤스", "투워니", "클라리스", "페포", "카봄", "마빅", "아르마",
"오발이", "피직", "50림", "30림", "60림", "90림", "투스포크", "림블랙켓", "스포크", "허브", "볼트셋포스트", 
"헬멧", "룩", "R96", "L96", "t10", "396", "196", "464", "364", "바미큰", "치카노", "지오스", "도마스",
"리가", "네브그루", "로가스", "로가스 다운타운", "T4", "53", "크릿디", "스프린터", "불렛", "볼텍스", "어베인",
"버나드", "큰 스탄틴", "쇼크", "디스페랄", "윈드시어", "트위터", "IV3", "IV1", "IV2", "싱귤러리티", 
"타누스", "고나", "스캇", "엘파마", "smit", "검타이어", "알카본", "알루미늄", "언노운필스",
"에이지", "엔트라", "수프라", "인터프로", "미사일", "독주", "아비아브",
"미니벨로", "위 더 피플", "선데이", "오토벨로", "자이언트", "리더", "카본픽시", "휠셋", "프레임셋", "크랭크셋", "핸들셋", "안장셋",
"드래그", "싱귤", "싱귤러리티", "Lv3", "RSF", "펄스", "보라텍스", "팀 에디션", "헌터브로스", "갓앤페", "ird", "코비", "디스오더리",
"주먹스템", "스프린트", "카르마토", "카본휠셋", "csc", "38림", "50림", "60림", "88림", "무광", "유광", "킹메이커", "303", "404",
"카본 삼발이", "카본 사발이", "카본 오발이", "애플손", "아처", "필우드", "t4", "t3", "t1", "페포", "켄도", "매쉬", "스틸", "미케",
"피스타드", "3D", "베가스트", "스기노젠", "옴니움", "블랙젠", "슈퍼젠", "tt바", "티티바", "코리마", "엔비", "탐슨", "리버티", "치넬리",
"볼트", "페럴렉스", "흑페럴", "히스토그램", "디트로이트", "아르투아", "휴스턴", "써론", "라이트비", "울트라비", "탈라리아",
"포켓바이크 프론트휠", "진바이크", "리어휠", "노바텍", "스템"

  ];
  const tradeKeywordsDefault = ['대차', '교환', '맞교환', '트레이드'];

  async function getSettings() {
    try {
      return await new Promise((resolve) =>
        chrome.storage.sync.get(
          [
            'autoSearchEnabled',
            'userKeywords',
            'userNegatives',
            'listingKeywords',
            'tradeKeywords',
            'listingAggroThreshold',
          ],
          resolve
        )
      );
    } catch (e) {
      console.error('Storage get error:', e);
      return {};
    }
  }

  function checkPriceAggroFromText(text, userKeywords = [], userNegatives = []) {
    const txt = normalize(text);
    const txtCompact = compact(text);

    const includeKeywords = [...defaultIncludeKeywords, ...userKeywords.map(normalize)];
    const excludeKeywords = [...defaultExcludeKeywords, ...userNegatives.map(normalize)];

    for (const neg of excludeKeywords) {
      const negCompact = compact(neg);
      if (txt.includes(neg) || txtCompact.includes(negCompact)) {
        return false;
      }
    }

    const words = tokenize(txt);
    const SIMI = 0.75;

    for (const key of includeKeywords) {
      const keyCompact = compact(key);
      if (txt.includes(key) || txtCompact.includes(keyCompact)) {
        return true;
      }
      for (const w of words) {
        if (similarity(w, key) >= SIMI) return true;
      }
    }
    return false;
  }

function checkListingAggroFromText(text, listingKeywords = [], tradeKeywords = [], threshold = 3) {
    const txt = normalize(text);
    const txtCompact = compact(text);

    // ✅ "검색어"가 있으면 무조건 listingAggro = true
    if (txt.includes("검색어") || txtCompact.includes("검색어")) {
        return true;
    }

    for (const t of tradeKeywords) {
        const tC = compact(t);
        if (txt.includes(t) || txtCompact.includes(tC)) {
            return false;
        }
    }

    const allKeys = [...defaultListingKeywords, ...listingKeywords.map(normalize)];
    let hit = 0;
    const seen = new Set();

    for (const key of allKeys) {
        const kC = compact(key);
        if (!kC) continue;

        if (txt.includes(key) || txtCompact.includes(kC)) {
            seen.add(kC);
            continue;
        }

        const words = tokenize(txt);
        const SIMI = 0.8;
        for (const w of words) {
            if (similarity(w, key) >= SIMI) {
                seen.add(kC);
                break;
            }
        }
    }

    hit = seen.size;
    return hit >= threshold;
}


  async function checkAggros(pid, settings) {
    try {
      const url = `https://api.bunjang.co.kr/api/pms/v3/products-detail/${pid}?viewerUid=-1`;
      const res = await fetch(url);
      if (!res.ok) return { price: false, listing: false };
      const json = await res.json();
      if (!json.data || !json.data.product) return { price: false, listing: false };

      const title = (json.data.product.title || '');
      const description = (json.data.product.description || '');
      const textToCheck = `${title} ${description}`;

      const priceAggro = checkPriceAggroFromText(
        textToCheck,
        (settings.userKeywords || []),
        (settings.userNegatives || [])
      );

      const listingAggro = checkListingAggroFromText(
        textToCheck,
        (settings.listingKeywords || []),
        (settings.tradeKeywords || tradeKeywordsDefault),
        settings.listingAggroThreshold || 40 // 40개 이상 감지
      );

      return { price: priceAggro, listing: listingAggro };
    } catch (err) {
      if (err.message !== 'Extension context invalidated.') {
        console.error('checkAggros error:', err);
      }
      return { price: false, listing: false };
    }
  }

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
      if (mainText === '완료!') checkGif.style.display = 'block';
      else checkGif.style.display = 'none';
    }
  }

  function markAgro(el, type) {
    const key = `priceAgroMarked_${type}`;
    if (el.dataset[key]) return;
    el.dataset[key] = 'true';

    const img = el.querySelector('img');
    if (!img) return;
    const imgParent = img.parentElement;
    if (!imgParent) return;

    imgParent.style.position = 'relative';

    const existing = imgParent.querySelector(`.agro-border-${type}`);
    if (existing) existing.remove();

    const borderDiv = document.createElement('div');
    borderDiv.className = `agro-border-${type}`;

    const color =
      type === 'price' ? 'red' :
      type === 'listing' ? 'orange' : 'red';

    Object.assign(borderDiv.style, {
      position: 'absolute',
      top: '-3px',
      left: '-3px',
      width: img.offsetWidth + 6 + 'px',
      height: img.offsetHeight + 6 + 'px',
      border: `3px solid ${color}`,
      pointerEvents: 'none',
      boxSizing: 'border-box',
      zIndex: '99999999',
      borderRadius: '4px',
    });
    imgParent.appendChild(borderDiv);

    let warning = imgParent.querySelector(`.agro-warning-${type}`);
    if (!warning) {
      warning = document.createElement('div');
      warning.className = `agro-warning-${type}`;

      const label =
        type === 'price' ? '⚠︎ 가격어그로 탐지됨' :
        type === 'listing' ? '⚠︎ 매물어그로 탐지됨' :
        '⚠︎ 가격·매물 어그로 탐지됨';

      Object.assign(warning.style, {
        position: 'absolute',
        top: '4px',
        right: '4px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: color,
        fontWeight: 'bold',
        fontSize: '12px',
        padding: '2px 6px',
        borderRadius: '4px',
        zIndex: '99999999',
        userSelect: 'none',
        pointerEvents: 'none',
        boxShadow: `0 0 4px ${color}`,
      });
      warning.innerText = label;
      imgParent.appendChild(warning);
    }
  }

  function markDetailPageAgro(type) {
    if (!isProductDetailPage()) return;

    const detailDesc = document.querySelector('p[style="width: 663px;"]');
    if (!detailDesc) return;

    const key = `priceAgroMarked_${type}`;
    if (detailDesc.dataset[key]) return;

    const color =
      type === 'price' ? 'red' :
      type === 'listing' ? 'orange' : 'red';

    detailDesc.style.border = `3px solid ${color}`;
    detailDesc.style.position = 'relative';
    detailDesc.dataset[key] = 'true';

    const warning = document.createElement('div');
    const label =
      type === 'price' ? '⚠︎ 가격어그로 탐지됨' :
      type === 'listing' ? '⚠︎ 매물어그로 탐지됨' :
      '⚠︎ 가격·매물 어그로 탐지됨';

    warning.className = `agro-warning-detail-${type}`;
    Object.assign(warning.style, {
      position: 'absolute',
      top: '-28px',
      left: '0',
      width: '100%',
      color: color,
      fontWeight: 'bold',
      fontSize: '16px',
      backgroundColor: 'white',
      textAlign: 'center',
      zIndex: '99999999',
      userSelect: 'none',
      pointerEvents: 'none',
      boxShadow: `0 0 4px ${color}`,
    });
    warning.innerText = label;
    detailDesc.prepend(warning);
  }

  function clearAllMarks() {
    document.querySelectorAll('[data-price-agro-marked],[data-priceAgroMarked_price],[data-priceAgroMarked_listing],[data-priceAgroMarked_both]').forEach(el => {
      el.style.border = '';
      ['price','listing','both'].forEach(t=>{
        const warn = el.querySelector(`.agro-warning-${t}`);
        const border = el.querySelector(`.agro-border-${t}`);
        if (warn) warn.remove();
        if (border) border.remove();
        delete el.dataset[`priceAgroMarked_${t}`];
      });
      delete el.dataset.priceAgroMarked;
    });

    const detailDesc = document.querySelector('p[style="width: 663px;"]');
    if (detailDesc) {
      detailDesc.style.border = '';
      ['price','listing','both'].forEach(t=>{
        const detailWarn = detailDesc.querySelector(`.agro-warning-detail-${t}`);
        if (detailWarn) detailWarn.remove();
        delete detailDesc.dataset[`priceAgroMarked_${t}`];
      });
      delete detailDesc.dataset.priceAgroMarked;
    }
  }

  function isProductDetailPage() {
    const path = location.pathname;
    return /^\/products\/\d+/.test(path);
  }
  function isMainPage() {
    return location.hostname === 'm.bunjang.co.kr' && location.pathname === '/';
  }
  function disableScroll() { document.body.style.overflow = 'hidden'; }
  function enableScroll() { document.body.style.overflow = ''; }

  async function scanAllAggro() {
    const settings = await getSettings();
    const enabled = settings.autoSearchEnabled ?? true;

    if (isProductDetailPage()) {
      clearAllMarks();
      const pidMatch = location.pathname.match(/\/products\/(\d+)/);
      if (!pidMatch) return;

      if (!enabled) return;

      const pid = pidMatch[1];
      const { price, listing } = await checkAggros(pid, settings);
      if (price && listing) markDetailPageAgro('both');
      else if (price) markDetailPageAgro('price');
      else if (listing) markDetailPageAgro('listing');
      return;
    }

    if (isMainPage()) {
      clearAllMarks();
      const overlay = createOverlay();
      overlay.style.display = 'flex';
      overlay.style.pointerEvents = 'none';
      setOverlayMessage('※ 메인화면에서는 어그로탐지기가 작동하지 않습니다!', '', 'red', '13px');
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          overlay.style.display = 'none';
          overlay.style.opacity = '1';
        }, 1500);
      }, 2000);
      return;
    }

    if (!enabled) {
      clearAllMarks();
      return;
    }

    clearAllMarks();

    const overlay = createOverlay();
    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'auto';
    disableScroll();
    setOverlayMessage('허위매물/가격어그로 검색중!', '시간이 조금 걸릴 수 있습니다.', 'red', '36px');

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

      const { price, listing } = await checkAggros(pid, settings);
      if (price && listing) markAgro(a, 'both');
      else if (price) markAgro(a, 'price');
      else if (listing) markAgro(a, 'listing');
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
        scanAllAggro();
      }, 300);
    }
  }).observe(document, { subtree: true, childList: true });

  window.addEventListener('load', () => {
    scanAllAggro();
  });
})();

// 당신 뭔데 내 코드를 뜯어보고있는거야?
// 코드에 관심이 좀 있어보이는데 협업할 마음 있으면
// 내 이메일로 연락해 깃허브에 있어