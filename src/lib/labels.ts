import type { InlinePart, Label, Tile, TilesDoc } from './schema';

export function richTextToString(value: string | InlinePart[] | undefined): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return value;

  return value
    .map((part) => {
      if (typeof part === 'string') return part;
      if ('items' in part) return richTextToString(part.items);
      return part.text ?? '';
    })
    .join('')
    .trim();
}

function labelsFromTiles(tiles: Tile[]): Label[] {
  return tiles.flatMap((tile) => [tile, ...(tile.items ?? [])]);
}

export function labelsFromDocument(doc: TilesDoc): Label[] {
  return labelsFromTiles([...doc.sections.header, ...doc.sections.identities]);
}
