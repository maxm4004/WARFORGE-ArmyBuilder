// ============================================================
// import-elementi-da-army.mjs
// Importa in PocketBase il blocco "elementi" (o "modelli", formato
// vecchio) di un {tag}-army.json generato.
//
// Ogni voce del JSON viene SEPARATA in due record:
//   - modelli  → geometria (material/type/scale/offset di base, slot, child)
//   - elementi → URL (mesh/diffuse/collider/bundle, kind, rotY_fix),
//                collegato al gruppo tramite group_id
//
// Gruppi: se nell'esercito esiste già un gruppo con geometria IDENTICA
// viene riusato, altrimenti se ne crea uno nuovo "<nickname> (import)".
// Elementi: upsert per army_tag + nickname. Nessuna cancellazione.
//
// Uso:
//   node import-elementi-da-army.mjs <army_key> <url|file>            (prova, non scrive)
//   node import-elementi-da-army.mjs <army_key> <url|file> --apply    (scrive su PocketBase)
//
// Esempio:
//   node import-elementi-da-army.mjs anglosassoni https://raw.githubusercontent.com/maxm4004/WARFORGE-IEF/refs/heads/main/generated/tts-armies/ang-army.json
// ============================================================

import { readFile } from "node:fs/promises";

const PB_URL = "http://127.0.0.1:8090";

const [armyKey, source] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const APPLY = process.argv.includes("--apply");

// ============================================================
// genId() — id PocketBase di ESATTAMENTE 15 caratteri
// ============================================================
function genId() {
  const raw = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return raw.padEnd(15, "0").slice(0, 15);
}

// ============================================================
// JSON con chiavi ordinate — per confrontare geometrie
// ============================================================
function canon(v) {
  if (Array.isArray(v)) return `[${v.map(canon).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canon(v[k])}`).join(",")}}`;
  }
  return JSON.stringify(v ?? null);
}

// ============================================================
// Estrae il nodo interno (customMesh / customAssetbundle)
// ============================================================
function innerNode(node) {
  if (node?.customMesh) return { kind: "model", n: node.customMesh };
  if (node?.customAssetbundle) return { kind: "bundle", n: node.customAssetbundle };
  return { kind: "model", n: {} };
}

// ============================================================
// Geometria (va in modelli) — inverso di buildMeshNode
// ============================================================
function extractGeometry(node) {
  const { n } = innerNode(node);
  const g = { material: n.material, type: n.type };
  for (const k of ["scaleX", "scaleY", "scaleZ", "offsetX", "offsetY", "offsetZ"]) {
    if (n[k] !== undefined) g[k] = n[k];
  }
  return g;
}

// ============================================================
// URL / mesh data (va in elementi) — inverso di buildMeshNode
// ============================================================
function extractMeshData(node) {
  const { kind, n } = innerNode(node);
  return {
    kind,
    meshURL: n.meshURL || "",
    diffuseURL: n.diffuseURL || "",
    colliderURL: n.colliderURL || "",
    assetBundleURL: n.assetBundleURL || "",
    assetBundleSecondaryURL: n.assetBundleSecondaryURL || "",
    rotY_fix: n.rotY !== undefined ? n.rotY : null,
  };
}

// ============================================================
// Separa una voce del JSON in { geometria gruppo, dati elemento }
// ============================================================
function splitEntry(entry) {
  const figli = entry.children || [];
  const groupSlots = figli.map((c) => ({
    ...extractGeometry(c),
    child: c.children?.[0] ? extractGeometry(c.children[0]) : null,
  }));
  return {
    groupBase: extractGeometry(entry),
    groupSlots,
    base: extractMeshData(entry),
    slots: figli.map(extractMeshData),
    children: figli.map((c) => (c.children?.[0] ? extractMeshData(c.children[0]) : null)),
  };
}

// Firma geometrica: slot senza "child" equivale a child null
function groupSignature(base, slots) {
  return canon({ base, slots: (slots || []).map((s) => ({ ...s, child: s.child ?? null })) });
}

// ============================================================
// PocketBase helpers
// ============================================================
async function pbList(collection) {
  const filter = encodeURIComponent(`army_tag="${armyKey}"`);
  const resp = await fetch(`${PB_URL}/api/collections/${collection}/records?filter=${filter}&perPage=500`);
  if (!resp.ok) throw new Error(`${collection}: lista fallita (${resp.status})`);
  return (await resp.json()).items;
}

async function pbWrite(collection, id, body, isNew) {
  const url = isNew
    ? `${PB_URL}/api/collections/${collection}/records`
    : `${PB_URL}/api/collections/${collection}/records/${id}`;
  const resp = await fetch(url, {
    method: isNew ? "POST" : "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(isNew ? { id, ...body } : body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`${collection} ${id}: ${resp.status} — ${JSON.stringify(data)}`);
  return data;
}

// ============================================================
// Carica il file esercito (URL o file locale)
// ============================================================
async function loadArmy(src) {
  if (/^https?:\/\//.test(src)) {
    const resp = await fetch(`${src}${src.includes("?") ? "&" : "?"}t=${Date.now()}`);
    if (!resp.ok) throw new Error(`download fallito (${resp.status})`);
    return resp.json();
  }
  return JSON.parse(await readFile(src, "utf8"));
}

// ============================================================
// main
// ============================================================
async function main() {
  if (!armyKey || !source) {
    console.log("Uso: node import-elementi-da-army.mjs <army_key> <url|file> [--apply]");
    process.exit(1);
  }

  const army = await loadArmy(source);
  const voci = army.elementi || army.modelli;
  if (!voci || typeof voci !== "object" || Object.keys(voci).length === 0) {
    throw new Error("nessun blocco 'elementi'/'modelli' nel file — niente da importare");
  }
  const unita = army.unita || [];
  const haNumeroUnita = unita.some((u) => u.numero_unita !== undefined);

  console.log(`${APPLY ? "SCRITTURA" : "PROVA (nessuna scrittura — aggiungi --apply)"}`);
  console.log(`Esercito: ${army.nome} (${army.tag}) → army_tag "${armyKey}"`);
  console.log(`Voci nel file: ${Object.keys(voci).length}\n`);

  const gruppi = await pbList("modelli");
  const elementi = await pbList("elementi");
  const gruppiPerFirma = new Map(gruppi.map((g) => [groupSignature(g.base, g.slots), g]));
  const elementiPerNick = new Map(elementi.map((e) => [e.nickname, e]));

  for (const [nickname, entry] of Object.entries(voci)) {
    const unit = unita.find((u) => u.model === nickname);
    if (!unit) console.warn(`⚠ ${nickname}: nessuna unità lo usa — tipo non ricavabile`);

    // Comandante: nel formato nuovo è l'unità senza numero_unita,
    // nel formato vecchio l'unità con morale vuoto/null.
    const isCommander = unit && (haNumeroUnita ? unit.numero_unita === undefined : !unit.morale);
    const tipo = unit?.tipo || "";
    const ruolo = isCommander ? "generale" : "normale";

    const s = splitEntry(entry);

    // --- gruppo: riusa se geometria identica, altrimenti crea ---
    const firma = groupSignature(s.groupBase, s.groupSlots);
    let gruppo = gruppiPerFirma.get(firma);
    let gruppoMsg;
    if (gruppo) {
      gruppoMsg = `gruppo riusato "${gruppo.name}" (${gruppo.id})`;
    } else {
      const id = genId();
      const body = {
        army_tag: armyKey,
        name: `${nickname} (import)`,
        note: `Importato da ${army.tag}-army.json`,
        tipi: tipo ? [tipo] : [],
        base: s.groupBase,
        slots: s.groupSlots,
      };
      gruppo = APPLY ? await pbWrite("modelli", id, body, true) : { id, ...body };
      gruppiPerFirma.set(firma, gruppo);
      gruppoMsg = `gruppo NUOVO "${body.name}" (${id}, ${s.groupSlots.length} slot)`;
    }

    // --- elemento: upsert per nickname ---
    const body = {
      army_tag: armyKey,
      nickname,
      tipo,
      ruolo,
      group_id: gruppo.id,
      base: s.base,
      slots: s.slots,
      children: s.children,
    };
    const esistente = elementiPerNick.get(nickname);
    const id = esistente ? esistente.id : genId();
    if (APPLY) await pbWrite("elementi", id, body, !esistente);

    console.log(`${esistente ? "↻ aggiornato" : "+ creato   "} ${nickname} [${tipo || "?"}/${ruolo}] (${id}) — ${gruppoMsg}`);
  }

  // Elementi già su PocketBase che il file non contiene (solo segnalati)
  const assenti = elementi.filter((e) => !(e.nickname in voci)).map((e) => e.nickname);
  if (assenti.length > 0) {
    console.log(`\nℹ Elementi già presenti per "${armyKey}" non contenuti nel file (lasciati intatti): ${assenti.join(", ")}`);
  }

  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
