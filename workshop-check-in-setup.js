const setupForm = document.querySelector("#setup-form");
const openButton = document.querySelector("#open-button");
const closeButton = document.querySelector("#close-button");
const setupStatus = document.querySelector("#setup-status");
const setupSuccess = document.querySelector("#setup-success");
const setupSuccessTitle = document.querySelector("#setup-success-title");
const setupSuccessCopy = document.querySelector("#setup-success-copy");
const openCheckinLink = document.querySelector("#open-checkin-link");
const adminTokenInput = document.querySelector("#admin-token");
const NETWORK_TIMEOUT_MS = 12000;

async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function eventPayload() {
  return {
    id: document.querySelector("#event-id").value.trim(),
    title: document.querySelector("#event-title").value.trim(),
    details: document.querySelector("#event-details").value.trim()
  };
}

function setBusy(busy) {
  openButton.disabled = busy;
  closeButton.disabled = busy;
}

async function runAction(action) {
  setupSuccess.hidden = true;
  setupStatus.removeAttribute("data-state");

  if (!setupForm.reportValidity()) return;
  const adminToken = adminTokenInput.value;
  setBusy(true);
  setupStatus.textContent = action === "close" ? "Closing the workshop…" : "Opening the workshop…";

  try {
    const response = await fetchWithTimeout("/api/workshop-check-in/activate", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminToken, event: eventPayload() })
    });
    const body = await response.json();
    if (!response.ok || !body.ok) throw new Error(body.message || "The setup was not confirmed.");

    adminTokenInput.value = "";
    setupStatus.textContent = "";
    setupSuccess.hidden = false;
    if (action === "close") {
      setupSuccessTitle.textContent = "The workshop is closed.";
      setupSuccessCopy.textContent = "This iPad will no longer accept attendee check-ins.";
      openCheckinLink.hidden = true;
    } else {
      setupSuccessTitle.textContent = "The workshop is open.";
      setupSuccessCopy.textContent = "This iPad is ready for attendee check-in.";
      openCheckinLink.hidden = false;
    }
    setupSuccess.focus?.();
  } catch (error) {
    setupStatus.dataset.state = "error";
    setupStatus.textContent = error.message || "The setup was not confirmed. Please try again.";
    adminTokenInput.focus();
  } finally {
    setBusy(false);
  }
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAction("open");
});

closeButton.addEventListener("click", () => runAction("close"));
