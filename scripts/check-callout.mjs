import { runFeatureCheck } from './check-build-pages.mjs';

await runFeatureCheck({
  name: 'Callout',
  sourceMatchers: [
    /:::(?:note|tip|info|warning)(?:\[[^\]]*\])?/i,
    /class\s*=\s*["'][^"']*\bcallout\b/i
  ],
  candidate: (html) => /callout/i.test(html),
  checks: [
    {
      id: 'callout.variant',
      test: (html) => /class="[^"]*\bcallout\b[^"]*\b(?:note|tip|info|warning)\b/i.test(html)
    },
    {
      id: 'callout-title',
      test: (html) => /class="[^"]*\bcallout-title\b/i.test(html)
    }
  ]
});
