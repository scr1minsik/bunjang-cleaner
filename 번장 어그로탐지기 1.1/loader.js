(async () => {
  try {
    const scriptUrl = "https://scr1minsik.github.io/bunjang-cleaner/main.js"; // 본인 GitHub Pages 주소로 변경

    const res = await fetch(scriptUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("코드 불러오기 실패");

    const code = await res.text();
    eval(code);
  } catch (err) {
    console.error("[번장 확장] 업데이트 로드 실패:", err);
  }
})();
