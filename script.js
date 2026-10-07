// ==========================================================================
// PURE BLACK PORTFOLIO SCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initPreloader();
    initScrollSpy();
    initCanvasBg();
    initTypewriter();
    initMobileNav();
    initContactForm();
    initLaptopOpening();
    initHeroPhotoRotation();
});

/* --------------------------------------------------------------------------
   1. PRELOADER ANIMATION & REVEAL
   -------------------------------------------------------------------------- */
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const progressFill = document.getElementById('progressFill');
    const percentText = document.getElementById('preloaderPercent');

    if (!preloader || !progressFill || !percentText) return;

    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress > 100) progress = 100;

        progressFill.style.width = `${progress}%`;
        percentText.textContent = `${progress}%`;

        if (progress === 100) {
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('fade-out');

                // Start the lid while the last of the black is still clearing,
                // so the laptop is already moving when the page comes through
                setTimeout(() => {
                    document.dispatchEvent(new Event('preloader:done'));
                }, 260);
            }, 300);
        }
    }, 40);
}

/* --------------------------------------------------------------------------
   2. SCROLLSPY (HIGHLIGHT TOP-RIGHT NAV ITEMS ON SCROLL)
   -------------------------------------------------------------------------- */
function initScrollSpy() {
    const sections = document.querySelectorAll('main section');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    let ticking = false;

    function sync() {
        ticking = false;

        // Offset by the header so a section counts as current once it clears it
        const headerH = parseInt(
            getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10
        ) || 68;
        const line = window.scrollY + headerH + 40;

        let currentSectionId = '';
        sections.forEach(section => {
            if (line >= section.offsetTop && line < section.offsetTop + section.offsetHeight) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${currentSectionId}`);
        });
    }

    // rAF-throttled: scroll fires far more often than the screen repaints,
    // and unthrottled layout reads make phones stutter.
    window.addEventListener('scroll', () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(sync);
        }
    }, { passive: true });

    sync();
}

/* --------------------------------------------------------------------------
   3. BACKGROUND CANVAS (STARFIELD / CONSTELLATION)
   -------------------------------------------------------------------------- */
function initCanvasBg() {
    const canvas = document.getElementById('bgCanvas');
    if (!canvas) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let stars = [];
    let rafId = null;

    function sizeCanvas() {
        // Cap the pixel ratio: phones often report 3x, which triples the fill
        // cost of a full-screen canvas for no visible gain on a starfield.
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        // clientWidth, not innerWidth: innerWidth includes the scrollbar, and a
        // canvas that wide overhangs the page and widens the scrollable area
        width = document.documentElement.clientWidth;
        height = document.documentElement.clientHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    class Star {
        constructor() {
            this.reset(true);
        }

        reset(anywhere) {
            this.x = Math.random() * width;
            this.y = anywhere ? Math.random() * height : height;
            this.size = Math.random() * 1.5 + 0.5;
            this.speedY = Math.random() * 0.3 + 0.1;
            this.alpha = Math.random() * 0.6 + 0.2;
        }

        update() {
            this.y -= this.speedY;
            if (this.y < 0) this.reset(false);
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
            ctx.fill();
        }
    }

    function createStars() {
        // Scale the field to the screen so a phone is not drawing a
        // desktop-sized star count into a tiny viewport.
        const count = Math.round(Math.min(70, Math.max(24, (width * height) / 22000)));
        stars = [];
        for (let i = 0; i < count; i++) stars.push(new Star());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);
        stars.forEach(star => {
            star.update();
            star.draw();
        });
        rafId = requestAnimationFrame(animate);
    }

    function play() {
        if (rafId === null && !reduced) rafId = requestAnimationFrame(animate);
    }

    function pause() {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        const prevWidth = width;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            sizeCanvas();
            // Mobile browsers fire resize every time the address bar slides
            // away. Only a real width change is worth rebuilding the field for.
            if (Math.abs(width - prevWidth) > 1) createStars();
        }, 150);
    }, { passive: true });

    // Nothing to animate while the tab is in the background
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pause();
        else play();
    });

    sizeCanvas();
    createStars();

    if (reduced) {
        // Draw the field once and leave it still
        stars.forEach(star => star.draw());
    } else {
        play();
    }
}

/* --------------------------------------------------------------------------
   4. TYPEWRITER SUBTITLE IN LAPTOP SCREEN
   -------------------------------------------------------------------------- */
function initTypewriter() {
    const typewriter = document.getElementById('typewriter');
    if (!typewriter) return;

    const roles = [
        'FULL STACK DEVELOPER',
        'UI/UX ARCHITECT',
        'CREATIVE TECHNOLOGIST',
        'PERFORMANCE ENGINEER'
    ];

    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;

    function type() {
        const current = roles[roleIdx];

        if (isDeleting) {
            typewriter.textContent = current.substring(0, charIdx - 1);
            charIdx--;
        } else {
            typewriter.textContent = current.substring(0, charIdx + 1);
            charIdx++;
        }

        let speed = isDeleting ? 40 : 80;

        if (!isDeleting && charIdx === current.length) {
            speed = 2200;
            isDeleting = true;
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            roleIdx = (roleIdx + 1) % roles.length;
            speed = 400;
        }

        setTimeout(type, speed);
    }

    type();
}

/* --------------------------------------------------------------------------
   5. MOBILE NAV MENU
   -------------------------------------------------------------------------- */
function initMobileNav() {
    const toggle = document.getElementById('mobileToggle');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.getElementById('topHeader');
    const links = document.querySelectorAll('.nav-link');

    if (!toggle || !navMenu) return;

    const icon = toggle.querySelector('i');

    function setOpen(open) {
        navMenu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (icon) {
            icon.classList.toggle('fa-bars', !open);
            icon.classList.toggle('fa-xmark', open);
        }
    }

    setOpen(false);

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!navMenu.classList.contains('open'));
    });

    links.forEach(l => l.addEventListener('click', () => setOpen(false)));

    // Tapping anywhere else on the page dismisses the sheet
    document.addEventListener('click', (e) => {
        if (!navMenu.classList.contains('open')) return;
        if (header && header.contains(e.target)) return;
        setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setOpen(false);
    });

    // Rotating to landscape can cross the breakpoint while the sheet is open
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992) setOpen(false);
    }, { passive: true });
}

/* --------------------------------------------------------------------------
   6. CONTACT FORM & TOAST
   -------------------------------------------------------------------------- */
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const messageInput = document.getElementById('message');

        const name = nameInput ? nameInput.value.trim() : '';
        const email = emailInput ? emailInput.value.trim() : '';
        const message = messageInput ? messageInput.value.trim() : '';

        if (!name || !email || !message) {
            showToast('Please fill out all fields.');
            return;
        }

        const subject = encodeURIComponent(`Portfolio Contact: Message from ${name}`);
        const body = encodeURIComponent(
            `Hi Manideep,\n\n${message}\n\n---\nSender Details:\nName: ${name}\nEmail: ${email}`
        );

        // Open email client with pre-filled content
        window.location.href = `mailto:manideepchowdarykilaru@gmail.com?subject=${subject}&body=${body}`;

        showToast('Opening email to send message...');
        form.reset();
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = msg;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

/* --------------------------------------------------------------------------
   7. LAPTOP LID — swings open once, as the site loads

   Deliberately a one-shot: it is tied to the preloader finishing, not to the
   section scrolling into view, so it plays on arrival and never replays when
   you scroll back up to the top of the page.
   -------------------------------------------------------------------------- */
function initLaptopOpening() {
    const wrapper = document.querySelector('.laptop-wrapper');
    if (!wrapper) return;

    // Anyone who asked for less motion gets the laptop already open
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Fold it shut immediately. The preloader is still covering the whole
    // screen, so the closed state is never seen snapping into place.
    wrapper.classList.add('is-closed');

    let opened = false;

    function open() {
        if (opened) return;
        opened = true;
        wrapper.classList.remove('is-closed');
    }

    // Beat of stillness first, so the shut laptop actually registers as a shut
    // laptop before the lid moves — without it the opening has nothing to read
    // against and just looks like the screen flying in.
    document.addEventListener('preloader:done', () => setTimeout(open, 450), { once: true });

    // Safety net: never leave the laptop shut if the preloader never reports
    setTimeout(open, 4000);
}

/* ==========================================================================
   HERO PHOTO — head turns only while you drag it

   Real frames from a 360 sweep. Exactly one frame is ever visible: stacking
   two part-opaque frames darkens the composite halfway through, which reads
   as a flicker.

   Drag is the only driver. Nothing here starts a frame on its own — no idle
   sweep, no cursor following, no recentring when the section scrolls away.
   The render loop is only ever scheduled by a pointer event, and it stops as
   soon as the head has caught up with where the finger left it, so the head
   holds whatever angle you let go at.
   ========================================================================== */
function initHeroPhotoRotation() {
    const stack = document.getElementById('heroPhotoStack');
    if (!stack) return;

    const frames = stack.querySelectorAll('.hero-photo-frame');
    if (frames.length < 2) return;

    const LAST = frames.length - 1;
    const CENTRE = LAST / 2;
    // Firm easing: enough to smooth the frame steps, not enough to keep
    // drifting after the drag ends
    const EASE = 0.3;
    // Must travel past this to swap, so a jittery finger can't strobe frames
    const HYSTERESIS = 0.55;

    // Some people ask for no motion at all; that request wins over all of this
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let target = CENTRE;
    let current = CENTRE;
    let shown = Math.round(CENTRE);
    let rafId = null;

    let dragging = false;
    let dragId = null;
    let dragStartX = 0;
    let dragStartPos = CENTRE;

    function clamp(v, lo, hi) {
        return v < lo ? lo : v > hi ? hi : v;
    }

    function show(index) {
        if (index === shown) return;
        frames[shown].style.opacity = '0';
        frames[index].style.opacity = '1';
        shown = index;
    }

    function render() {
        rafId = null;

        current += (target - current) * EASE;

        if (Math.abs(current - shown) > HYSTERESIS) {
            show(clamp(Math.round(current), 0, LAST));
        }

        // Keep going only until the head has caught up, then stop dead
        if (Math.abs(target - current) > 0.01) {
            rafId = requestAnimationFrame(render);
        } else {
            current = target;
        }
    }

    function start() {
        if (rafId === null) rafId = requestAnimationFrame(render);
    }

    function onDown(e) {
        dragging = true;
        dragId = e.pointerId;
        dragStartX = e.clientX;
        dragStartPos = current;

        stack.classList.add('is-dragging');
        if (stack.setPointerCapture) {
            try { stack.setPointerCapture(e.pointerId); } catch (err) { /* not capturable */ }
        }
    }

    function onDrag(e) {
        if (!dragging || e.pointerId !== dragId) return;

        // A drag of about 1.25x the photo's width covers the whole turn, so the
        // head is reachable end to end without a huge gesture on a phone
        const span = Math.max(stack.getBoundingClientRect().width * 1.25, 150);
        target = clamp(dragStartPos + ((e.clientX - dragStartX) / span) * LAST, 0, LAST);
        start();
    }

    function onUp(e) {
        if (!dragging || (e.pointerId != null && e.pointerId !== dragId)) return;
        dragging = false;
        dragId = null;
        stack.classList.remove('is-dragging');
        // target is left exactly where the drag ended — no spring back
    }

    stack.addEventListener('pointerdown', onDown);
    stack.addEventListener('pointermove', onDrag);
    stack.addEventListener('pointerup', onUp);
    stack.addEventListener('pointercancel', onUp);
    stack.addEventListener('lostpointercapture', onUp);

    // Hand opacity control over to JS from the markup's default
    frames[shown].classList.remove('is-active');
    frames[shown].style.opacity = '1';
}
