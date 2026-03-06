const MORE_REGEX = /<!--\s*more\s*-->/i;
const CALLOUT_OPEN_REGEX = /^\s*:::[a-z-]+(?:\[[^\]]*\])?\s*$/gim;
const CALLOUT_CLOSE_REGEX = /^\s*:::\s*$/gim;

export function splitMore(md: string): string {
  if (!md) return '';
  const match = md.match(MORE_REGEX);
  if (!match) return md;
  const index = match.index ?? -1;
  return index >= 0 ? md.slice(0, index) : md;
}

export function cleanMarkdownToText(md: string): string {
  if (!md) return '';
  let text = md;

  text = text.replace(/```[\s\S]*?```/g, ' ');
  text = text.replace(/~~~[\s\S]*?~~~/g, ' ');
  text = text.replace(CALLOUT_OPEN_REGEX, ' ');
  text = text.replace(CALLOUT_CLOSE_REGEX, ' ');
  text = text.replace(/!\[[^\]]*]\([^)]+\)/g, ' ');
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  text = text.replace(/`[^`]*`/g, ' ');

  text = text.replace(/^\s*#{1,6}\s+/gm, '');
  text = text.replace(/^\s*>\s?/gm, '');
  text = text.replace(/^\s*[-*+]\s+/gm, '');
  text = text.replace(/^\s*\d+[\.\)]\s+/gm, '');

  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/\r?\n+/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

export function excerptFromMarkdown(md: string, maxChars = 120): string {
  const sliced = splitMore(md);
  const cleaned = cleanMarkdownToText(sliced);
  if (!cleaned) return '';
  if (cleaned.length <= maxChars) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxChars))}…`;
}

export function getListExcerpt(entry: { body?: string }): string {
  return excerptFromMarkdown(entry?.body ?? '', 120);
}

export function getBitsExcerpt(entry: { body?: string }): string {
  return excerptFromMarkdown(entry?.body ?? '', 180);
}

export function getMetaDescription(entry: { body?: string; data?: { description?: string } }): string {
  const raw = entry?.data?.description ?? '';
  const trimmed = typeof raw === 'string' ? raw.trim() : '';
  if (trimmed) return trimmed;
  return excerptFromMarkdown(entry?.body ?? '', 90);
}
