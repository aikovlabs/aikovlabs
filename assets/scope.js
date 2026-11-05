(() => {
  const scope = document.getElementById('scope');
  if (!scope || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  const img = scope.querySelector('.layers');
  const steps = [...scope.querySelectorAll('.step')];
  const rail = [...scope.querySelectorAll('.rail li')];
  const readout = scope.querySelector('.readout');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Zoom stops: scale and the image point (fraction of width/height) brought to centre.
  const stops = [
    { s: 1.0, x: 0.5, y: 0.5 },
    { s: 2.6, x: 0.479, y: 0.492 },
  ];
  // Scroll progress breakpoints: hold, travel, hold, travel...
  const holds = [[0, 0.15], [0.7, 1]];

  root.classList.add('live');

  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  function position(p) {
    for (let i = 0; i < holds.length; i++) {
      const [a, b] = holds[i];
      if (p <= b) {
        if (p >= a || i === 0) return i;
        const prevEnd = holds[i - 1][1];
        return i - 1 + ease((p - prevEnd) / (a - prevEnd));
      }
    }
    return holds.length - 1;
  }

  let current = -1;
  let frame = 0;

  function render() {
    frame = 0;
    const rect = scope.getBoundingClientRect();
    const stage = scope.firstElementChild.getBoundingClientRect();
    const travel = rect.height - stage.height;
    const p = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
    let t = position(p);
    if (reduce.matches) t = Math.round(t);

    const i = Math.min(stops.length - 2, Math.floor(t));
    const f = t - i;
    const A = stops[i], B = stops[i + 1];
    const s = A.s + (B.s - A.s) * f;
    let x = A.x + (B.x - A.x) * f;
    let y = A.y + (B.y - A.y) * f;
    const lim = 0.5 * (1 - 1 / s);
    const dx = Math.max(-lim, Math.min(lim, 0.5 - x));
    const dy = Math.max(-lim, Math.min(lim, 0.5 - y));
    img.style.transform = `scale(${s.toFixed(4)}) translate(${(dx * 100).toFixed(3)}%, ${(dy * 100).toFixed(3)}%)`;

    const active = Math.round(t);
    if (active !== current) {
      current = active;
      steps.forEach((el, n) => el.classList.toggle('on', n === active));
      rail.forEach((el, n) => el.classList.toggle('on', n === active));
      img.classList.toggle('counted', active === 1);
      readout.classList.toggle('on', active === 1);
    }
  }

  const request = () => { if (!frame) frame = requestAnimationFrame(render); };
  addEventListener('scroll', request, { passive: true });
  addEventListener('resize', request);
  reduce.addEventListener?.('change', request);
  render();

  // Keyboard users tabbing into a hidden step: jump the scroll to that step.
  scope.addEventListener('focusin', e => {
    const step = e.target.closest('.step');
    if (!step || step.classList.contains('on')) return;
    const n = steps.indexOf(step);
    const rect = scope.getBoundingClientRect();
    const travel = rect.height - scope.firstElementChild.offsetHeight;
    const mid = (holds[n][0] + holds[n][1]) / 2;
    scrollTo({ top: scrollY + rect.top + travel * mid, behavior: 'instant' });
  });
})();
