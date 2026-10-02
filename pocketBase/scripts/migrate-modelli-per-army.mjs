// I gruppi Modelli esistenti sono stati creati PRIMA di army_tag — quindi
// hanno army_tag vuoto. Questo script:
// 1. Assegna army_tag="anglosassoni" ai gruppi esistenti (stessi id — gli
//    Elementi ANG restano collegati senza bisogno di altro).
// 2. Duplica quegli stessi gruppi per "vichinghi" con id NUOVI.
// 3. Aggiorna i group_id degli Elementi VIK per puntare alle nuove copie.
//
// Uso: node migrate-modelli-per-army.mjs

const PB_URL = "http://127.0.0.1:8090";

function genId() {
  const raw = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return raw.padEnd(15, "0").slice(0, 15);
}

async function main() {
  // 1. Prendi tutti i gruppi esistenti (quelli senza army_tag, o comunque tutti)
  const listResp = await fetch(`${PB_URL}/api/collections/modelli/records?perPage=200`);
  if (!listResp.ok) throw new Error(`lista modelli fallita (${listResp.status})`);
  const listData = await listResp.json();
  const existing = listData.items.filter((r) => !r.army_tag);

  if (existing.length === 0) {
    console.log("Nessun gruppo senza army_tag trovato — forse è già stato fatto?");
    return;
  }

  console.log(`Trovati ${existing.length} gruppi senza army_tag.\n`);

  // 2. Assegna army_tag="anglosassoni" a tutti quelli esistenti (stessi id)
  for (const g of existing) {
    const resp = await fetch(`${PB_URL}/api/collections/modelli/records/${g.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ army_tag: "anglosassoni" }),
    });
    if (resp.ok) {
      console.log(`✓ ${g.name} (${g.id}) -> anglosassoni`);
    } else {
      console.warn(`⚠ ${g.name} (${g.id}): ${resp.status}`);
    }
  }

  // 3. Duplica per vichinghi con nuovi id
  const oldToNewVik = {};
  for (const g of existing) {
    const newId = genId();
    oldToNewVik[g.id] = newId;
    const resp = await fetch(`${PB_URL}/api/collections/modelli/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: newId,
        army_tag: "vichinghi",
        name: g.name,
        note: g.note,
        tipi: g.tipi,
        base: g.base,
        slots: g.slots,
      }),
    });
    if (resp.ok) {
      console.log(`✓ ${g.name} duplicato per vichinghi (${g.id} -> ${newId})`);
    } else {
      const data = await resp.json();
      console.warn(`⚠ ${g.name} duplicazione fallita: ${resp.status} — ${JSON.stringify(data)}`);
    }
  }

  // 4. Aggiorna i group_id degli Elementi VIK
  console.log("\nAggiorno i riferimenti group_id negli Elementi Vichinghi...");
  const elResp = await fetch(
    `${PB_URL}/api/collections/elementi/records?filter=${encodeURIComponent('army_tag="vichinghi"')}&perPage=200`
  );
  const elData = await elResp.json();
  for (const el of elData.items) {
    const newGroupId = oldToNewVik[el.group_id];
    if (!newGroupId) continue;
    const resp = await fetch(`${PB_URL}/api/collections/elementi/records/${el.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: newGroupId }),
    });
    if (resp.ok) {
      console.log(`✓ ${el.nickname}: group_id -> ${newGroupId}`);
    } else {
      console.warn(`⚠ ${el.nickname}: patch fallita (${resp.status})`);
    }
  }

  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
