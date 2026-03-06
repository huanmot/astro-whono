import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const contentDir = path.resolve('src', 'content');

const walkFiles = async (dir, include) => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const groups = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(entryPath, include);
    }
    return include(entryPath) ? [entryPath] : [];
  }));

  return groups.flat();
};

const loadBuiltPages = async () => {
  const files = await walkFiles(distDir, (filePath) => filePath.endsWith('.html'));

  if (!files.length) {
    console.error('Build check failed: unable to read build output.');
    console.error(`Expected HTML files under: ${distDir}`);
    console.error('Run `npm run build` first.');
    process.exit(1);
  }

  const pages = await Promise.all(files.map(async (filePath) => ({
    filePath,
    relativePath: path.relative(distDir, filePath).replace(/\\/g, '/'),
    html: await readFile(filePath, 'utf8')
  })));

  return pages;
};

const sourceUsesFeature = async (matchers) => {
  const sourceFiles = await walkFiles(contentDir, (filePath) => /\.mdx?$/i.test(filePath));

  for (const filePath of sourceFiles) {
    const source = await readFile(filePath, 'utf8');
    if (matchers.some((matcher) => matcher.test(source))) {
      return true;
    }
  }

  return false;
};

export const runFeatureCheck = async ({
  name,
  sourceMatchers,
  candidate,
  checks
}) => {
  const pages = await loadBuiltPages();

  if (!(await sourceUsesFeature(sourceMatchers))) {
    console.log(`${name} check skipped: no source content uses this feature.`);
    return;
  }

  let bestCandidate = null;

  for (const page of pages) {
    const matchedCount = checks.filter((item) => item.test(page.html)).length;

    if (matchedCount === checks.length) {
      console.log(`${name} check passed (${page.relativePath}).`);
      return;
    }

    if (candidate && !candidate(page.html)) {
      continue;
    }

    if (!bestCandidate || matchedCount > bestCandidate.matchedCount) {
      bestCandidate = { page, matchedCount };
    }
  }

  console.error(`${name} check failed.`);

  if (!bestCandidate) {
    console.error('No built page contained this feature after build.');
    process.exit(1);
  }

  console.error(`Best candidate: ${bestCandidate.page.relativePath}`);

  for (const item of checks) {
    if (!item.test(bestCandidate.page.html)) {
      console.error(`- missing ${item.id}`);
    }
  }

  process.exit(1);
};
