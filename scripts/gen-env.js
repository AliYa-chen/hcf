const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch (e) {
    return "unknown";
  }
}

const buildTime = run("git log -1 --date=format:'%Y-%m-%d %H:%M:%S' --format='%ad'");
const commitHash = run("git rev-parse --short HEAD");

if (!fs.existsSync("public")) fs.mkdirSync("public");

const jsText = `
window.__BUILD_INFO__ = {
  BUILD_TIME: "${buildTime}",
  COMMIT_HASH: "${commitHash}"
};

window.addEventListener("DOMContentLoaded", () => {
  const box = document.createElement("div");

  // 初始文档流底部样式
  Object.assign(box.style, {
    position: "static",
    display: "block",
    margin: "18px auto 0 auto",
    width: "90%",
    maxWidth: "900px",
    background: "rgba(0,0,0,0.65)",
    color: "#fff",
    padding: "12px 18px",
    fontSize: "14px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: "10px",
    boxShadow: "0 0 0 rgba(0,0,0,0)",
    backdropFilter: "blur(6px)",
    transition: "all 0.5s ease",
    cursor: "pointer",
    opacity: "1"
  });

  box.innerHTML = \`
      <div style="font-weight:600;margin-bottom:6px;">构建信息</div>
      <div style="line-height:1.35;">🕒 \${window.__BUILD_INFO__.BUILD_TIME}</div>
      <div style="line-height:1.35;">🔧 \${window.__BUILD_INFO__.COMMIT_HASH}</div>
  \`;

  document.body.appendChild(box);

  let hasFloating = false; // 是否已经悬浮
  let isHidden = false; // 是否已点击隐藏

  function switchToFloating() {
    if (hasFloating || isHidden) return;
    hasFloating = true;
    Object.assign(box.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      left: "",
      transform: "",
      width: "260px",
      maxWidth: "260px",
      borderRadius: "12px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.28)",
      opacity: "1"
    });
  }

  function checkScroll() {
    if (hasFloating || isHidden) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const winH = window.innerHeight || document.documentElement.clientHeight;
    const docH = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );

    if (scrollTop + winH >= docH - 20) {
      switchToFloating();
    }
  }

  // 点击隐藏悬浮盒子
  box.addEventListener("click", () => {
    if (!hasFloating || isHidden) return;
    isHidden = true;
    // 平滑隐藏
    box.style.opacity = "0";
    setTimeout(() => {
      box.style.display = "none";
    }, 500);
  });

  window.addEventListener("scroll", checkScroll, { passive: true });
  window.addEventListener("resize", checkScroll);
  checkScroll();
});
`.trim() + "\n";

fs.writeFileSync(path.join("public", "env.js"), jsText);
console.log("✔ 已生成 public/env.js（底部 -> 滑到底悬浮 + 动画 + 点击隐藏）");
