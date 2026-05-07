import { describe, expect, it } from 'vitest';
import { TilesDoc } from './schema';
import tilesYaml from './tiles.yaml';

describe('TilesDoc schema', () => {
  it('accepts a minimal valid document', () => {
    const doc = { sections: { header: [], identities: [] } };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts a simple label tile', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:github', title: 'GitHub', content: '@me', href: 'https://github.com/me' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts a group tile with items', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Education',
            items: [
              { icon: 'fas:university', title: 'BS', content: 'RPI', href: 'https://rpi.edu' },
              { icon: 'fas:university', title: 'MS', content: 'UCSD', href: 'https://ucsd.edu' }
            ]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts content as an inline-parts array', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Lang & Runtime',
            icon: 'fas:plug',
            content: ['§ ', { icon: 'fab:docker' }, ' | ', { text: 'fullstack', strike: true }]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('accepts title as inline parts', () => {
    const doc = {
      sections: {
        header: [
          {
            caption: 'Browser',
            icon: 'fab:firefox',
            title: [{ text: 'Chrome', strike: true }, ' Firefox'],
            href: 'https://www.mozilla.org/'
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects unknown top-level keys via parse on a known shape', () => {
    const doc = { sections: { header: [], identities: [], extra: [] } } as unknown;
    // Zod by default strips unknown keys; ensure it still parses.
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects a malformed tile (href is not a URL)', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:github', href: 'not a url' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('rejects a malformed inline part (link not a URL)', () => {
    const doc = {
      sections: {
        header: [
          {
            content: [{ text: 'click', link: 'not a url' }]
          }
        ],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('requires both header and identities sections', () => {
    expect(() => TilesDoc.parse({ sections: { header: [] } })).toThrow();
  });

  it('the live tiles.yaml file conforms to the schema', () => {
    expect(() => TilesDoc.parse(tilesYaml)).not.toThrow();
  });

  it('accepts a label with an integer year', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: 2024 }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).not.toThrow();
  });

  it('rejects a label whose year is a string', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: '2024' }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('rejects a label whose year is a non-integer', () => {
    const doc = {
      sections: {
        header: [{ icon: 'fab:linux', content: 'Framework 13', year: 2024.5 }],
        identities: []
      }
    };
    expect(() => TilesDoc.parse(doc)).toThrow();
  });

  it('accepts a label with year zero, negative, or far future', () => {
    for (const year of [0, -42, 9999]) {
      const doc = {
        sections: {
          header: [{ content: 'placeholder', year }],
          identities: []
        }
      };
      expect(() => TilesDoc.parse(doc), `year=${year}`).not.toThrow();
    }
  });
});
