import { describe, expect, it } from 'vitest';
import { TilesDoc } from './schema';
import { buildShortlinks } from './shortlinks';
import { shortlinks } from './tiles';

describe('buildShortlinks', () => {
  it('maps a canonical slug and its aliases to the same target', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [],
        identities: [
          {
            title: 'Telegram',
            href: 'https://t.me/example',
            shortlink: { slug: 'telegram', aliases: ['tg'] }
          }
        ]
      }
    });

    const result = buildShortlinks(doc);
    expect(result.telegram).toEqual({
      canonicalSlug: 'telegram',
      href: 'https://t.me/example',
      title: 'Telegram'
    });
    expect(result.tg).toEqual(result.telegram);
  });

  it('rejects duplicate canonical slugs or aliases', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [
          { href: 'https://example.com/a', shortlink: { slug: 'first', aliases: ['shared'] } },
          { href: 'https://example.com/b', shortlink: { slug: 'shared' } }
        ],
        identities: []
      }
    });

    expect(() => buildShortlinks(doc)).toThrow('Duplicate shortlink slug or alias: "shared"');
  });

  it('requires a shortlink label to have an href', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [{ title: 'Missing target', shortlink: { slug: 'missing' } }],
        identities: []
      }
    });

    expect(() => buildShortlinks(doc)).toThrow('Shortlink "missing" requires an href');
  });

  it('rejects shortlinks on deprecated labels', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [
          {
            href: 'https://example.com/old',
            deprecated: true,
            shortlink: { slug: 'old' }
          }
        ],
        identities: []
      }
    });

    expect(() => buildShortlinks(doc)).toThrow('Shortlink "old" cannot target a deprecated label');
  });

  it('accepts prototype-like names as ordinary slugs', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [{ href: 'https://example.com', shortlink: { slug: 'constructor' } }],
        identities: []
      }
    });

    expect(buildShortlinks(doc)['constructor'].href).toBe('https://example.com');
  });

  it('exposes the configured live shortlinks', () => {
    expect(shortlinks.telegram.href).toBe('https://t.me/NeverBehave');
    expect(shortlinks.tg).toEqual(shortlinks.telegram);
    expect(shortlinks.furtrack.href).toBe('https://www.furtrack.com/user/NeverBehave/');
  });
});
