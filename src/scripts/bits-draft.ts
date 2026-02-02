const dialog = document.getElementById('bits-draft-dialog') as HTMLDialogElement | null;
const openBtn = document.querySelector<HTMLButtonElement>('[data-new-bit]');

const form = dialog?.querySelector<HTMLFormElement>('[data-bits-draft-form]') ?? null;
const closeBtns = dialog?.querySelectorAll<HTMLElement>('[data-bits-draft-close]') ?? [];
const generateBtn = dialog?.querySelector<HTMLButtonElement>('[data-bits-draft-generate]') ?? null;
const downloadBtn = dialog?.querySelector<HTMLButtonElement>('[data-bits-draft-download]') ?? null;
const statusEl = dialog?.querySelector<HTMLElement>('[data-bits-draft-status]') ?? null;
const manualOpenBtn = dialog?.querySelector<HTMLButtonElement>('[data-bits-manual-open]') ?? null;
const manualBox = dialog?.querySelector<HTMLElement>('[data-bits-manual]') ?? null;
const manualTextarea = dialog?.querySelector<HTMLTextAreaElement>('[data-bits-manual-textarea]') ?? null;
const manualNote = dialog?.querySelector<HTMLElement>('[data-bits-manual-note]') ?? null;
const manualCopyBtn = dialog?.querySelector<HTMLButtonElement>('[data-bits-manual-copy]') ?? null;
const toolbar = dialog?.querySelector<HTMLElement>('[data-bits-draft-toolbar]') ?? null;
const quoteBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="quote"]') ?? null;
const listBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="list"]') ?? null;
const boldBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="bold"]') ?? null;
const italicBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="italic"]') ?? null;
const codeBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="code"]') ?? null;
const linkBtn = toolbar?.querySelector<HTMLButtonElement>('[data-action="link"]') ?? null;

const contentEl = dialog?.querySelector<HTMLTextAreaElement>('#bits-draft-content') ?? null;
const tagsEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-tags') ?? null;
const placeEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-place') ?? null;
const imageEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-image') ?? null;
const imageWidthEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-image-width') ?? null;
const imageHeightEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-image-height') ?? null;
const draftEl = dialog?.querySelector<HTMLInputElement>('#bits-draft-draft') ?? null;
const imageDims = dialog?.querySelectorAll<HTMLElement>('[data-bits-image-dimensions]') ?? [];

const pad2 = (value: number) => String(value).padStart(2, '0');
const base = import.meta.env.BASE_URL ?? '/';
const withBase = (path: string) => {
  const baseNormalized = base.endsWith('/') ? base : `${base}/`;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${baseNormalized}${clean}`;
};
const formatDateLocal = () => {
  const d = new Date();
  const tzMinutes = -d.getTimezoneOffset();
  const sign = tzMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(tzMinutes);
  const tzH = pad2(Math.floor(abs / 60));
  const tzM = pad2(abs % 60);
  const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const timePart = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return `${datePart}T${timePart}${sign}${tzH}:${tzM}`;
};

const formatFileStamp = () => {
  const d = new Date();
  const datePart = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const timePart = `${pad2(d.getHours())}${pad2(d.getMinutes())}`;
  return `${datePart}-${timePart}`;
};

const setStatus = (text: string, tone: 'info' | 'error' | 'success' = 'info') => {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.setAttribute('data-tone', tone);
};

const clearStatus = () => {
  if (!statusEl) return;
  statusEl.textContent = '';
  statusEl.removeAttribute('data-tone');
};

let lastMarkdown = '';
let hasGenerated = false;
let lastEditSource: 'typing' | 'toolbar' = 'typing';
let isApplyingToolbar = false;
const toolbarUndoStack: Array<{ value: string; start: number; end: number }> = [];

const updateManualLink = () => {
  if (!manualOpenBtn) return;
  const hasContent = !!contentEl?.value.trim();
  manualOpenBtn.hidden = !(hasGenerated || hasContent);
};

const focusTextarea = () => {
  contentEl?.focus();
};

const pushToolbarUndo = () => {
  if (!contentEl) return;
  const start = contentEl.selectionStart ?? 0;
  const end = contentEl.selectionEnd ?? 0;
  toolbarUndoStack.push({ value: contentEl.value, start, end });
  if (toolbarUndoStack.length > 50) toolbarUndoStack.shift();
};

const applyToolbarAction = (fn: () => void) => {
  if (!contentEl) return;
  pushToolbarUndo();
  isApplyingToolbar = true;
  fn();
  isApplyingToolbar = false;
  lastEditSource = 'toolbar';
  updateToolbarActive();
  updateManualLink();
};

const getLineAtCursor = () => {
  if (!contentEl) return { line: '', lineStart: 0, lineEnd: 0 };
  const value = contentEl.value;
  const cursor = contentEl.selectionStart ?? 0;
  const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
  const lineEndIndex = value.indexOf('\n', cursor);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const line = value.slice(lineStart, lineEnd);
  return { line, lineStart, lineEnd };
};

const isWrappedBy = (before: string, after: string, start: number, end: number) => {
  if (!contentEl) return false;
  const value = contentEl.value;
  const left = value.lastIndexOf(before, start);
  if (left === -1) return false;
  const right = value.indexOf(after, end);
  if (right === -1 || right <= left) return false;
  return left + before.length <= start && end <= right;
};

const findSingleStarBefore = (value: string, index: number) => {
  for (let i = index - 1; i >= 0; i -= 1) {
    if (value[i] !== '*') continue;
    if (value[i - 1] === '*' || value[i + 1] === '*') continue;
    return i;
  }
  return -1;
};

const findSingleStarAfter = (value: string, index: number) => {
  for (let i = index; i < value.length; i += 1) {
    if (value[i] !== '*') continue;
    if (value[i - 1] === '*' || value[i + 1] === '*') continue;
    return i;
  }
  return -1;
};

const isInsideSingleStar = (start: number, end: number) => {
  if (!contentEl) return false;
  const value = contentEl.value;
  const left = findSingleStarBefore(value, start);
  if (left === -1) return false;
  const right = findSingleStarAfter(value, end);
  if (right === -1 || right <= left) return false;
  return left + 1 <= start && end <= right;
};

const isInsideLink = (start: number, end: number) => {
  if (!contentEl) return false;
  const value = contentEl.value;
  const left = value.lastIndexOf('[', start);
  if (left === -1) return false;
  const mid = value.indexOf('](', left);
  if (mid === -1) return false;
  const right = value.indexOf(')', mid);
  if (right === -1) return false;
  return start >= left + 1 && end <= right;
};

const updateToolbarActive = () => {
  if (!contentEl) return;
  const { line } = getLineAtCursor();
  const start = contentEl.selectionStart ?? 0;
  const end = contentEl.selectionEnd ?? 0;
  const boldActive = isWrappedBy('**', '**', start, end);
  const italicActive = !boldActive && isInsideSingleStar(start, end);
  const codeActive = isWrappedBy('`', '`', start, end);
  const linkActive = isInsideLink(start, end);
  const quoteActive = /^\s*>\s?/.test(line);
  const listActive = /^\s*[-*+]\s+/.test(line);

  boldBtn?.classList.toggle('is-active', boldActive);
  italicBtn?.classList.toggle('is-active', italicActive);
  codeBtn?.classList.toggle('is-active', codeActive);
  linkBtn?.classList.toggle('is-active', linkActive);
  quoteBtn?.classList.toggle('is-active', quoteActive);
  listBtn?.classList.toggle('is-active', listActive);
};

const wrapSelection = (before: string, after: string, placeholder: string) => {
  if (!contentEl) return;
  focusTextarea();
  const start = contentEl.selectionStart ?? 0;
  const end = contentEl.selectionEnd ?? 0;
  const hasSelection = start !== end;
  const selected = hasSelection ? contentEl.value.slice(start, end) : placeholder;
  const next = `${before}${selected}${after}`;
  contentEl.setRangeText(next, start, end, 'select');
  const innerStart = start + before.length;
  const innerEnd = innerStart + selected.length;
  contentEl.setSelectionRange(innerStart, innerEnd);
  focusTextarea();
};

const insertText = (text: string) => {
  if (!contentEl) return;
  focusTextarea();
  const start = contentEl.selectionStart ?? 0;
  const end = contentEl.selectionEnd ?? 0;
  contentEl.setRangeText(text, start, end, 'end');
  focusTextarea();
};

const prefixLines = (prefix: string) => {
  if (!contentEl) return;
  focusTextarea();
  const value = contentEl.value;
  const start = contentEl.selectionStart ?? 0;
  const end = contentEl.selectionEnd ?? 0;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const lineEndIndex = value.indexOf('\n', end);
  const lineEnd = lineEndIndex === -1 ? value.length : lineEndIndex;
  const segment = value.slice(lineStart, lineEnd);
  const lines = segment.split('\n');
  const prefixed = lines
    .map((line) => (line.startsWith(prefix) ? line : `${prefix}${line}`))
    .join('\n');
  contentEl.setRangeText(prefixed, lineStart, lineEnd, 'select');
  contentEl.setSelectionRange(lineStart, lineStart + prefixed.length);
  focusTextarea();
};

const rememberMarkdown = (markdown: string) => {
  hasGenerated = true;
  lastMarkdown = markdown;
  updateManualLink();
};

const hideManualCopy = () => {
  if (manualBox) manualBox.hidden = true;
  if (manualTextarea) manualTextarea.value = '';
  if (manualNote) manualNote.textContent = '';
  manualOpenBtn?.setAttribute('aria-expanded', 'false');
  manualOpenBtn?.classList.remove('is-open');
};

const showManualCopy = (text: string, message: string) => {
  if (!manualBox || !manualTextarea) return;
  manualTextarea.value = text;
  manualBox.hidden = false;
  if (manualNote) manualNote.textContent = message;
  manualOpenBtn?.setAttribute('aria-expanded', 'true');
  manualOpenBtn?.classList.add('is-open');
  window.setTimeout(() => {
    manualTextarea.focus();
    manualTextarea.select();
  }, 0);
};

const parseTags = (raw: string) => {
  const parts = raw
    .split(/[,\s，]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return Array.from(new Set(parts));
};

const normalizeTagInput = (value: string) => {
  return value.replace(/，/g, ',').replace(/\s{2,}/g, ' ');
};

const formatTag = (value: string) => {
  const needsQuotes = /[:#\n\r\t]|^\s|\s$|^-/.test(value);
  if (!needsQuotes) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
};

const normalizeImage = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return trimmed.replace(/^\/+/, '');
};

const resolveImageUrl = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const baseNormalized = base.endsWith('/') ? base : `${base}/`;
  if (trimmed.startsWith(baseNormalized)) return trimmed;
  return withBase(trimmed.replace(/^\/+/, ''));
};

const setImageFieldsActive = (active: boolean) => {
  imageDims.forEach((el) => {
    el.hidden = !active;
  });
  if (imageWidthEl) imageWidthEl.disabled = !active;
  if (imageHeightEl) imageHeightEl.disabled = !active;
  if (!active) {
    if (imageWidthEl) imageWidthEl.value = '';
    if (imageHeightEl) imageHeightEl.value = '';
  }
};

const syncImageFields = () => {
  const hasImage = !!imageEl?.value.trim();
  setImageFieldsActive(hasImage);
};

let lastImageValue = '';
let imageRequestId = 0;
const fillImageDimensions = () => {
  if (!imageEl) return;
  const raw = imageEl.value.trim();
  if (!raw) {
    lastImageValue = '';
    return;
  }
  if (raw === lastImageValue) return;
  lastImageValue = raw;
  const resolved = resolveImageUrl(raw);
  if (!resolved) return;
  const requestId = ++imageRequestId;
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => {
    if (requestId !== imageRequestId) return;
    const width = img.naturalWidth;
    const height = img.naturalHeight;
    if (!width || !height) {
      setStatus('无法自动读取，请手动填写。');
      return;
    }
    if (imageWidthEl) imageWidthEl.value = String(width);
    if (imageHeightEl) imageHeightEl.value = String(height);
    setStatus(`已自动读取：${width}×${height}`);
  };
  img.onerror = () => {
    if (requestId !== imageRequestId) return;
    setStatus('无法自动读取，请手动填写。');
  };
  img.src = resolved;
};

const tryClipboardCopy = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

const buildMarkdown = () => {
  if (!contentEl) return null;
  const content = contentEl.value.trim();
  if (!content) {
    setStatus('请先填写内容。', 'error');
    contentEl.focus();
    return null;
  }

  const imageValue = normalizeImage(imageEl?.value ?? '');
  const widthValue = imageWidthEl?.value.trim() ?? '';
  const heightValue = imageHeightEl?.value.trim() ?? '';

  let widthNumber: number | null = null;
  let heightNumber: number | null = null;
  if (imageValue) {
    if (!widthValue || !heightValue) {
      setStatus('图片已填写，请补全宽高。', 'error');
      if (!widthValue) imageWidthEl?.focus();
      else imageHeightEl?.focus();
      return null;
    }
    widthNumber = Number(widthValue);
    heightNumber = Number(heightValue);
    if (!Number.isFinite(widthNumber) || widthNumber <= 0) {
      setStatus('图片宽度需为正数。', 'error');
      imageWidthEl?.focus();
      return null;
    }
    if (!Number.isFinite(heightNumber) || heightNumber <= 0) {
      setStatus('图片高度需为正数。', 'error');
      imageHeightEl?.focus();
      return null;
    }
  }

  let tags = parseTags(tagsEl?.value ?? '');
  const rawPlace = (placeEl?.value ?? '').trim();
  const placeValue = rawPlace.replace(/^loc:/i, '').trim();
  if (placeValue) {
    tags = tags.filter((tag) => !tag.trim().toLowerCase().startsWith('loc:'));
    tags.unshift(`loc:${placeValue}`);
  }
  const lines: string[] = ['---', `date: ${formatDateLocal()}`];

  if (tags.length) {
    lines.push('tags:');
    tags.forEach((tag) => {
      lines.push(`  - ${formatTag(tag)}`);
    });
  }

  if (draftEl?.checked) {
    lines.push('draft: true');
  }

  if (imageValue) {
    lines.push(`image: ${imageValue}`);
    lines.push(`imageWidth: ${widthNumber}`);
    lines.push(`imageHeight: ${heightNumber}`);
  }

  lines.push('---', '', content);
  return lines.join('\n');
};

const openDialog = () => {
  if (!dialog) return;
  if (dialog.open) return;
  clearStatus();
  hideManualCopy();
  updateManualLink();
  syncImageFields();
  updateToolbarActive();
  dialog.showModal();
  window.setTimeout(() => {
    contentEl?.focus();
  }, 0);
};

const closeDialog = () => {
  if (!dialog) return;
  hideManualCopy();
  hasGenerated = false;
  lastMarkdown = '';
  updateManualLink();
  dialog.close();
};

if (openBtn && dialog) {
  openBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openDialog();
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      closeDialog();
    });
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
    }
  });

  dialog.addEventListener('cancel', () => {
    closeDialog();
  });
}

imageEl?.addEventListener('input', () => {
  syncImageFields();
});
imageEl?.addEventListener('change', () => {
  syncImageFields();
  fillImageDimensions();
});

form?.addEventListener('input', () => {
  if (statusEl?.textContent) clearStatus();
  if (manualBox && !manualBox.hidden) hideManualCopy();
  updateManualLink();
});

contentEl?.addEventListener('input', () => {
  updateToolbarActive();
  updateManualLink();
  if (!isApplyingToolbar) {
    lastEditSource = 'typing';
  }
});

contentEl?.addEventListener('mouseup', () => {
  updateToolbarActive();
});

contentEl?.addEventListener('keyup', () => {
  updateToolbarActive();
});

contentEl?.addEventListener('keydown', (event) => {
  const isUndo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z';
  if (!isUndo) return;
  if (lastEditSource !== 'toolbar' || toolbarUndoStack.length === 0) return;
  event.preventDefault();
  const snapshot = toolbarUndoStack.pop();
  if (!snapshot || !contentEl) return;
  isApplyingToolbar = true;
  contentEl.value = snapshot.value;
  contentEl.setSelectionRange(snapshot.start, snapshot.end);
  isApplyingToolbar = false;
  updateToolbarActive();
  updateManualLink();
  if (toolbarUndoStack.length === 0) {
    lastEditSource = 'typing';
  }
});

tagsEl?.addEventListener('input', () => {
  if (!tagsEl) return;
  const before = tagsEl.value;
  const normalized = normalizeTagInput(before);
  if (normalized === before) return;
  const start = tagsEl.selectionStart ?? normalized.length;
  const end = tagsEl.selectionEnd ?? normalized.length;
  const beforeStart = normalizeTagInput(before.slice(0, start));
  const beforeEnd = normalizeTagInput(before.slice(0, end));
  tagsEl.value = normalized;
  tagsEl.setSelectionRange(beforeStart.length, beforeEnd.length);
});

form?.addEventListener('submit', (event) => {
  event.preventDefault();
});

manualCopyBtn?.addEventListener('click', async () => {
  if (!manualTextarea) return;
  manualTextarea.focus();
  manualTextarea.select();
  const ok = await tryClipboardCopy(manualTextarea.value);
  if (manualNote) {
    manualNote.textContent = ok ? '已复制草稿。' : '已为你选中文本，按 ⌘C / Ctrl+C 复制。';
  }
});

manualOpenBtn?.addEventListener('click', () => {
  clearStatus();
  if (manualBox && !manualBox.hidden) {
    hideManualCopy();
    return;
  }
  const contentValue = contentEl?.value.trim() ?? '';
  let markdown = '';
  if (contentValue) {
    const built = buildMarkdown();
    if (!built) return;
    markdown = built;
    rememberMarkdown(markdown);
  } else if (hasGenerated && lastMarkdown) {
    markdown = lastMarkdown;
  } else {
    setStatus('请先填写内容。', 'error');
    contentEl?.focus();
    return;
  }
  showManualCopy(markdown, '已生成草稿。');
});

toolbar?.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null;
  const button = target?.closest<HTMLButtonElement>('button[data-action]');
  if (!button) return;
  const action = button.getAttribute('data-action');
  if (!action) return;
  applyToolbarAction(() => {
    switch (action) {
      case 'bold':
        wrapSelection('**', '**', 'text');
        break;
      case 'italic':
        wrapSelection('*', '*', 'text');
        break;
      case 'code':
        wrapSelection('`', '`', 'code');
        break;
      case 'quote':
        prefixLines('> ');
        break;
      case 'list':
        prefixLines('- ');
        break;
      case 'link':
        wrapSelection('[', '](url)', 'text');
        break;
      case 'paragraph':
        insertText('\n\n');
        break;
      default:
        break;
    }
  });
});

generateBtn?.addEventListener('click', async () => {
  clearStatus();
  hideManualCopy();
  const markdown = buildMarkdown();
  if (!markdown) return;
  rememberMarkdown(markdown);
  if (!window.isSecureContext || !navigator.clipboard?.writeText) {
    showManualCopy(
      markdown,
      '已生成草稿。'
    );
    return;
  }
  const ok = await tryClipboardCopy(markdown);
  if (ok) setStatus('已复制草稿。', 'success');
  else {
    showManualCopy(
      markdown,
      '已生成草稿。'
    );
  }
});

downloadBtn?.addEventListener('click', () => {
  clearStatus();
  hideManualCopy();
  const markdown = buildMarkdown();
  if (!markdown) return;
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `bits-${formatFileStamp()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus('已下载草稿。', 'success');
});
