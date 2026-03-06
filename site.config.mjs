const rawSiteUrl = (process.env.SITE_URL ?? '').trim();
const siteUrl = rawSiteUrl ? rawSiteUrl.replace(/\/+$/, '') : '';
const hasSiteUrl = siteUrl.length > 0;
const fallbackSiteUrl = 'https://www.bthl.space';

if (!hasSiteUrl && process.env.NODE_ENV === 'production') {
  console.warn(
    `[astro-whono] SITE_URL is not set. Falling back to ${fallbackSiteUrl} for feed links; canonical/og and sitemap stay disabled until SITE_URL is configured.`
  );
}

export const site = {
  url: hasSiteUrl ? siteUrl : fallbackSiteUrl,
  title: '冰糖葫芦',
  brandTitle: '冰糖葫芦',
  author: '冰糖葫芦',
  authorAvatar: 'author/avatar.webp',
  description: 'Wonderful, Entertaining, and Distinctive',
  sidebarQuote: 'Wonderful, Entertaining, and Distinctive'
};

export const PAGE_SIZE_ARCHIVE = 12;
export const PAGE_SIZE_ESSAY = 12;

export { hasSiteUrl, siteUrl };
