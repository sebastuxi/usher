/**
 * Footage credits from `public/media/ATTRIBUTION.md`, rendered at runtime with a small Markdown subset (headings,
 * paragraphs, lists, links, bold and italic). If the file is missing, the general credit in the HTML stays.
 */

function escape(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function inline(text: string): string {
  return escape(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, '$1<a href="$2">$2</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

export function markdown(source: string): string {
  const html: string[] = [];
  let list: string[] | null = null;
  let paragraph: string[] = [];

  const flush = () => {
    if (paragraph.length) html.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
    if (list) html.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    list = null;
  };

  for (const raw of source.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();

    if (!line) {
      flush();
      continue;
    }

    const heading = line.match(/^#{1,6}\s+(.*)$/);
    const item = line.match(/^[-*+]\s+(.*)$/);

    if (heading) {
      flush();
      // The page's own heading is "Credits"; the file's top heading would repeat it.
      if (!/^#\s/.test(line)) html.push(`<h3>${inline(heading[1]!)}</h3>`);
    } else if (item) {
      if (paragraph.length) flush();
      (list ??= []).push(item[1]!);
    } else if (list && /^\s{2,}/.test(raw)) {
      list[list.length - 1] += ` ${line}`;
    } else {
      if (list) flush();
      paragraph.push(line);
    }
  }

  flush();

  return html.join('');
}

export async function loadAttribution(target: HTMLElement): Promise<void> {
  try {
    const response = await fetch('./media/ATTRIBUTION.md');
    const type = response.headers.get('content-type') ?? '';

    // A dev server answers unknown paths with the page itself; only take real Markdown or text.
    if (!response.ok || type.includes('html')) return;

    const text = await response.text();

    if (!text.trim() || /^\s*<!doctype/i.test(text)) return;

    target.innerHTML = markdown(text);
  } catch {
    // Keep the general credit.
  }
}
