(async () => {
  try {
    const scriptUrl = "https://scr1minsik.github.io/bunjang-cleaner/main.js";

    const res = await fetch(scriptUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("코드 불러오기 실패 - 상태 코드: " + res.status);

    const code = await res.text();

    // 현재 탭에 스크립트 주입 실행
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs.length) return console.error("[번장 확장] 활성 탭 없음");
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: new Function(code),
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("[번장 확장] 스크립트 실행 오류:", chrome.runtime.lastError.message);
        }
      });
    });
  } catch (err) {
    console.error("[번장 확장] 업데이트 로드 실패:", err);
  }
})();
