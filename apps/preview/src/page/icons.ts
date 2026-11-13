/**
 * The icon specimen, from the skin's own `usherIcons` (loaded only when the section comes near).
 */
import { usherIcons } from '@/video/icons';

export function renderIcons(list: HTMLElement): void {
  const items = Object.entries(usherIcons).map(([name, svg]) => {
    const item = document.createElement('li');
    const big = document.createElement('span');
    const foot = document.createElement('span');
    const small = document.createElement('span');
    const label = document.createElement('span');

    item.className = 'icon';
    big.className = 'icon-big';
    big.innerHTML = svg;
    big.setAttribute('aria-hidden', 'true');
    foot.className = 'icon-foot';
    small.className = 'icon-small';
    small.innerHTML = svg;
    small.setAttribute('aria-hidden', 'true');
    label.className = 'icon-name';
    label.textContent = name;
    foot.append(small, label);
    item.append(big, foot);

    return item;
  });

  list.replaceChildren(...items);
}
