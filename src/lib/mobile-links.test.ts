import { describe, expect, it } from 'vitest';
import { buildMobileLinks } from './mobile-links';
import { TilesDoc } from './schema';
import { mobileLinks } from './tiles';

describe('buildMobileLinks', () => {
  it('sorts selected labels and preserves their presentation metadata', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [
          {
            title: 'Second',
            href: 'https://example.com/second',
            mobile: { order: 20, tier: 'secondary' }
          },
          {
            title: 'First',
            icon: 'fab:telegram',
            href: 'https://example.com/first',
            mobile: { order: 10, tier: 'primary', description: 'Start here' }
          }
        ],
        identities: []
      }
    });

    expect(buildMobileLinks(doc)).toEqual([
      {
        description: 'Start here',
        href: 'https://example.com/first',
        icon: 'fab:telegram',
        order: 10,
        tier: 'primary',
        title: 'First'
      },
      {
        description: undefined,
        href: 'https://example.com/second',
        icon: undefined,
        order: 20,
        tier: 'secondary',
        title: 'Second'
      }
    ]);
  });

  it('rejects duplicate display orders', () => {
    const doc = TilesDoc.parse({
      sections: {
        header: [
          { title: 'A', href: 'https://example.com/a', mobile: { order: 10, tier: 'primary' } },
          { title: 'B', href: 'https://example.com/b', mobile: { order: 10, tier: 'secondary' } }
        ],
        identities: []
      }
    });

    expect(() => buildMobileLinks(doc)).toThrow('Duplicate mobile link order: 10');
  });

  it('requires a target and rejects deprecated labels', () => {
    const missingTarget = TilesDoc.parse({
      sections: {
        header: [{ title: 'Missing', mobile: { order: 10, tier: 'primary' } }],
        identities: []
      }
    });
    const deprecated = TilesDoc.parse({
      sections: {
        header: [
          {
            title: 'Old',
            href: 'https://example.com/old',
            deprecated: true,
            mobile: { order: 10, tier: 'primary' }
          }
        ],
        identities: []
      }
    });

    expect(() => buildMobileLinks(missingTarget)).toThrow('Mobile link at order 10 requires an href');
    expect(() => buildMobileLinks(deprecated)).toThrow('Mobile link at order 10 cannot target a deprecated label');
  });

  it('exposes the curated live NFC links in order', () => {
    expect(mobileLinks.map((link) => link.title)).toEqual([
      'Telegram: @NeverBehave',
      'Furtrack: NeverBehave',
      'Twitter / X: @_NeverBehave_'
    ]);

    expect(mobileLinks.map((link) => link.icon)).toEqual(['fab:telegram', 'fas:photo-film', 'fab:x-twitter']);
  });
});
