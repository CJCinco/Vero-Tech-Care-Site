const PENDING_SUBMISSION_KEY = "vtcPendingWorkshopSubmission";
const RESET_SECONDS = 15;
const NETWORK_TIMEOUT_MS = 12000;

const loadingPanel = document.querySelector("#loading-panel");
const inactivePanel = document.querySelector("#inactive-panel");
const formPanel = document.querySelector("#form-panel");
const successPanel = document.querySelector("#success-panel");
const form = document.querySelector("#checkin-form");
const fullNameInput = document.querySelector("#full-name");
const emailInput = document.querySelector("#email");
const phoneInput = document.querySelector("#phone");
const submitButton = document.querySelector("#submit-button");
const nextPersonButton = document.querySelector("#next-person-button");
const submissionStatus = document.querySelector("#submission-status");
const resetStatus = document.querySelector("#reset-status");
const eventTitle = document.querySelector("#event-title");
const eventDetails = document.querySelector("#event-details");
const errorSummary = document.querySelector("#error-summary");
const errorList = document.querySelector("#error-list");

let activeEvent = null;
let resetTimer = null;
let countdownTimer = null;

async function fetchWithTimeout(resource, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
  try {
    return await fetch(resource, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function pendingSubmissionId() {
  const existing = sessionStorage.getItem(PENDING_SUBMISSION_KEY);
  if (existing) return existing;
  const next = crypto.randomUUID();
  sessionStorage.setItem(PENDING_SUBMISSION_KEY, next);
  return next;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return { ok: false, code: "INVALID_RESPONSE" };
  }
}

function showOnly(panel) {
  for (const candidate of [loadingPanel, inactivePanel, formPanel, successPanel]) {
    candidate.hidden = candidate !== panel;
  }
}

function showInactive() {
  activeEvent = null;
  form.reset();
  sessionStorage.removeItem(PENDING_SUBMISSION_KEY);
  showOnly(inactivePanel);
}

function showForm(event) {
  activeEvent = event;
  eventTitle.textContent = event.title;
  eventDetails.textContent = event.details || "";
  showOnly(formPanel);
  fullNameInput.focus();
}

function fieldError(input, message) {
  const error = document.querySelector(`#${input.id}-error`);
  input.setAttribute("aria-invalid", "true");
  input.setAttribute("aria-describedby", error.id);
  error.textContent = message;
  error.hidden = false;
  return message;
}

function clearErrors() {
  errorSummary.hidden = true;
  errorList.replaceChildren();
  for (const input of [fullNameInput, emailInput, phoneInput]) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    const error = document.querySelector(`#${input.id}-error`);
    error.textContent = "";
    error.hidden = true;
  }
}

function validateForm() {
  clearErrors();
  const errors = [];
  let firstInvalid = null;

  if (!fullNameInput.value.trim()) {
    errors.push(fieldError(fullNameInput, "Please enter your full name."));
    firstInvalid ||= fullNameInput;
  }
  if (emailInput.value && !emailInput.validity.valid) {
    errors.push(fieldError(emailInput, "Please check the email address, or leave it blank."));
    firstInvalid ||= emailInput;
  }

  if (errors.length) {
    for (const message of errors) {
      const item = document.createElement("li");
      item.textContent = message;
      errorList.append(item);
    }
    errorSummary.hidden = false;
    errorSummary.focus();
    firstInvalid?.focus();
    return false;
  }
  return true;
}

async function checkReceipt(submissionId) {
  const response = await fetchWithTimeout(
    `/api/workshop-check-in/status?submission=${encodeURIComponent(submissionId)}`,
    { cache: "no-store", credentials: "same-origin" }
  );
  const body = await readJson(response);
  return response.ok && body.saved ? body : null;
}

function resetForNextPerson() {
  if (resetTimer) clearTimeout(resetTimer);
  if (countdownTimer) clearInterval(countdownTimer);
  resetTimer = null;
  countdownTimer = null;
  form.reset();
  clearErrors();
  submissionStatus.textContent = "";
  submissionStatus.removeAttribute("data-state");
  submitButton.disabled = false;
  submitButton.textContent = "Sign me in";
  sessionStorage.removeItem(PENDING_SUBMISSION_KEY);
  showForm(activeEvent);
}

function showSuccess() {
  form.reset();
  sessionStorage.removeItem(PENDING_SUBMISSION_KEY);
  submitButton.disabled = false;
  submitButton.textContent = "Sign me in";
  submissionStatus.textContent = "";
  showOnly(successPanel);
  successPanel.focus();

  let remaining = RESET_SECONDS;
  resetStatus.textContent = `A blank form will appear in ${remaining} seconds.`;
  countdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) resetStatus.textContent = `A blank form will appear in ${remaining} seconds.`;
  }, 1000);
  resetTimer = setTimeout(resetForNextPerson, RESET_SECONDS * 1000);
}

async function submitCheckIn(event) {
  event.preventDefault();
  if (!activeEvent || !validateForm()) return;

  const submissionId = pendingSubmissionId();
  submitButton.disabled = true;
  submitButton.textContent = "Saving…";
  submissionStatus.removeAttribute("data-state");
  submissionStatus.textContent = "Saving your check-in…";

  const payload = {
    clientSubmissionId: submissionId,
    fullName: fullNameInput.value,
    email: emailInput.value,
    phone: phoneInput.value
  };

  let allowReceiptRecovery = true;

  try {
    const response = await fetchWithTimeout("/api/workshop-check-in/submit", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const body = await readJson(response);

    if (response.status === 401) {
      showInactive();
      return;
    }
    if (response.status === 409 && body.code === "SUBMISSION_CONFLICT") {
      allowReceiptRecovery = false;
      sessionStorage.removeItem(PENDING_SUBMISSION_KEY);
      throw new Error(body.message);
    }
    if (!response.ok || !body.saved || !body.receiptId) {
      throw new Error(body.message || "Not confirmed.");
    }
    showSuccess();
  } catch {
    if (allowReceiptRecovery) {
      try {
        const recovered = await checkReceipt(submissionId);
        if (recovered) {
          showSuccess();
          return;
        }
      } catch {
        // The original fields remain visible so the attendee can retry safely.
      }
    }

    submitButton.disabled = false;
    submitButton.textContent = "Try again";
    submissionStatus.dataset.state = "error";
    submissionStatus.textContent =
      "Not confirmed. Your information is still here. Check the connection and tap Try again.";
  }
}

async function initialize() {
  showOnly(loadingPanel);
  try {
    const response = await fetchWithTimeout("/api/workshop-check-in/status", {
      cache: "no-store",
      credentials: "same-origin"
    });
    const body = await readJson(response);
    if (!response.ok || !body.event) {
      showInactive();
      return;
    }

    activeEvent = body.event;
    const pending = sessionStorage.getItem(PENDING_SUBMISSION_KEY);
    if (pending) {
      const recovered = await checkReceipt(pending);
      if (recovered) {
        showSuccess();
        return;
      }
    }
    showForm(activeEvent);
  } catch {
    showInactive();
  }
}

form.addEventListener("submit", submitCheckIn);
nextPersonButton.addEventListener("click", resetForNextPerson);
initialize();
