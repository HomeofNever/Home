import { labelsFromDocument, richTextToString } from './labels';
import type { TilesDoc } from './schema';

export interface MobileProfileLink {
  description?: string;
  href: string;
  icon?: string;
  order: number;
  tier: 'primary' | 'secondary';
  title: string;
}

export function buildMobileLinks(doc: TilesDoc): MobileProfileLink[] {
  const orders = new Set<number>();

  return labelsFromDocument(doc)
    .filter((label) => label.mobile !== undefined)
    .map((label) => {
      const mobile = label.mobile!;

      if (!label.href) {
        throw new Error(`Mobile link at order ${mobile.order} requires an href`);
      }
      if (label.deprecated) {
        throw new Error(`Mobile link at order ${mobile.order} cannot target a deprecated label`);
      }
      if (orders.has(mobile.order)) {
        throw new Error(`Duplicate mobile link order: ${mobile.order}`);
      }
      orders.add(mobile.order);

      const title = mobile.label || richTextToString(label.title) || richTextToString(label.content);
      if (!title) {
        throw new Error(`Mobile link at order ${mobile.order} requires a label or title`);
      }

      return {
        description: mobile.description,
        href: label.href,
        icon: label.icon ?? label.icons?.[0],
        order: mobile.order,
        tier: mobile.tier,
        title
      };
    })
    .sort((a, b) => a.order - b.order);
}
