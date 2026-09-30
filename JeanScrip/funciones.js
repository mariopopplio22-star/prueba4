// =====================================================
// HEALTHYFIT - BARRA DE NAVEGACIÓN (navbar.js)
// 1) Celular: hamburguesa ☰ abre el panel, la X / fondo / Escape lo cierran
// 2) Marca en naranja el botón de la página o sección donde estás:
//    - <body data-pagina="inicio">  ↔  <a data-pagina="inicio">
//    - <a data-seccion="servicios"> se activa al llegar a <section id="servicios">
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('hfNav');
  if (!nav) return;

  const toggle   = document.getElementById('navToggle');
  const closeBtn = document.getElementById('navClose');
  const backdrop = document.getElementById('navBackdrop');
  const panel    = document.getElementById('navPanel');
  const links    = [...nav.querySelectorAll('.hf-nav__links a')];
  const celular  = window.matchMedia('(max-width: 768px)');
  const abierto  = () => nav.classList.contains('is-open');

  // ---------- Altura real de la barra (para que los anclajes no queden tapados) ----------
  const medir = () => document.documentElement.style.setProperty('--nav-offset', nav.offsetHeight + 'px');
  medir();
  if ('ResizeObserver' in window) new ResizeObserver(medir).observe(nav);
  else window.addEventListener('resize', medir);

  // ---------- Panel del celular ----------
  function setOpen(open, foco = true) {
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (!foco) return;
    if (open) closeBtn.focus();
    else if (celular.matches) toggle.focus({ preventScroll: true });
  }

  toggle.addEventListener('click', () => setOpen(true));      // ☰ abre
  closeBtn.addEventListener('click', () => setOpen(false));   // ✕ cierra
  backdrop.addEventListener('click', () => setOpen(false));   // tocar fuera cierra

  document.addEventListener('keydown', e => {
    if (!abierto()) return;
    if (e.key === 'Escape') return setOpen(false);
    if (e.key !== 'Tab') return;                              // Tab no sale del panel
    const f = [...panel.querySelectorAll('a[href], button, input')].filter(el => !el.disabled);
    if (!f.length) return;
    const primero = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  let x0 = null;                                              // deslizar a la derecha cierra
  panel.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  panel.addEventListener('touchend', e => {
    if (x0 !== null && e.changedTouches[0].clientX - x0 > 60) setOpen(false);
    x0 = null;
  });

  celular.addEventListener('change', e => { if (!e.matches && abierto()) setOpen(false, false); });

  let t;                                                      // sin animación al redimensionar
  window.addEventListener('resize', () => {
    nav.classList.add('no-anim');
    clearTimeout(t);
    t = setTimeout(() => nav.classList.remove('no-anim'), 150);
  });

  window.addEventListener('pageshow', () => { if (abierto()) setOpen(false, false); });  // botón "Atrás"

  // ---------- Botón activo (rectángulo naranja, letra verde) ----------
  const pagina = document.body.dataset.pagina;
  const propios = links.filter(a => a.dataset.pagina === pagina);
  const conSeccion = propios.filter(a => a.dataset.seccion);

  function activar(esActivo) {
    links.forEach(a => {
      const on = esActivo(a);
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  if (conSeccion.length) {
    // Página con varias secciones (Inicio): el botón cambia según la sección que ves
    const porSeccion = id => activar(a => a.dataset.pagina === pagina && a.dataset.seccion === id);
    const inicial = conSeccion.find(a => a.dataset.seccion === location.hash.slice(1)) || conSeccion[0];
    porSeccion(inicial.dataset.seccion);

    links.forEach(a => a.addEventListener('click', () => {
      if (a.dataset.pagina === pagina && a.dataset.seccion) porSeccion(a.dataset.seccion);
    }));

    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) porSeccion(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' });
    conSeccion.map(a => document.getElementById(a.dataset.seccion)).filter(Boolean).forEach(s => obs.observe(s));
  } else {
    // Página simple (Sobre de Nosotros): se marca su propio botón
    activar(a => propios.includes(a));
  }

  // Al tocar cualquier opción, el panel del celular se cierra
  links.forEach(a => a.addEventListener('click', () => { if (abierto()) setOpen(false, false); }));
});

// =====================================================
// HEALTHYFIT - FUNCIONES (funciones.js)
// Carrusel, tarjetas, carrito, buscador, formularios y ayudas.
// Cada bloque solo funciona si existe en la página.
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const correoValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const mostrar = (el, ok, texto) => { el.className = 'form-msg ' + (ok ? 'ok' : 'error'); el.textContent = texto; };

  // ---------- Aviso flotante ----------
  function aviso(texto) {
    let t = $('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = texto;
    t.classList.add('show');
    clearTimeout(aviso.t);
    aviso.t = setTimeout(() => t.classList.remove('show'), 2200);
  }

  // ---------- Tarjetas y paneles aparecen al hacer scroll ----------
  if ('IntersectionObserver' in window && !sinMovimiento) {
    const ro = new IntersectionObserver((es, o) => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      el.classList.add('in');
      o.unobserve(el);
      setTimeout(() => { el.classList.remove('reveal', 'in'); el.style.transitionDelay = ''; }, 900);  // devuelve el efecto hover
    }), { threshold: .12 });
    document.querySelectorAll('.card, .prod-card, .gallery .slot, .ad, .prod-panel, .faq details, .contact-form')
      .forEach((el, i) => { el.classList.add('reveal'); el.style.transitionDelay = (i % 3) * 90 + 'ms'; ro.observe(el); });
  }

  // ---------- Carrusel (Inicio) ----------
  const track = $('track');
  if (track) {
    const dotsBox = $('dots'), carousel = $('carousel');
    const total = track.children.length;
    let current = 0, timer = null;

    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Ir a la diapositiva ' + (i + 1));
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsBox.appendChild(dot);
    }
    function goTo(i) {
      current = (i + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      [...dotsBox.children].forEach((d, n) => d.classList.toggle('on', n === current));
    }
    function start() { if (!sinMovimiento) timer = setInterval(() => goTo(current + 1), 5000); }
    const stop = () => clearInterval(timer);
    const restart = () => { stop(); start(); };

    $('prev')?.addEventListener('click', () => { goTo(current - 1); restart(); });
    $('next')?.addEventListener('click', () => { goTo(current + 1); restart(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('keydown', e => {                 // flechas del teclado
      if (e.key === 'ArrowLeft')  { goTo(current - 1); restart(); }
      if (e.key === 'ArrowRight') { goTo(current + 1); restart(); }
    });

    let x0 = null;                                              // deslizar con el dedo
    carousel.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    carousel.addEventListener('touchend', e => {
      if (x0 !== null) {
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
        x0 = null;
      }
      start();
    });
    goTo(0); start();
  }

  // ---------- Carrito (el número se guarda entre páginas) ----------
  const badge = $('cartCount');
  const leerCarrito = () => { try { return parseInt(localStorage.getItem('hf_cart'), 10) || 0; } catch (e) { return 0; } };
  let carrito = leerCarrito();
  function pintarCarrito() {
    if (!badge) return;
    badge.textContent = carrito > 99 ? '99+' : carrito;
    badge.hidden = carrito === 0;
  }
  pintarCarrito();
  document.addEventListener('click', e => {
    const b = e.target.closest('.btn-cart');
    if (!b) return;
    carrito++;
    try { localStorage.setItem('hf_cart', carrito); } catch (err) {}
    pintarCarrito();
    if (badge) { badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop'); }
    aviso('✓ ' + b.dataset.nombre + ' agregado al carrito');
  });

  // ---------- Buscador: filtra los productos (Productos) ----------
  const productos = [...document.querySelectorAll('.prod-card')];
  if (productos.length) {
    const input = $('navSearch'), sin = $('noResults'), qTexto = $('qText');
    const q0 = (new URLSearchParams(location.search).get('q') || '').trim();
    if (input && q0) input.value = q0;
    const filtrar = () => {
      const q = (input ? input.value : '').trim().toLowerCase();
      let visibles = 0;
      productos.forEach(c => { const ok = !q || c.textContent.toLowerCase().includes(q); c.hidden = !ok; if (ok) visibles++; });
      document.querySelectorAll('.prod-panel').forEach(p => { p.hidden = !p.querySelector('.prod-card:not([hidden])'); });
      if (sin) { sin.hidden = visibles > 0; if (qTexto) qTexto.textContent = q; }
    };
    input?.addEventListener('input', filtrar);
    filtrar();
  }

  // ---------- Suscripción (pie de página) ----------
  const sub = $('subscribeForm');
  if (sub) sub.addEventListener('submit', e => {
    e.preventDefault();
    const ok = correoValido($('subscribeEmail').value);
    mostrar($('formMsg'), ok, ok ? '¡Listo! Te suscribiste correctamente.' : 'Escribe un correo válido, por ejemplo nombre@gmail.com');
    if (ok) sub.reset();
  });

  // ---------- Formulario de contacto (Contacto) ----------
  const cf = $('contactForm');
  if (cf) cf.addEventListener('submit', e => {
    e.preventDefault();
    const nombre = $('contactName'), correo = $('contactEmail'), asunto = $('contactSubject');
    const mensaje = $('contactMessage'), terminos = $('contactTerms'), msg = $('contactMsg');
    const faltan = [];
    if (nombre.value.trim().length < 3) faltan.push('tu nombre');
    if (!correoValido(correo.value)) faltan.push('un correo válido');
    if (!asunto.value) faltan.push('un asunto');
    if (mensaje.value.trim().length < 10) faltan.push('un mensaje (mínimo 10 letras)');
    if (!terminos.checked) faltan.push('aceptar los términos');
    if (faltan.length) return mostrar(msg, false, 'Por favor completa: ' + faltan.join(', ') + '.');
    mostrar(msg, true, `¡Gracias, ${nombre.value.trim()}! Tu mensaje fue enviado. Te responderemos pronto.`);
    cf.reset();
  });

  // ---------- Barra de progreso y botón "subir" ----------
  const bar = $('progressBar'), toTop = $('toTop');
  function onScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    toTop?.classList.toggle('show', window.scrollY > 500);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  // ---------- Puntos laterales + "Estás en:" (Inicio) ----------
  const puntos = [...document.querySelectorAll('#sectionDots a')];
  const hereName = $('hereName');
  if (puntos.length) {
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      puntos.forEach(d => {
        const on = d.getAttribute('href') === '#' + e.target.id;
        d.classList.toggle('on', on);
        if (on && hereName) hereName.textContent = d.dataset.label;
      });
    }), { rootMargin: '-40% 0px -55% 0px' });
    puntos.map(d => document.querySelector(d.getAttribute('href'))).filter(Boolean).forEach(s => obs.observe(s));
  }
});