const MAX_TOAST_COUNT = 5;
const DEFAULT_DURATION = 10000;

let containerEl = null;

function ensureContainer() {
  if (containerEl) {
    return containerEl;
  }

  containerEl = document.createElement("div");
  containerEl.className = "toast-container";
  document.body.appendChild(containerEl);
  return containerEl;
}

function removeOldestIfNeeded(container) {
  while (container.children.length > MAX_TOAST_COUNT) {
    container.removeChild(container.firstElementChild);
  }
}

function dismissToast(toastEl) {
  toastEl.classList.add("hide");
  window.setTimeout(() => {
    toastEl.remove();
  }, 220);
}

export function showToast(message, options = {}) {
  if (!message) {
    return;
  }

  const type = options.type === "error" ? "error" : options.type === "success" ? "success" : "";
  const duration = Number.isFinite(options.duration) ? options.duration : DEFAULT_DURATION;
  const container = ensureContainer();

  const toastEl = document.createElement("div");
  toastEl.className = `toast${type ? ` ${type}` : ""}`;
  toastEl.textContent = String(message);

  container.appendChild(toastEl);
  removeOldestIfNeeded(container);

  window.setTimeout(() => {
    dismissToast(toastEl);
  }, Math.max(1000, duration));
}
