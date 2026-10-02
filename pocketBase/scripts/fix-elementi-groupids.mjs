// Aggiorna i group_id già salvati nella collection "elementi" di
// PocketBase, dai vecchi id di Modelli (13 caratteri) ai nuovi (15
// caratteri, con "00" in coda) — dopo il fix alla lunghezza minima
// richiesta da PocketBase.
//
// Uso: node fix-elementi-groupids.mjs

const PB_URL = "http://127.0.0.1:8090";

const oldToNew = {
  "hbrpoig8f1cbf": "hbrpoig8f1cbf00",
  "no6b9m80o2rak": "no6b9m80o2rak00",
  "1vrjnvgfygwwq": "1vrjnvgfygwwq00",
  "c38hyf9sxmeco": "c38hyf9sxmeco00",
  "sfogyr3xkxwnr": "sfogyr3xkxwnr00",
  "ek8pk3yr9oudo": "ek8pk3yr9oudo00",
  "cuzrenun5z3jq": "cuzrenun5z3jq00",
  "ip98q1zxoi65f": "ip98q1zxoi65f00",
};

async function main() {
  const resp = await fetch(`${PB_URL}/api/collections/elementi/records?perPage=200`);
  if (!resp.ok) throw new Error(`lista fallita (${resp.status})`);
  const data = await resp.json();

  let updated = 0;
  for (const rec of data.items) {
    const newId = oldToNew[rec.group_id];
    if (!newId) continue; // già aggiornato, o non riconosciuto: lascia stare
    const patchResp = await fetch(`${PB_URL}/api/collections/elementi/records/${rec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group_id: newId }),
    });
    if (patchResp.ok) {
      console.log(`✓ ${rec.nickname}: group_id ${rec.group_id} -> ${newId}`);
      updated++;
    } else {
      console.warn(`⚠ ${rec.nickname}: patch fallita (${patchResp.status})`);
    }
  }
  console.log(`\nFatto. ${updated} record aggiornati su ${data.items.length}.`);
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
