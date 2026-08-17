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

let lastY = 0;
let rafId = null;

function updateScroll() {
  const y      = window.scrollY;
  const vh     = window.innerHeight;

  // Nav: transparent → solid
  if (isHome) {
    nav.classList.toggle('scrolled', y > 60);
  }

  // Hero parallax & fade (the magic)
  if (isFixedHero && heroContent) {
    const progress = Math.min(1, y / vh);
    // Logo and tagline drift up slightly slower than scroll (parallax)
    heroContent.style.transform = `translateY(${-y * 0.35}px)`;
    // Soft fade out as content covers the hero
    heroContent.style.opacity   = String(1 - progress * 0.85);
  }

  if (isFixedHero && heroScroll) {
    heroScroll.style.opacity = String(Math.max(0, 0.55 - y / 200));
  }

  rafId = null;
}

window.addEventListener('scroll', () => {
  lastY = window.scrollY;
  if (!rafId) rafId = requestAnimationFrame(updateScroll);
}, { passive: true });

// Initial run (so nav state is correct on page load with scroll)
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

// ── Email signup → Kit.com ──
//
// TO CONNECT YOUR KIT.COM FORM:
//   1. Log in to kit.com
//   2. Grow → Landing Pages & Forms → open your form
//   3. Click "Embed" — copy the numeric form ID from the URL
//   4. Replace 'YOUR_FORM_ID' below
//
const KIT_FORM_ID = 'YOUR_FORM_ID';

const signupForm   = document.getElementById('signupForm');
const formFeedback = document.getElementById('formFeedback');

signupForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('emailInput').value.trim();
  const btn   = signupForm.querySelector('button[type="submit"]');
  if (!email) return;

  if (KIT_FORM_ID === 'YOUR_FORM_ID') {
    formFeedback.textContent = 'Email signup coming very soon — follow on Instagram for updates.';
    formFeedback.className   = 'form-feedback';
    return;
  }

  btn.disabled    = true;
  btn.textContent = '…';
  formFeedback.textContent = '';
  formFeedback.className   = 'form-feedback';

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
      formFeedback.textContent = 'Welcome to the field. ✦';
      formFeedback.className   = 'form-feedback success';
      signupForm.reset();
    } else {
      throw new Error();
    }
  } catch {
    formFeedback.textContent = 'Something went wrong — please try again.';
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Join';
  }
});
