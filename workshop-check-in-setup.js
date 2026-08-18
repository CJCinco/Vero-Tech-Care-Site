const setupForm = document.querySelector("#setup-form");
const openButton = document.querySelector("#open-button");
const closeButton = document.querySelector("#close-button");
const setupStatus = document.querySelector("#setup-status");
const setupSuccess = document.querySelector("#setup-success");
const setupSuccessTitle = document.querySelector("#setup-success-title");
const setupSuccessCopy = document.querySelector("#setup-success-copy");
const openCheckinLink = document.querySelector("#open-checkin-link");
const setupPasswordInput = document.querySelector("#setup-password");
const NETWORK_TIMEOUT_MS = 12000;
const BUTTON_LABELS = {
  open: "Open and activate this iPad",
  close: "Close this workshop"
};
let requestInFlight = false;

async function fetchWithTimeout(resource, options = {}) {
  if (typeof AbortController === "undefined") {
    return fetch(resource, options);
  }

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
    title: document.querySelector("#event-title").value.trim(),
    details: document.querySelector("#event-details").value.trim()
  };
}

function setStatus(message, state) {
  setupStatus.textContent = message;
  setupStatus.setAttribute("role", state === "error" ? "alert" : "status");
  setupStatus.setAttribute("aria-live", state === "error" ? "assertive" : "polite");
  if (state) {
    setupStatus.dataset.state = state;
  } else {
    setupStatus.removeAttribute("data-state");
  }
}

function focusAndReveal(element) {
  const reveal = () => {
    try {
      element.focus({ preventScroll: true });
    } catch {
      element.focus();
    }

    try {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {
      element.scrollIntoView();
    }
  };

  requestAnimationFrame(() => {
    reveal();
    setTimeout(reveal, 250);
  });
}

function setBusy(busy, action) {
  openButton.disabled = busy;
  closeButton.disabled = busy;
  setupForm.setAttribute("aria-busy", busy ? "true" : "false");
  openButton.textContent = busy && action === "open" ? "Opening workshop…" : BUTTON_LABELS.open;
  closeButton.textContent = busy && action === "close" ? "Closing workshop…" : BUTTON_LABELS.close;
}

function userFacingError(error) {
  if (error && error.name === "AbortError") {
    return "The request took too long. Check the connection and try again. Nothing was cleared.";
  }
  if (error instanceof TypeError) {
    return "The setup could not reach Vero Tech Care. Check Wi-Fi and try again. Nothing was cleared.";
  }
  return `${(error && error.message) || "The setup was not confirmed. Please try again."} Nothing was cleared.`;
}

function reportValidationError() {
  const invalidField = setupForm.querySelector(":invalid");
  if (invalidField) invalidField.setAttribute("aria-invalid", "true");

  let message = "Please check the highlighted field before continuing. Nothing was cleared.";
  if (invalidField === setupPasswordInput) {
    message = "Enter the setup password, using at least 10 characters. Nothing was cleared.";
  }

  setStatus(message, "error");
  setupForm.reportValidity();
  focusAndReveal(setupStatus);
}

async function runAction(action) {
  if (requestInFlight) return;

  setupSuccess.hidden = true;
  setStatus("", "");

  if (!setupForm.checkValidity()) {
    reportValidationError();
    return;
  }
  if (!setupPasswordInput) {
    setStatus("This setup page is out of date. Reload it and try again. Nothing was cleared.", "error");
    focusAndReveal(setupStatus);
    return;
  }

  requestInFlight = true;
  setBusy(true, action);
  setStatus(action === "close" ? "Closing the workshop…" : "Opening the workshop…", "working");

  try {
    const setupPassword = setupPasswordInput.value;
    const response = await fetchWithTimeout("/api/workshop-check-in/activate", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, setupPassword, event: eventPayload() })
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error("The setup response could not be verified. Please try again.");
    }
    if (!response.ok || !body.ok) throw new Error(body.message || "The setup was not confirmed.");

    setupPasswordInput.value = "";
    setupSuccess.hidden = false;
    if (action === "close") {
      setupSuccessTitle.textContent = "The workshop is closed.";
      setupSuccessCopy.textContent = "This iPad will no longer accept attendee check-ins.";
      openCheckinLink.hidden = true;
      setStatus("Success. The workshop is closed.", "success");
    } else {
      setupSuccessTitle.textContent = "The workshop is open.";
      setupSuccessCopy.textContent = "This iPad is ready for attendee check-in.";
      openCheckinLink.hidden = false;
      setStatus("Success. The workshop is open and this iPad is ready.", "success");
    }
    focusAndReveal(setupSuccess);
  } catch (error) {
    setStatus(userFacingError(error), "error");
    focusAndReveal(setupStatus);
  } finally {
    requestInFlight = false;
    setBusy(false, action);
  }
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  runAction("open");
});

setupForm.addEventListener("input", (event) => {
  if (event.target.matches("input")) event.target.removeAttribute("aria-invalid");
});

openButton.addEventListener("click", () => runAction("open"));
closeButton.addEventListener("click", () => runAction("close"));

setBusy(false);
setStatus("", "");
