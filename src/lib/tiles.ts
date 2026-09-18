import tilesYaml from './tiles.yaml';
import { TilesDoc } from './schema';
import { buildShortlinks } from './shortlinks';

export const tiles = TilesDoc.parse(tilesYaml);
export const shortlinks = buildShortlinks(tiles);
