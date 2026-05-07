import tilesYaml from './tiles.yaml';
import { TilesDoc } from './schema';

export const tiles = TilesDoc.parse(tilesYaml);
