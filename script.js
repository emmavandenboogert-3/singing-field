// ── Nav behaviour ──
const nav    = document.getElementById('nav');
const isHome = document.body.hasAttribute('data-transparent-nav');

if (!isHome) nav.classList.add('scrolled');

// ── Mobile menu ──
const hamburger = document.querySelector('.nav-hamburger');
const drawer    = document.querySelector('.nav-drawer');

hamburger?.addEventListener('click', () => {
  const open = drawer.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  drawer.setAttribute('aria-hidden',      String(!open));
});

drawer?.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    drawer.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden',      'true');
  });
});

// ── Hero parallax + fade (home only) ──
const isFixedHero = document.body.hasAttribute('data-fixed-hero');
const heroContent = document.querySelector('.hero-content');
const heroScroll  = document.querySelector('.hero-scroll');

let rafId = null;

function updateScroll() {
  const y      = window.scrollY;
  const vh     = window.innerHeight;

  if (isHome) nav.classList.toggle('scrolled', y > 60);

  if (isFixedHero && heroContent) {
    const progress = Math.min(1, y / vh);
    heroContent.style.transform = `translateY(${-y * 0.35}px)`;
    heroContent.style.opacity   = String(1 - progress * 0.85);
  }

  if (isFixedHero && heroScroll) {
    heroScroll.style.opacity = String(Math.max(0, 0.55 - y / 200));
  }

  rafId = null;
}

window.addEventListener('scroll', () => {
  if (!rafId) rafId = requestAnimationFrame(updateScroll);
}, { passive: true });

updateScroll();

// ── Reveal sections on scroll ──
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── Email signup — shared logic for the Stay page form AND the pop-up ──
//
// TO CONNECT YOUR KIT.COM FORM:
//   1. Log in to kit.com
//   2. Grow → Landing Pages & Forms → open your form
//   3. Click "Embed" — copy the numeric form ID from the URL
//   4. Replace 'YOUR_FORM_ID' below
//
const KIT_FORM_ID = 'YOUR_FORM_ID';

async function submitEmail({ email, buttonEl, feedbackEl, originalBtnText, onSuccess }) {
  if (!email) return;

  if (KIT_FORM_ID === 'YOUR_FORM_ID') {
    feedbackEl.textContent = 'Email signup coming very soon — follow on Instagram for updates.';
    feedbackEl.className   = 'form-feedback';
    return;
  }

  buttonEl.disabled    = true;
  buttonEl.textContent = '…';
  feedbackEl.textContent = '';
  feedbackEl.className   = 'form-feedback';

  try {
    const res = await fetch(
      `https://app.kit.com/forms/${KIT_FORM_ID}/subscriptions`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body:    JSON.stringify({ email_address: email }),
      }
    );
    if (res.ok || res.status === 200 || res.status === 201) {
      feedbackEl.textContent = 'Welcome to the field. ✦';
      feedbackEl.className   = 'form-feedback success';
      onSuccess?.();
    } else {
      throw new Error();
    }
  } catch {
    feedbackEl.textContent = 'Something went wrong — please try again.';
  } finally {
    buttonEl.disabled    = false;
    buttonEl.textContent = originalBtnText;
  }
}

// Stay page form
const stayForm = document.getElementById('signupForm');
stayForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value.trim();
  await submitEmail({
    email,
    buttonEl:      stayForm.querySelector('button[type="submit"]'),
    feedbackEl:    document.getElementById('formFeedback'),
    originalBtnText: 'Join',
    onSuccess:     () => stayForm.reset(),
  });
});

// ── Email signup pop-up ──
(function initPopup() {
  const DISMISSED_KEY  = 'sf_popup_dismissed';
  const SUBSCRIBED_KEY = 'sf_popup_subscribed';

  // Don't show on the Stay page (redundant — it already has the form)
  if (window.location.pathname.toLowerCase().includes('stay')) return;

  // Don't show if already dismissed or already subscribed
  if (localStorage.getItem(DISMISSED_KEY) || localStorage.getItem(SUBSCRIBED_KEY)) return;

  let shown = false;

  function showPopup() {
    if (shown) return;
    shown = true;

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'popupTitle');
    overlay.innerHTML = `
      <div class="popup">
        <button type="button" class="popup-close" aria-label="Close">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
        <img src="images/logo-mark.png" class="popup-mark" alt="" aria-hidden="true">
        <h2 id="popupTitle" class="popup-title">A song from the field</h2>
        <p class="popup-body">Occasional letters when new circles land and new songs come through. As a welcome — a private piano version of my song <em>Dancing in the Darkness</em>, recorded with my friend Manisha. Raw and intimate.</p>
        <form class="signup-form popup-form" id="popupSignupForm" novalidate>
          <div class="signup-row">
            <label for="popupEmailInput" class="sr-only">Your email address</label>
            <input type="email" id="popupEmailInput" name="email_address" placeholder="Your email address" required autocomplete="email">
            <button type="submit" class="btn btn-primary">Yes, send me the song</button>
          </div>
          <p class="form-feedback" id="popupFormFeedback" role="alert" aria-live="polite"></p>
        </form>
        <p class="popup-note">Written with love. — Emma</p>
      </div>
    `;
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // Force reflow so animation kicks off
    requestAnimationFrame(() => overlay.classList.add('open'));

    const closeBtn = overlay.querySelector('.popup-close');
    const form     = overlay.querySelector('form');
    const input    = overlay.querySelector('#popupEmailInput');
    const feedback = overlay.querySelector('#popupFormFeedback');

    closeBtn.focus({ preventScroll: true });

    function close(reason = 'dismissed') {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (reason === 'subscribed') {
        localStorage.setItem(SUBSCRIBED_KEY, Date.now());
      } else {
        localStorage.setItem(DISMISSED_KEY, Date.now());
      }
      setTimeout(() => overlay.remove(), 400);
    }

    closeBtn.addEventListener('click', () => close('dismissed'));
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close('dismissed');
    });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') {
        close('dismissed');
        document.removeEventListener('keydown', onEsc);
      }
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitEmail({
        email:           input.value.trim(),
        buttonEl:        form.querySelector('button[type="submit"]'),
        feedbackEl:      feedback,
        originalBtnText: 'Yes, send me the song',
        onSuccess: () => {
          form.reset();
          setTimeout(() => close('subscribed'), 2500);
        },
      });
    });
  }

  // Trigger: whichever comes first — 20 seconds on page, OR 40% page scroll
  const timer = setTimeout(showPopup, 20000);

  function onScroll() {
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) return;
    if (window.scrollY / maxScroll > 0.4) {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      showPopup();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
})();
