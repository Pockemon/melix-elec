// Génère public/models/casse-noisette.glb : casse-noisette soldat low-poly (boîtes), remplaçable par le modèle final.
import { mkdirSync, writeFileSync } from 'node:fs';

// [centre x,y,z], [taille x,y,z], [r,g,b]
const WHITE = [0.93, 0.93, 0.9], RED = [0.72, 0.1, 0.12], GOLD = [0.85, 0.65, 0.2], DARK = [0.15, 0.15, 0.17];
const parts = [
  [[-0.17, 0.3, 0], [0.2, 0.6, 0.22], DARK], [[0.17, 0.3, 0], [0.2, 0.6, 0.22], DARK],
  [[0, 0.85, 0], [0.62, 0.5, 0.36], RED], [[0, 0.7, 0.19], [0.64, 0.08, 0.04], GOLD],
  [[-0.43, 0.85, 0], [0.18, 0.5, 0.2], RED], [[0.43, 0.85, 0], [0.18, 0.5, 0.2], RED],
  [[0, 1.25, 0], [0.4, 0.4, 0.36], WHITE], [[0, 1.12, 0.22], [0.3, 0.14, 0.12], WHITE],
  [[0, 1.65, 0], [0.44, 0.45, 0.4], DARK], [[0, 1.92, 0], [0.3, 0.12, 0.3], GOLD],
];
const pos = [], nor = [], idx = [], prims = [], mats = [];
for (const [[cx, cy, cz], [sx, sy, sz], col] of parts) {
  const first = idx.length, base = pos.length / 3;
  const faces = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  faces.forEach((n, f) => {
    const a = n.findIndex((v) => v), u = (a + 1) % 3, w = (a + 2) % 3, s = n[a];
    const c = f * 4 + base;
    for (const [du, dw] of [[-1,-1],[1,-1],[1,1],[-1,1]]) {
      const p = [0, 0, 0]; p[a] = s * 0.5; p[u] = du * 0.5; p[w] = dw * 0.5;
      pos.push(cx + p[0] * sx, cy + p[1] * sy, cz + p[2] * sz); nor.push(...n);
    }
    // orientation anti-horaire vue de l'extérieur
    const flip = ((u === (a + 1) % 3) ? 1 : -1) * s;
    idx.push(...(flip > 0 ? [c, c + 1, c + 2, c, c + 2, c + 3] : [c, c + 2, c + 1, c, c + 3, c + 2]));
  });
  mats.push({ pbrMetallicRoughness: { baseColorFactor: [...col, 1], metallicFactor: 0, roughnessFactor: 0.7 } });
  prims.push({ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: mats.length - 1, _first: first, _count: idx.length - first });
}
const posB = Buffer.from(new Float32Array(pos).buffer), norB = Buffer.from(new Float32Array(nor).buffer);
const idxB = Buffer.from(new Uint16Array(idx).buffer);
const pad = (b) => Buffer.concat([b, Buffer.alloc((4 - (b.length % 4)) % 4)]);
const bin = Buffer.concat([pad(posB), pad(norB), pad(idxB)]);
const min = [0, 1, 2].map((i) => Math.min(...pos.filter((_, k) => k % 3 === i)));
const max = [0, 1, 2].map((i) => Math.max(...pos.filter((_, k) => k % 3 === i)));
const accessors = [{ bufferView: 0, componentType: 5126, count: pos.length / 3, type: 'VEC3', min, max }, { bufferView: 1, componentType: 5126, count: nor.length / 3, type: 'VEC3' }];
const bufferViews = [{ buffer: 0, byteOffset: 0, byteLength: posB.length, target: 34962 }, { buffer: 0, byteOffset: pad(posB).length, byteLength: norB.length, target: 34962 }];
const idxOff = pad(posB).length + pad(norB).length;
const primitives = prims.map((p, i) => {
  bufferViews.push({ buffer: 0, byteOffset: idxOff + p._first * 2, byteLength: p._count * 2, target: 34963 });
  accessors.push({ bufferView: bufferViews.length - 1, componentType: 5123, count: p._count, type: 'SCALAR' });
  return { attributes: p.attributes, indices: accessors.length - 1, material: p.material };
});
const json = { asset: { version: '2.0', generator: 'melix-elec make-placeholder-glb' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0, name: 'casse-noisette' }],
  meshes: [{ primitives }], materials: mats, accessors, bufferViews, buffers: [{ byteLength: bin.length }] };
let jb = Buffer.from(JSON.stringify(json)); jb = Buffer.concat([jb, Buffer.alloc((4 - (jb.length % 4)) % 4, 0x20)]);
const total = 12 + 8 + jb.length + 8 + bin.length;
const h = Buffer.alloc(12); h.write('glTF', 0); h.writeUInt32LE(2, 4); h.writeUInt32LE(total, 8);
const c1 = Buffer.alloc(8); c1.writeUInt32LE(jb.length, 0); c1.write('JSON', 4);
const c2 = Buffer.alloc(8); c2.writeUInt32LE(bin.length, 0); c2.write('BIN\0', 4);
mkdirSync('public/models', { recursive: true });
writeFileSync('public/models/casse-noisette.glb', Buffer.concat([h, c1, jb, c2, bin]));
