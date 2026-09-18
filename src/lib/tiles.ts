import tilesYaml from './tiles.yaml';
import { TilesDoc } from './schema';
import { buildMobileLinks } from './mobile-links';
import { buildShortlinks } from './shortlinks';

export const tiles = TilesDoc.parse(tilesYaml);
export const mobileLinks = buildMobileLinks(tiles);
export const shortlinks = buildShortlinks(tiles);
