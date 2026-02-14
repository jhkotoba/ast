import { createMenu, defaultMenuList } from "/ast/script/common/menu.js";

function bindMenuNavigation(asideEl) {
  asideEl.addEventListener("click", (event) => {
    const target = event.target.closest("[data-url]");
    if (!target) {
      return;
    }
    const url = target.dataset.url;
    if (!url) {
      return;
    }
    window.location.href = url;
  });
}

export function initLayout() {
  const asideEl = document.querySelector("aside");
  if (!asideEl) {
    return;
  }
  asideEl.innerHTML = createMenu(defaultMenuList, window.location.pathname);
  bindMenuNavigation(asideEl);
}

window.addEventListener("DOMContentLoaded", () => {
  initLayout();
});
