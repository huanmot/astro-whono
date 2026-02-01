import rss from '@astrojs/rss';
import { getPublished, isReservedSlug } from '../../lib/content';
import { site } from '../../../site.config.mjs';

const base = import.meta.env.BASE_URL ?? '/';
const baseNormalized = base.endsWith('/') ? base : `${base}/`;
const withBase = (path) => {
  if (!path || path === '/') return baseNormalized;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${baseNormalized}${clean}`;
};

export async function GET(context) {
  const essays = await getPublished('essay', {
    includeDraft: false,
    orderBy: (a, b) => b.data.date.valueOf() - a.data.date.valueOf()
  });
  const visibleEssays = essays.filter((entry) => !isReservedSlug(entry.data.slug ?? entry.id));

  return rss({
    title: `${site.title} · 随笔`,
    description: '随笔与杂记更新',
    site: context.site,
    items: visibleEssays.map((entry) => ({
      title: entry.data.title,
      pubDate: entry.data.date,
      description: entry.data.description,
      link: withBase(`/archive/${entry.data.slug ?? entry.id}/`)
    }))
  });
}
