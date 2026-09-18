import { labelsFromDocument, richTextToString } from './labels';
import type { TilesDoc } from './schema';

export interface ShortlinkTarget {
  canonicalSlug: string;
  href: string;
  title: string;
}

export function buildShortlinks(doc: TilesDoc): Record<string, ShortlinkTarget> {
  const targets = Object.create(null) as Record<string, ShortlinkTarget>;
  const labels = labelsFromDocument(doc);

  for (const label of labels) {
    if (!label.shortlink) continue;
    if (!label.href) {
      throw new Error(`Shortlink "${label.shortlink.slug}" requires an href`);
    }
    if (label.deprecated) {
      throw new Error(`Shortlink "${label.shortlink.slug}" cannot target a deprecated label`);
    }

    const target = {
      canonicalSlug: label.shortlink.slug,
      href: label.href,
      title: richTextToString(label.title) || richTextToString(label.content) || label.shortlink.slug
    };

    for (const slug of [label.shortlink.slug, ...(label.shortlink.aliases ?? [])]) {
      if (targets[slug]) {
        throw new Error(`Duplicate shortlink slug or alias: "${slug}"`);
      }
      targets[slug] = target;
    }
  }

  return targets;
}
