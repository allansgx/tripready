/**
 * Gera os PNGs da marca a partir do avião de `plane-art.ts`, para o splash
 * nativo e o primeiro quadro da animação saírem do mesmo traço. Roda sob
 * demanda (`npm run brand`); os PNGs são versionados.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLANE_PARTS,
  PLANE_VIEWBOX,
  SPLASH_COLORS,
} from '../src/features/splash/domain/plane-art.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** Subdivisões por curva de Bézier. Acima disso o traço não muda mais. */
const CURVE_STEPS = 24;
/** Linhas de amostragem por linha de pixel — a suavização vertical. */
const SUBSAMPLES = 5;

// --- Caminhos SVG -----------------------------------------------------------

/**
 * Lê o subconjunto de comandos usado em `plane-art.ts`: M, L, C, Q e Z, sempre
 * absolutos. Não é um parser de SVG — é o que basta para aquele arquivo, e
 * qualquer comando fora da lista estoura na hora em vez de sair torto no PNG.
 */
function flattenPath(d) {
  const tokens = d.match(/[MLCQZ]|-?\d*\.?\d+/gi) ?? [];
  const polylines = [];
  let current = null;
  let cursor = [0, 0];
  let start = [0, 0];
  let i = 0;

  const number = () => {
    const value = Number(tokens[i++]);
    if (Number.isNaN(value)) throw new Error(`Número inválido em "${d}"`);
    return value;
  };

  while (i < tokens.length) {
    const command = tokens[i++];

    switch (command) {
      case 'M': {
        cursor = [number(), number()];
        start = cursor;
        current = [cursor];
        polylines.push(current);
        break;
      }
      case 'L': {
        cursor = [number(), number()];
        current.push(cursor);
        break;
      }
      case 'C': {
        const c1 = [number(), number()];
        const c2 = [number(), number()];
        const end = [number(), number()];
        for (let s = 1; s <= CURVE_STEPS; s += 1) {
          current.push(cubicAt(cursor, c1, c2, end, s / CURVE_STEPS));
        }
        cursor = end;
        break;
      }
      case 'Q': {
        const c = [number(), number()];
        const end = [number(), number()];
        for (let s = 1; s <= CURVE_STEPS; s += 1) {
          current.push(quadraticAt(cursor, c, end, s / CURVE_STEPS));
        }
        cursor = end;
        break;
      }
      case 'Z': {
        current.push(start);
        cursor = start;
        break;
      }
      default:
        throw new Error(`Comando "${command}" não suportado em "${d}"`);
    }
  }

  return polylines;
}

function cubicAt(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const e = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + e * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + e * p3[1],
  ];
}

function quadraticAt(p0, p1, p2, t) {
  const u = 1 - t;
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ];
}

// --- Rasterização -----------------------------------------------------------

/**
 * Cobertura de cada pixel por uma forma, entre 0 e 1: exata na horizontal e por
 * `SUBSAMPLES` linhas na vertical, o suficiente para a borda não serrilhar.
 */
function rasterize(polylines, size) {
  const coverage = new Float32Array(size * size);
  const edges = [];

  for (const points of polylines) {
    for (let p = 0; p < points.length - 1; p += 1) {
      const [x0, y0] = points[p];
      const [x1, y1] = points[p + 1];
      if (y0 !== y1) edges.push([x0, y0, x1, y1]);
    }
  }

  const crossings = [];

  for (let sy = 0; sy < size * SUBSAMPLES; sy += 1) {
    const y = (sy + 0.5) / SUBSAMPLES;
    crossings.length = 0;

    for (const [x0, y0, x1, y1] of edges) {
      const top = Math.min(y0, y1);
      const bottom = Math.max(y0, y1);
      if (y < top || y >= bottom) continue;
      const t = (y - y0) / (y1 - y0);
      crossings.push([x0 + t * (x1 - x0), y1 > y0 ? 1 : -1]);
    }

    if (crossings.length === 0) continue;
    crossings.sort((a, b) => a[0] - b[0]);

    const row = Math.floor(sy / SUBSAMPLES) * size;
    let winding = 0;
    let spanStart = 0;

    for (const [x, direction] of crossings) {
      const was = winding;
      winding += direction;
      if (was === 0 && winding !== 0) {
        spanStart = x;
      } else if (was !== 0 && winding === 0) {
        addSpan(coverage, row, size, spanStart, x);
      }
    }
  }

  return coverage;
}

function addSpan(coverage, row, size, from, to) {
  const left = Math.max(0, from);
  const right = Math.min(size, to);
  if (right <= left) return;

  for (let px = Math.floor(left); px < Math.ceil(right); px += 1) {
    const amount = Math.min(right, px + 1) - Math.max(left, px);
    if (amount > 0) coverage[row + px] += amount / SUBSAMPLES;
  }
}

// --- Composição -------------------------------------------------------------

function parseColor(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

/** Tela em RGBA pré-multiplicada, que é o que faz o "over" sair certo. */
function createCanvas(size, background) {
  const canvas = new Float32Array(size * size * 4);
  if (background) {
    const [r, g, b] = parseColor(background);
    for (let p = 0; p < size * size; p += 1) {
      canvas[p * 4] = r;
      canvas[p * 4 + 1] = g;
      canvas[p * 4 + 2] = b;
      canvas[p * 4 + 3] = 255;
    }
  }
  return canvas;
}

function paint(canvas, coverage, color) {
  const [r, g, b] = parseColor(color);
  for (let p = 0; p < coverage.length; p += 1) {
    const alpha = Math.min(1, coverage[p]);
    if (alpha <= 0) continue;
    const keep = 1 - alpha;
    const i = p * 4;
    canvas[i] = r * alpha + canvas[i] * keep;
    canvas[i + 1] = g * alpha + canvas[i + 1] * keep;
    canvas[i + 2] = b * alpha + canvas[i + 2] * keep;
    canvas[i + 3] = 255 * alpha + canvas[i + 3] * keep;
  }
}

// --- PNG --------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

function encodePng(canvas, size) {
  // Uma linha de filtro 0 por linha de pixels — o PNG mais simples que existe.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let offset = 0;

  for (let y = 0; y < size; y += 1) {
    raw[offset++] = 0;
    for (let x = 0; x < size; x += 1) {
      const i = (y * size + x) * 4;
      const alpha = canvas[i + 3];
      // O canvas é pré-multiplicado; o PNG não é.
      const scale = alpha > 0 ? 255 / alpha : 0;
      raw[offset++] = Math.round(Math.min(255, canvas[i] * scale));
      raw[offset++] = Math.round(Math.min(255, canvas[i + 1] * scale));
      raw[offset++] = Math.round(Math.min(255, canvas[i + 2] * scale));
      raw[offset++] = Math.round(alpha);
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bits por canal
  header[9] = 6; // RGBA
  header[12] = 0; // sem entrelaçamento

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- Assets -----------------------------------------------------------------

const PALETTES = {
  onSky: SPLASH_COLORS.plane.onSky,
  onBrand: SPLASH_COLORS.plane.onBrand,
  mono: { body: '#000000', accent: '#000000' },
};

/**
 * `planeScale` é a fração da largura do PNG ocupada pelo `viewBox` do avião. No
 * splash nativo vale 1, que é o que mantém a costura com o SVG invisível.
 */
const ASSETS = [
  { file: 'splash-icon.png', size: 512, background: null, palette: 'onSky', planeScale: 1 },
  {
    file: 'icon.png',
    size: 1024,
    background: SPLASH_COLORS.brand,
    palette: 'onBrand',
    planeScale: 0.6,
  },
  {
    file: 'android-icon-foreground.png',
    size: 1024,
    background: null,
    palette: 'onBrand',
    // O recorte adaptativo do Android come as bordas: o avião fica na área segura.
    planeScale: 0.46,
  },
  {
    file: 'android-icon-background.png',
    size: 1024,
    background: SPLASH_COLORS.brand,
    palette: null,
  },
  {
    file: 'android-icon-monochrome.png',
    size: 1024,
    background: null,
    palette: 'mono',
    planeScale: 0.46,
  },
  {
    file: 'favicon.png',
    size: 96,
    background: SPLASH_COLORS.brand,
    palette: 'onBrand',
    planeScale: 0.6,
  },
];

function buildAsset({ file, size, background, palette, planeScale }) {
  const canvas = createCanvas(size, background);

  if (palette) {
    const scale = (size * planeScale) / PLANE_VIEWBOX;
    const offset = (size - size * planeScale) / 2;
    const colors = PALETTES[palette];

    for (const part of PLANE_PARTS) {
      const polylines = flattenPath(part.d).map((points) =>
        points.map(([x, y]) => [x * scale + offset, y * scale + offset]),
      );
      paint(canvas, rasterize(polylines, size), colors[part.role]);
    }
  }

  writeFileSync(join(root, 'assets/images', file), encodePng(canvas, size));
  return file;
}

for (const asset of ASSETS) {
  console.log(`✓ ${buildAsset(asset)}`);
}
