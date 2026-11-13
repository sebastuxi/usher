/**
 * The page's timeline. Ten equal stretches, one per section; the played part fills as you read, and the solid marker
 * names the current section at its place on the line. It is a real list of links (`aria-current="location"` on the
 * current one). On narrow screens the marker is a button that opens the list as a sheet growing from it.
 */

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export function initNav(): void {
  const masthead = document.querySelector<HTMLElement>('[data-masthead]');
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  const list = nav?.querySelector<HTMLElement>('[data-nav-list]');
  const track = nav?.querySelector<HTMLElement>('.nav-track');
  const toggle = nav?.querySelector<HTMLButtonElement>('[data-nav-toggle]');

  if (!masthead || !nav || !list || !track || !toggle) return;

  const links = [...list.querySelectorAll<HTMLAnchorElement>('a')];
  const sections = links.map((link) => document.getElementById(link.hash.slice(1)));
  const names = [...nav.querySelectorAll<HTMLElement>('[data-nav-name]')];
  const count = links.length;

  const stretches = links.map(() => {
    const stretch = document.createElement('span');

    stretch.className = 'nav-stretch';
    stretch.append(document.createElement('i'));

    return stretch;
  });

  track.prepend(...stretches);

  let current = -1;
  let frame = 0;

  const setCurrent = (index: number) => {
    if (index === current) return;

    current = index;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    for (const name of names) name.textContent = links[index]!.textContent;
  };

  const update = () => {
    frame = 0;

    const navHeight = masthead.offsetHeight;
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const y = clamp(scrollY, 0, maxScroll);
    // A section becomes current once its top passes a quarter of the way down the view.
    const starts: number[] = [];

    sections.forEach((section, i) => {
      const top = section ? section.getBoundingClientRect().top + scrollY : 0;

      // Strictly increasing, so the first section always owns the top of the page.
      starts.push(i === 0 ? 0 : Math.max(top - navHeight - innerHeight * 0.25, starts[i - 1]! + 1));
    });

    let index = 0;

    for (let i = 0; i < count; i++) if (starts[i]! <= y) index = i;

    let progress: number;

    if (y >= maxScroll - 1) {
      index = count - 1;
      progress = 1;
    } else {
      const start = starts[index]!;
      const end = index + 1 < count ? Math.max(starts[index + 1]!, start + 1) : maxScroll;

      progress = clamp((y - start) / (end - start));
    }

    const p = (index + progress) / count;

    nav.style.setProperty('--p', `${(p * 100).toFixed(3)}%`);
    stretches.forEach((stretch, i) => stretch.style.setProperty('--fill', `${(clamp(p * count - i) * 100).toFixed(2)}%`));
    setCurrent(index);
    masthead.toggleAttribute('data-stuck', scrollY > 1);

    // The sheet grows from the marker.
    const width = nav.clientWidth;
    const toggleWidth = toggle.offsetWidth;

    nav.style.setProperty('--toggle-x', `${(p * (width - toggleWidth) + toggleWidth / 2).toFixed(1)}px`);
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', () => {
    close(false);
    schedule();
  });
  new ResizeObserver(schedule).observe(document.body);
  update();

  // Narrow: the marker opens the list.
  const open = () => {
    nav.setAttribute('data-open', '');
    toggle.setAttribute('aria-expanded', 'true');
  };

  function close(returnFocus: boolean) {
    if (!nav!.hasAttribute('data-open')) return;

    nav!.removeAttribute('data-open');
    toggle!.setAttribute('aria-expanded', 'false');
    if (returnFocus) toggle!.focus();
  }

  toggle.addEventListener('click', () => (nav.hasAttribute('data-open') ? close(false) : open()));
  nav.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.hasAttribute('data-open')) {
      event.preventDefault();
      close(true);
    }
  });
  list.addEventListener('click', (event) => {
    if ((event.target as Element).closest('a')) close(false);
  });
  document.addEventListener('pointerdown', (event) => {
    if (!nav.contains(event.target as Node)) close(false);
  });
  nav.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !nav.contains(event.relatedTarget as Node)) close(false);
  });
}
