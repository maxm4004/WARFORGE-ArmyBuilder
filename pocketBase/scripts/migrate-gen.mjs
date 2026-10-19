// ============================================================
// migrate-gen.mjs
// Porta i comandanti al tipo "GEN" su PocketBase.
//
//   elementi : ruolo "generale"                     → tipo "GEN"
//   modelli  : gruppi usati da elementi generali    → aggiunge "GEN" a tipi
//              (i tipi già presenti restano)
//   armylist : righe il cui model punta a un
//              elemento generale                    → tipo "GEN"
//
// Solo PATCH di campi singoli. Nessuna creazione, nessuna cancellazione.
// Rilanciabile: i record già a posto vengono saltati.
//
// Uso:
//   node migrate-gen.mjs            (prova, non scrive)
//   node migrate-gen.mjs --apply    (scrive su PocketBase)
// ============================================================

const PB_URL = "http://127.0.0.1:8090";
const APPLY = process.argv.includes("--apply");

// ============================================================
// pbListAll(collection) — tutti i record, con paginazione
// ============================================================
async function pbListAll(collection) {
  const items = [];
  for (let page = 1; ; page++) {
    const resp = await fetch(`${PB_URL}/api/collections/${collection}/records?perPage=500&page=${page}`);
    if (!resp.ok) throw new Error(`${collection}: lista fallita (${resp.status})`);
    const data = await resp.json();
    items.push(...data.items);
    if (page >= data.totalPages) break;
  }
  return items;
}

// ============================================================
// pbPatch(collection, id, body)
// ============================================================
async function pbPatch(collection, id, body) {
  if (!APPLY) return;
  const resp = await fetch(`${PB_URL}/api/collections/${collection}/records/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${collection} ${id}: ${resp.status} — ${await resp.text()}`);
}

// ============================================================
// main
// ============================================================
async function main() {
  console.log(APPLY ? "SCRITTURA\n" : "PROVA (nessuna scrittura — aggiungi --apply)\n");

  const [elementi, modelli, armylist] = await Promise.all([
    pbListAll("elementi"),
    pbListAll("modelli"),
    pbListAll("armylist"),
  ]);
  if (elementi.length === 0) {
    console.log("⚠ Nessun elemento letto da PocketBase — niente da fare.");
    return;
  }

  const generali = elementi.filter((e) => e.ruolo === "generale");
  const idGenerali = new Set(generali.map((e) => e.id));
  console.log(`Elementi generali trovati: ${generali.length}`);

  // --- elementi ---
  console.log("\n— elementi");
  for (const e of generali) {
    if (e.tipo === "GEN") { console.log(`  = ${e.nickname} già GEN`); continue; }
    await pbPatch("elementi", e.id, { tipo: "GEN" });
    console.log(`  ✓ ${e.nickname} [${e.army_tag}] ${e.tipo || "?"} → GEN`);
  }

  // --- modelli ---
  console.log("\n— modelli");
  const idGruppi = new Set(generali.map((e) => e.group_id).filter(Boolean));
  for (const g of modelli.filter((m) => idGruppi.has(m.id))) {
    const tipi = Array.isArray(g.tipi) ? g.tipi : [];
    if (tipi.includes("GEN")) { console.log(`  = ${g.name} (${g.id}) ha già GEN`); continue; }
    const nuovi = [...tipi, "GEN"];
    await pbPatch("modelli", g.id, { tipi: nuovi });
    console.log(`  ✓ ${g.name} (${g.id}) [${g.army_tag}] tipi ${JSON.stringify(tipi)} → ${JSON.stringify(nuovi)}`);
  }
  const senzaGruppo = generali.filter((e) => !e.group_id).map((e) => e.nickname);
  if (senzaGruppo.length) console.log(`  ⚠ Generali senza gruppo: ${senzaGruppo.join(", ")}`);

  // --- armylist ---
  console.log("\n— armylist");
  for (const r of armylist.filter((a) => idGenerali.has(a.model))) {
    if (r.tipo === "GEN") { console.log(`  = ${r.nome_display} [${r.army_tag}] già GEN`); continue; }
    await pbPatch("armylist", r.id, { tipo: "GEN" });
    console.log(`  ✓ ${r.nome_display} [${r.army_tag}] ${r.tipo || "?"} → GEN`);
  }

  // Righe con morale vuoto che non puntano a un elemento generale:
  // probabili comandanti senza modello assegnato → solo segnalate.
  const sospetti = armylist.filter((a) => !a.morale && !idGenerali.has(a.model) && a.tipo !== "GEN");
  if (sospetti.length) {
    console.log("\n⚠ Righe armylist senza morale e senza modello generale (da controllare a mano):");
    sospetti.forEach((r) => console.log(`  - ${r.nome_display} [${r.army_tag}] tipo ${r.tipo}`));
  }

  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
