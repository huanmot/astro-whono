import { runFeatureCheck } from './check-build-pages.mjs';

const getGalleryBlock = (html) => {
  const match = html.match(
    /<ul[^>]*\bclass="[^"]*\bgallery\b[^"]*"[^>]*>([\s\S]*?)<\/ul>/i
  );
  return match ? match[1] : '';
};

await runFeatureCheck({
  name: 'Gallery',
  sourceMatchers: [/<ul[^>]*class=["'][^"']*\bgallery\b/i],
  candidate: (html) => /class="[^"]*\bgallery\b/i.test(html),
  checks: [
    {
      id: 'gallery.list',
      test: (html) => /<ul[^>]*\bclass="[^"]*\bgallery\b/i.test(html)
    },
    {
      id: 'gallery.item',
      test: (html) => /<li[\s>]/i.test(getGalleryBlock(html))
    },
    {
      id: 'gallery.figure',
      test: (html) => /<figure[\s>]/i.test(getGalleryBlock(html))
    },
    {
      id: 'gallery.media',
      test: (html) => /<(img|picture)\b/i.test(getGalleryBlock(html))
    }
  ]
});
