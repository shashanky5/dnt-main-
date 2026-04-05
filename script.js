/* =============================================
   DNT COMPLIANCE — MAIN SCRIPT
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  /* ---- Navbar Scroll Effect ---- */
  const nav = document.getElementById('main-nav');
  const onScroll = () => {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---- Elite Canvas Globe Implementation ---- */
  const initGlobe = () => {
    const container = document.getElementById('globe-container');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height, dpr, radius, cx, cy;
    const fov = 600;

    const dots = [];
    const numDots = 1200;
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < numDots; i++) {
      const theta = (2 * Math.PI * i) / goldenRatio;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / numDots);
      dots.push([Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi)]);
    }

    const markers = [
      { lat: 37.78, lng: -122.42, label: "San Francisco" },
      { lat: 51.51, lng: -0.13, label: "London" },
      { lat: 35.68, lng: 139.69, label: "Tokyo" },
      { lat: -33.87, lng: 151.21, label: "Sydney" },
      { lat: 1.35, lng: 103.82, label: "Singapore" },
      { lat: 55.76, lng: 37.62, label: "Moscow" },
      { lat: -23.55, lng: -46.63, label: "São Paulo" },
      { lat: 19.43, lng: -99.13, label: "Mexico City" },
      { lat: 19.07, lng: 72.87, label: "Mumbai" },
      { lat: 28.61, lng: 77.21, label: "Delhi" },
      { lat: 23.81, lng: 90.41, label: "Dhaka" },
      { lat: 39.90, lng: 116.40, label: "Beijing" },
      { lat: 52.52, lng: 13.40, label: "Berlin" },
      { lat: 36.19, lng: 44.01, label: "Erbil" },
    ];

    const connections = [
      { from: [37.78, -122.42], to: [51.51, -0.13] },
      { from: [51.51, -0.13], to: [39.90, 116.40] },
      { from: [28.61, 77.21], to: [23.81, 90.41] },
      { from: [51.51, -0.13], to: [52.52, 13.40] },
      { from: [51.51, -0.13], to: [28.61, 77.21] },
      { from: [37.78, -122.42], to: [1.35, 103.82] },
      { from: [1.35, 103.82], to: [-33.87, 151.21] },
      { from: [28.61, 77.21], to: [36.19, 44.01] },
      { from: [51.51, -0.13], to: [36.19, 44.01] },
    ];

    let rotY = 0.4, rotX = 0.2;
    let isDragging = false;
    let startX, startY, startRotY, startRotX;
    let time = 0;

    const latLngToXYZ = (lat, lng, r) => {
      const phi = ((90 - lat) * Math.PI) / 180;
      const theta = ((lng + 180) * Math.PI) / 180;
      return [
        -(r * Math.sin(phi) * Math.cos(theta)),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      ];
    };

    const rotateX = (x, y, z, a) => [x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a)];
    const rotateY = (x, y, z, a) => [x * Math.cos(a) + z * Math.sin(a), y, -x * Math.sin(a) + z * Math.cos(a)];
    const project = (x, y, z) => [x * (fov / (fov + z)) + cx, y * (fov / (fov + z)) + cy];

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      cx = width / 2;
      cy = height / 2;
      radius = Math.min(width, height) * 0.45;
    };
    window.addEventListener('resize', resize);
    resize();

    const draw = () => {
      if (!isDragging) rotY += 0.002;
      time += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Glow
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.5);
      glow.addColorStop(0, "rgba(255, 255, 255, 0.03)");
      glow.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Draw Dots
      dots.forEach(dot => {
        let [x, y, z] = [dot[0] * radius, dot[1] * radius, dot[2] * radius];
        [x, y, z] = rotateX(x, y, z, rotX);
        [x, y, z] = rotateY(x, y, z, rotY);
        if (z > 0) return;
        const [sx, sy] = project(x, y, z);
        const alpha = Math.max(0.1, 1 - (z + radius) / (2 * radius));
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + alpha * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 220, 255, ${(alpha * 0.6).toFixed(2)})`;
        ctx.fill();
      });

      // Connections
      connections.forEach(conn => {
        let [x1, y1, z1] = latLngToXYZ(conn.from[0], conn.from[1], radius);
        let [x2, y2, z2] = latLngToXYZ(conn.to[0], conn.to[1], radius);
        [x1, y1, z1] = rotateX(x1, y1, z1, rotX); [x1, y1, z1] = rotateY(x1, y1, z1, rotY);
        [x2, y2, z2] = rotateX(x2, y2, z2, rotX); [x2, y2, z2] = rotateY(x2, y2, z2, rotY);
        if (z1 > radius * 0.3 && z2 > radius * 0.3) return;
        const [sx1, sy1] = project(x1, y1, z1);
        const [sx2, sy2] = project(x2, y2, z2);
        const [midX, midY, midZ] = [(x1+x2)/2, (y1+y2)/2, (z1+z2)/2];
        const midLen = Math.sqrt(midX*midX + midY*midY + midZ*midZ);
        const [ex, ey, ez] = [(midX/midLen)*radius*1.25, (midY/midLen)*radius*1.25, (midZ/midLen)*radius*1.25];
        const [scx, scy] = project(ex, ey, ez);
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.quadraticCurveTo(scx, scy, sx2, sy2);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        // Traveling Pulse
        const t = (Math.sin(time * 1.5 + conn.from[0]) + 1) / 2;
        const tx = (1-t)**2 * sx1 + 2*(1-t)*t*scx + t**2 * sx2;
        const ty = (1-t)**2 * sy1 + 2*(1-t)*t*scy + t**2 * sy2;
        ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)"; ctx.fill();
      });

      // Markers
      markers.forEach(m => {
        let [x, y, z] = latLngToXYZ(m.lat, m.lng, radius);
        [x, y, z] = rotateX(x, y, z, rotX); [x, y, z] = rotateY(x, y, z, rotY);
        if (z > radius * 0.1) return;
        const [sx, sy] = project(x, y, z);
        const pulse = Math.sin(time * 2 + m.lat) * 0.5 + 0.5;
        ctx.beginPath(); ctx.arc(sx, sy, 4 + pulse * 4, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + pulse * 0.2})`;
        ctx.stroke();
        ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)"; ctx.fill();
        ctx.font = "10px system-ui"; ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.fillText(m.label, sx + 8, sy + 3);
      });

      requestAnimationFrame(draw);
    };
    draw();

    container.addEventListener('pointerdown', e => {
      isDragging = true; startX = e.clientX; startY = e.clientY;
      startRotY = rotY; startRotX = rotX;
      container.setPointerCapture(e.pointerId);
    });
    container.addEventListener('pointermove', e => {
      if (!isDragging) return;
      rotY = startRotY + (e.clientX - startX) * 0.005;
      rotX = Math.max(-1, Math.min(1, startRotX + (e.clientY - startY) * 0.005));
    });
    container.addEventListener('pointerup', () => isDragging = false);
  };
  initGlobe();

  /* ---- Theme Toggle Restore ---- */
  const themeToggle = document.getElementById('theme-toggle-btn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      console.log("Theme Toggle Clicked: Remaining in high-contrast mode for consistency.");
    });
  }

  /* ---- Desktop Services Dropdown ---- */
  const servicesWrap = document.querySelector('.nav-services-wrap');
  const servicesBtn  = servicesWrap ? servicesWrap.querySelector('.nav-services-btn') : null;
  if (servicesWrap && servicesBtn) {
    // Click toggles pinned state
    servicesBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      servicesWrap.classList.toggle('pinned');
    });

    // Clicking a link inside the dropdown closes the pin
    servicesWrap.querySelectorAll('.services-dropdown a').forEach(link => {
      link.addEventListener('click', () => {
        servicesWrap.classList.remove('pinned');
      });
    });

    // Click outside the wrap → remove pin
    document.addEventListener('click', (e) => {
      if (!servicesWrap.contains(e.target)) {
        servicesWrap.classList.remove('pinned');
      }
    });

    // Escape key → remove pin
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') servicesWrap.classList.remove('pinned');
    });
  }

  /* ---- Mobile Services Sub-menu ---- */
  const mobileServicesBtn = document.getElementById('mobile-services-btn');
  const mobileServicesSub = document.getElementById('mobile-services-sub');
  if (mobileServicesBtn && mobileServicesSub) {
    mobileServicesBtn.addEventListener('click', () => {
      mobileServicesBtn.classList.toggle('open');
      mobileServicesSub.classList.toggle('open');
    });
  }

  /* ---- Accordion / FAQ ---- */
  document.querySelectorAll('.accordion-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');

      // Close others (optional single-open behavior)
      const accordion = item.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion-item.open').forEach(openItem => {
          if (openItem !== item) {
            openItem.classList.remove('open');
            openItem.querySelector('.accordion-body').classList.remove('open');
          }
        });
      }

      item.classList.toggle('open', !isOpen);
      body.classList.toggle('open', !isOpen);
    });
  });

  /* ---- Tabs (Comparison Table) ---- */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      const container = btn.closest('.tabs-wrapper');
      if (!container) return;

      container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = container.querySelector(`[data-tab-content="${target}"]`);
      if (content) content.classList.add('active');
    });
  });

  /* ---- Blog Filters ---- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const blogCards = document.querySelectorAll('.blog-card-wrap');
  if (filterBtns.length && blogCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.getAttribute('data-category');
        blogCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          card.style.display = (cat === 'All' || cat === cardCat) ? 'block' : 'none';
        });
      });
    });
  }

  /* ---- Blog Search ---- */
  const blogSearch = document.getElementById('blog-search');
  if (blogSearch) {
    blogSearch.addEventListener('input', () => {
      const q = blogSearch.value.toLowerCase();
      blogCards.forEach(card => {
        const title = card.getAttribute('data-title') || '';
        const excerpt = card.getAttribute('data-excerpt') || '';
        card.style.display = (title.includes(q) || excerpt.includes(q)) ? 'block' : 'none';
      });
    });
  }

  /* ---- Scroll Reveal (Staggered IntersectionObserver) ---- */
  const observerOptions = {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (entry.target.classList.contains('animate-stagger')) {
          const children = entry.target.querySelectorAll('.reveal');
          children.forEach((child, index) => {
            setTimeout(() => {
              child.classList.add('visible');
            }, index * 150);
          });
        } else {
          entry.target.classList.add('visible');
        }
        revealObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal, .animate-stagger').forEach(el => revealObserver.observe(el));

  /* ---- Hero Parallax (Mouse Tracking) ---- */
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5) * 30;
      const yPos = (clientY / window.innerHeight - 0.5) * 30;
      
      const particles = hero.querySelector('.aurora-particles');
      if (particles) {
        particles.style.transform = `translate(${xPos}px, ${yPos}px)`;
      }
    });
  }

  /* ---- Animated Number Counters ---- */
  const counters = document.querySelectorAll('.counter');
  if (counters.length) {
    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-target'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      const duration = 1800;
      const step = 16;
      const increment = target / (duration / step);
      let current = 0;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        el.textContent = Math.floor(current) + suffix;
      }, step);
    };

    const counterObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObserver.observe(el));
  }

  /* ---- Cookie Consent ---- */
  const cookieBanner = document.getElementById('cookie-consent');
  if (cookieBanner && !localStorage.getItem('dnt-cookie-accepted')) {
    setTimeout(() => cookieBanner.classList.add('show'), 1500);
  }
  const acceptBtn = document.getElementById('cookie-accept');
  const declineBtn = document.getElementById('cookie-decline');
  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('dnt-cookie-accepted', '1');
      cookieBanner.classList.remove('show');
    });
  }
  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      cookieBanner.classList.remove('show');
    });
  }

  // Active Link Detection
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    
    // Normalize href for comparison (remove ../)
    const normalizedHref = href.replace(/\.\.\//g, '');
    
    if (currentPath.endsWith(href) || 
       (href === 'index.html' && (currentPath.endsWith('/') || currentPath === '')) ||
       (currentPath.includes(normalizedHref) && normalizedHref !== 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---- Magnetic Button Effect ---- */
  const magneticBtns = document.querySelectorAll('.btn-magnetic');
  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  /* ---- 3D Tilt Effect ---- */
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)';
    });
  });

  /* ---- Contact Form Submission Feedback ---- */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending...';
        btn.disabled = true;
      }
    });
  }

});
