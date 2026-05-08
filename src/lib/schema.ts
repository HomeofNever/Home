import { z } from 'zod';

const InlineLeafObj = z.object({
  text: z.string().optional(),
  icon: z.string().optional(),
  href: z.string().url().optional(),
  tooltip: z.string().optional(),
  strike: z.boolean().optional()
});
const InlineGroup = z.object({
  items: z.array(z.union([z.string(), InlineLeafObj])),
  strike: z.boolean().optional()
});
const InlinePart = z.union([z.string(), InlineGroup, InlineLeafObj]);
export type InlinePart = z.infer<typeof InlinePart>;

const RichString = z.union([z.string(), z.array(InlinePart)]);

const LabelBase = z.object({
  icon: z.string().optional(),
  icons: z.array(z.string()).optional(),
  title: RichString.optional(),
  content: RichString.optional(),
  system: RichString.optional(),
  href: z.string().url().optional(),
  alt: z.string().optional(),
  tooltip: z.string().optional(),
  year: z.number().int().optional(),
  deprecated: z.boolean().optional()
});
export type LabelBase = z.infer<typeof LabelBase>;

const HistoryEntry = LabelBase.strict();

const Label = LabelBase.extend({
  history: z.array(HistoryEntry).optional()
});
export type Label = z.infer<typeof Label>;

const Tile = Label.extend({
  caption: z.string().optional(),
  items: z.array(Label).optional()
});
export type Tile = z.infer<typeof Tile>;

export const TilesDoc = z.object({
  sections: z.object({
    header: z.array(Tile),
    identities: z.array(Tile)
  })
});
export type TilesDoc = z.infer<typeof TilesDoc>;
