// Gera web/src/lib/brasil-mapa.ts: contorno dos estados (malha do IBGE, data/ibge-uf.geojson) em SVG
// e a posição de cada DDD no mesmo desenho. Rode: npm run mapa
// Malha: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo%2Bjson&qualidade=minima&intrarregiao=UF
import { readFileSync, writeFileSync } from 'node:fs';
import { geoArea, geoMercator, geoPath } from 'd3-geo';

const UF = { 11: 'RO', 12: 'AC', 13: 'AM', 14: 'RR', 15: 'PA', 16: 'AP', 17: 'TO', 21: 'MA', 22: 'PI', 23: 'CE', 24: 'RN', 25: 'PB', 26: 'PE', 27: 'AL', 28: 'SE', 29: 'BA', 31: 'MG', 32: 'ES', 33: 'RJ', 35: 'SP', 41: 'PR', 42: 'SC', 43: 'RS', 50: 'MS', 51: 'MT', 52: 'GO', 53: 'DF' };

// DDD → cidade de referência da região [cidade, UF, latitude, longitude]
const DDD = {
  11: ['São Paulo', 'SP', -23.55, -46.63], 12: ['São José dos Campos', 'SP', -23.18, -45.88], 13: ['Santos', 'SP', -23.96, -46.33],
  14: ['Bauru', 'SP', -22.31, -49.06], 15: ['Sorocaba', 'SP', -23.5, -47.45], 16: ['Ribeirão Preto', 'SP', -21.18, -47.81],
  17: ['São José do Rio Preto', 'SP', -20.81, -49.38], 18: ['Presidente Prudente', 'SP', -22.12, -51.39], 19: ['Campinas', 'SP', -22.91, -47.06],
  21: ['Rio de Janeiro', 'RJ', -22.91, -43.17], 22: ['Campos dos Goytacazes', 'RJ', -21.75, -41.32], 24: ['Volta Redonda', 'RJ', -22.52, -44.1],
  27: ['Vitória', 'ES', -20.32, -40.34], 28: ['Cachoeiro de Itapemirim', 'ES', -20.85, -41.11],
  31: ['Belo Horizonte', 'MG', -19.92, -43.94], 32: ['Juiz de Fora', 'MG', -21.76, -43.35], 33: ['Governador Valadares', 'MG', -18.85, -41.95],
  34: ['Uberlândia', 'MG', -18.92, -48.28], 35: ['Poços de Caldas', 'MG', -21.79, -46.56], 37: ['Divinópolis', 'MG', -20.14, -44.89], 38: ['Montes Claros', 'MG', -16.73, -43.86],
  41: ['Curitiba', 'PR', -25.43, -49.27], 42: ['Ponta Grossa', 'PR', -25.09, -50.16], 43: ['Londrina', 'PR', -23.31, -51.16],
  44: ['Maringá', 'PR', -23.42, -51.94], 45: ['Cascavel', 'PR', -24.96, -53.46], 46: ['Francisco Beltrão / Pato Branco', 'PR', -26.08, -53.05],
  47: ['Joinville', 'SC', -26.3, -48.85], 48: ['Florianópolis', 'SC', -27.6, -48.55], 49: ['Chapecó', 'SC', -27.1, -52.62],
  51: ['Porto Alegre', 'RS', -30.03, -51.23], 53: ['Pelotas', 'RS', -31.77, -52.34], 54: ['Caxias do Sul', 'RS', -29.17, -51.18], 55: ['Santa Maria', 'RS', -29.69, -53.81],
  61: ['Brasília', 'DF', -15.79, -47.88], 62: ['Goiânia', 'GO', -16.69, -49.26], 63: ['Palmas', 'TO', -10.18, -48.33], 64: ['Rio Verde', 'GO', -17.8, -50.93],
  65: ['Cuiabá', 'MT', -15.6, -56.1], 66: ['Rondonópolis', 'MT', -16.47, -54.64], 67: ['Campo Grande', 'MS', -20.47, -54.62],
  68: ['Rio Branco', 'AC', -9.97, -67.81], 69: ['Porto Velho', 'RO', -8.76, -63.9],
  71: ['Salvador', 'BA', -12.97, -38.5], 73: ['Ilhéus / Itabuna', 'BA', -14.79, -39.05], 74: ['Juazeiro', 'BA', -9.42, -40.5],
  75: ['Feira de Santana', 'BA', -12.27, -38.97], 77: ['Vitória da Conquista', 'BA', -14.86, -40.84], 79: ['Aracaju', 'SE', -10.91, -37.07],
  81: ['Recife', 'PE', -8.05, -34.88], 82: ['Maceió', 'AL', -9.67, -35.74], 83: ['João Pessoa', 'PB', -7.12, -34.86], 84: ['Natal', 'RN', -5.79, -35.21],
  85: ['Fortaleza', 'CE', -3.73, -38.52], 86: ['Teresina', 'PI', -5.09, -42.8], 87: ['Petrolina', 'PE', -9.39, -40.5], 88: ['Juazeiro do Norte', 'CE', -7.21, -39.32],
  89: ['Picos', 'PI', -7.08, -41.47], 91: ['Belém', 'PA', -1.46, -48.49], 92: ['Manaus', 'AM', -3.12, -60.02], 93: ['Santarém', 'PA', -2.44, -54.71],
  94: ['Marabá', 'PA', -5.37, -49.12], 95: ['Boa Vista', 'RR', 2.82, -60.67], 96: ['Macapá', 'AP', 0.03, -51.07], 97: ['Tefé', 'AM', -3.35, -64.71],
  98: ['São Luís', 'MA', -2.53, -44.3], 99: ['Imperatriz', 'MA', -5.53, -47.48],
};

const W = 600, H = 600;
const geo = JSON.parse(readFileSync('data/ibge-uf.geojson', 'utf8'));
// A malha do IBGE vem com os anéis no sentido oposto ao do d3 (que então lê cada estado como "o mundo menos o estado").
for (const f of geo.features) {
  if (geoArea(f) > 2 * Math.PI) {
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    for (const poly of polys) for (const ring of poly) ring.reverse();
  }
}
const projection = geoMercator().fitExtent([[8, 8], [W - 8, H - 8]], geo);
const path = geoPath(projection).digits(1);

const states = geo.features.map((f) => ({ uf: UF[f.properties.codarea], d: path(f) }));
const ddds = Object.fromEntries(Object.entries(DDD).map(([ddd, [city, uf, lat, lon]]) => {
  const [x, y] = projection([lon, lat]).map((v) => Math.round(v * 10) / 10);
  return [ddd, { city, uf, x, y }];
}));

writeFileSync('web/src/lib/brasil-mapa.ts', `// Gerado por scripts/gerar-mapa.mjs a partir da malha do IBGE. Não edite à mão.
export const MAP_SIZE = { width: ${W}, height: ${H} } as const;

export const STATES: { uf: string; d: string }[] = ${JSON.stringify(states)};

/** DDD → cidade de referência e posição no mapa. */
export const DDDS: Record<string, { city: string; uf: string; x: number; y: number }> = ${JSON.stringify(ddds)};
`);
console.log(`web/src/lib/brasil-mapa.ts: ${states.length} estados, ${Object.keys(ddds).length} DDDs`);
