const setupForm = document.querySelector("#setup-form");
const openButton = document.querySelector("#open-button");
const closeButton = document.querySelector("#close-button");
const setupStatus = document.querySelector("#setup-status");
const setupSuccess = document.querySelector("#setup-success");
const setupSuccessTitle = document.querySelector("#setup-success-title");
const setupSuccessCopy = document.querySelector("#setup-success-copy");
const openCheckinLink = document.querySelector("#open-checkin-link");
const setupPasswordInput = document.querySelector("#setup-password");
const workshopSelect = document.querySelector("#workshop-choice");
const workshopSelection = document.querySelector("#workshop-selection");
const workshopSelectionTitle = document.querySelector("#workshop-selection-title");
const workshopSelectionDetails = document.querySelector("#workshop-selection-details");
const catalogRetryButton = document.querySelector("#catalog-retry");
const NETWORK_TIMEOUT_MS = 12000;
const BUTTON_LABELS = {
  open: "Open and activate this iPad",
  close: "Close this workshop"
};
let requestInFlight = false;
let catalogReady = false;
let catalogLoading = true;
const workshopsByKey = new Map();

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

function selectedWorkshop() {
  return workshopsByKey.get(workshopSelect.value) || null;
}

function updateWorkshopPreview() {
  const workshop = selectedWorkshop();
  workshopSelection.hidden = !workshop;
  workshopSelectionTitle.textContent = workshop ? workshop.title : "";
  workshopSelectionDetails.textContent = workshop ? workshop.details : "";
}

function validWorkshopCatalog(body) {
  if (!body || body.ok !== true || !Array.isArray(body.workshops)) {
    return false;
  }

  const seenKeys = new Set();
  const seenLabels = new Set();
  return body.workshops.every((workshop) => {
    if (!workshop || typeof workshop !== "object" || Array.isArray(workshop)) return false;
    const keys = Object.keys(workshop).sort().join(",");
    if (keys !== "details,key,label,title") return false;
    const publicText = [workshop.label, workshop.title, workshop.details];
    if (
      typeof workshop.key !== "string" ||
      !/^[a-z0-9][a-z0-9-]{2,79}$/.test(workshop.key) ||
      seenKeys.has(workshop.key) ||
      seenLabels.has(workshop.label) ||
      typeof workshop.label !== "string" ||
      typeof workshop.title !== "string" ||
      typeof workshop.details !== "string" ||
      workshop.label.length < 1 ||
      workshop.label.length > 200 ||
      workshop.title.length < 1 ||
      workshop.title.length > 140 ||
      workshop.details.length < 1 ||
      workshop.details.length > 220 ||
      publicText.some((value) => /[\u0000-\u001F\u007F]/.test(value))
    ) {
      return false;
    }
    seenKeys.add(workshop.key);
    seenLabels.add(workshop.label);
    return true;
  });
}

function populateWorkshopCatalog(workshops) {
  workshopsByKey.clear();
  while (workshopSelect.options.length > 1) workshopSelect.remove(1);
  for (const workshop of workshops) {
    workshopsByKey.set(workshop.key, workshop);
    const option = document.createElement("option");
    option.value = workshop.key;
    option.textContent = workshop.label;
    workshopSelect.appendChild(option);
  }
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
  const actionReady = catalogReady && Boolean(selectedWorkshop());
  openButton.disabled = busy || !actionReady;
  closeButton.disabled = busy || !actionReady;
  workshopSelect.disabled = busy || !catalogReady;
  catalogRetryButton.disabled = busy;
  setupForm.setAttribute("aria-busy", busy || catalogLoading ? "true" : "false");
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
  if (invalidField === workshopSelect) {
    message = "Choose the workshop you are opening or closing. Nothing was cleared.";
  } else if (invalidField === setupPasswordInput) {
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
  const workshop = selectedWorkshop();
  if (!catalogReady || !workshop) {
    setStatus("Choose an approved workshop before continuing. Nothing was cleared.", "error");
    focusAndReveal(setupStatus);
    return;
  }
  if (
    action === "close" &&
    !window.confirm(
      `Close this workshop?\n\n${workshop.title}\n${workshop.details}\n\n` +
        "This iPad will stop accepting check-ins for it."
    )
  ) {
    setStatus("Nothing changed. No close request was sent.", "");
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
      body: JSON.stringify({ action, setupPassword, workshopKey: workshop.key })
    });
    let body;
    try {
      body = await response.json();
    } catch {
      throw new Error("The setup response could not be verified. Please try again.");
    }
    if (!response.ok || !body.ok) throw new Error(body.message || "The setup was not confirmed.");

    const expectedStatus = action === "close" ? "closed" : "open";
    if (
      !body.event ||
      body.event.status !== expectedStatus ||
      body.event.title !== workshop.title ||
      body.event.details !== workshop.details
    ) {
      throw new Error("The setup response could not be verified. Please try again.");
    }

    setupPasswordInput.value = "";
    setupSuccess.hidden = false;
    if (action === "close") {
      setupSuccessTitle.textContent = "Workshop closed";
      setupSuccessCopy.textContent =
        `${workshop.title} — ${workshop.details}. This iPad will no longer accept check-ins. ` +
        "On your Mac, ask Codex to import this workshop into its Sign Up Sheet folder.";
      openCheckinLink.hidden = true;
      setStatus("Success. The workshop is closed.", "success");
    } else {
      setupSuccessTitle.textContent = "Workshop open";
      setupSuccessCopy.textContent =
        `${workshop.title} — ${workshop.details}. This iPad is ready for attendee check-in.`;
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
  if (event.target.matches("input, select")) event.target.removeAttribute("aria-invalid");
});

workshopSelect.addEventListener("change", () => {
  workshopSelect.removeAttribute("aria-invalid");
  setupSuccess.hidden = true;
  openCheckinLink.hidden = true;
  updateWorkshopPreview();
  setStatus("", "");
  setBusy(false);
});

openButton.addEventListener("click", () => runAction("open"));
closeButton.addEventListener("click", () => runAction("close"));
catalogRetryButton.addEventListener("click", () => loadWorkshopCatalog());

async function loadWorkshopCatalog() {
  catalogLoading = true;
  catalogReady = false;
  catalogRetryButton.hidden = true;
  setBusy(true);
  setStatus("Loading approved workshops…", "working");

  try {
    const response = await fetchWithTimeout("/api/workshop-check-in/catalog", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const body = await response.json();
    if (!response.ok || !validWorkshopCatalog(body)) {
      throw new Error("The approved workshop list could not be verified.");
    }

    catalogLoading = false;
    if (body.workshops.length === 0) {
      populateWorkshopCatalog([]);
      setBusy(false);
      catalogRetryButton.hidden = false;
      setStatus(
        "No workshops are ready yet. Ask Codex to add the workshop, then try again. Nothing was opened.",
        ""
      );
      return;
    }

    populateWorkshopCatalog(body.workshops);
    catalogReady = true;
    setBusy(false);
    setStatus("Choose a workshop to begin.", "");
  } catch (error) {
    catalogLoading = false;
    catalogReady = false;
    setBusy(false);
    catalogRetryButton.hidden = false;
    setStatus(
      "The approved workshop list could not load. Check Wi-Fi, then try again. Nothing was opened.",
      "error"
    );
    focusAndReveal(setupStatus);
  }
}

loadWorkshopCatalog();
