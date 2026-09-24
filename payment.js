(() => {
  const form = document.querySelector('#payment-amount-form');
  if (!form) return;
  const amount = document.querySelector('#payment-amount');
  const submit = document.querySelector('#payment-continue');
  const status = document.querySelector('#payment-status');
  const container = document.querySelector('#payment-checkout');
  const change = document.querySelector('#payment-change');
  const complete = document.querySelector('#payment-complete');
  const fallback = document.querySelector('#payment-fallback');
  let config;
  let checkout;
  let stripeLoad;
  let busy = false;
  let attempt;
  let finished = false;

  const say = (message, error = false) => {
    status.textContent = message;
    status.classList.toggle('is-error', error);
  };
  const unavailable = 'The payment form is unavailable right now. You can use “Pay on Stripe Instead” below.';
  async function request(url, options = {}) {
    const response = await fetch(url, { ...options, cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('Payment service unavailable');
    return response.json();
  }
  function loadStripe() {
    if (typeof window.Stripe === 'function') return Promise.resolve();
    if (stripeLoad) return stripeLoad;
    stripeLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/dahlia/stripe.js';
      script.async = true;
      const timer = setTimeout(() => fail(), 20000);
      const fail = () => {
        clearTimeout(timer);
        script.remove();
        stripeLoad = null;
        reject(new Error('Stripe did not load'));
      };
      script.onload = () => {
        clearTimeout(timer);
        if (typeof window.Stripe === 'function') resolve(); else fail();
      };
      script.onerror = fail;
      document.head.appendChild(script);
    });
    return stripeLoad;
  }
  async function initialize() {
    try {
      config = await request('/api/payment/config');
      if (!/^pk_(test|live)_/.test(config.publishableKey) || !['test', 'live'].includes(config.mode)) throw new Error('Invalid configuration');
      // Local review uses the sandbox fallback; Stripe labels its own test checkout.
      if (config.mode === 'test') {
        fallback.querySelector('a').href = 'https://buy.stripe.com/test_eVq8wIa22fEM7YO1JZ2Fa00';
      }
      say('');
      submit.disabled = false;
    } catch { say(unavailable, true); }
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy || finished || !config) return;
    const entered = amount.value.trim();
    const valid = /^\d{1,5}(\.\d{1,2})?$/.test(entered);
    const cents = valid ? Number(entered.split('.')[0]) * 100 + Number((entered.split('.')[1] || '').padEnd(2, '0')) : 0;
    if (!valid || cents < 100 || cents > 1000000) {
      say('Enter an amount from $1 to $10,000, with no more than two decimal places.', true);
      amount.focus();
      return;
    }
    const normalized = (cents / 100).toFixed(2);
    if (!attempt || attempt.amount !== normalized) attempt = { amount: normalized, attemptId: crypto.randomUUID() };
    busy = true;
    submit.disabled = true;
    amount.disabled = true;
    say('Opening your secure payment form…');
    try {
      await loadStripe();
      checkout = await window.Stripe(config.publishableKey).createEmbeddedCheckoutPage({
        fetchClientSecret: async () => {
          const data = await request('/api/payment/session', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(attempt)
          });
          if (typeof data.clientSecret !== 'string' || !data.clientSecret.startsWith('cs_')) throw new Error('Invalid session');
          return data.clientSecret;
        },
        onComplete: () => {
          finished = true;
          checkout?.destroy();
          checkout = null;
          container.hidden = true;
          form.hidden = true;
          change.hidden = true;
          fallback.hidden = true;
          say('');
          complete.hidden = false;
          complete.focus();
        }
      });
      container.hidden = false;
      checkout.mount('#payment-checkout');
      form.hidden = true;
      change.hidden = false;
      say('');
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      checkout?.destroy();
      checkout = null;
      container.hidden = true;
      say(unavailable, true);
    } finally {
      busy = false;
      submit.disabled = false;
      amount.disabled = false;
    }
  });
  change.addEventListener('click', () => {
    if (finished || busy) return;
    checkout?.destroy();
    checkout = null;
    container.hidden = true;
    change.hidden = true;
    form.hidden = false;
    say('');
    amount.focus();
  });
  initialize();
})();
