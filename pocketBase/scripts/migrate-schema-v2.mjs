// Migrazione schema v2:
// - modelli: aggiunge campo army_tag (ora partizionata per esercito, non più condivisa)
// - elementi.group_id: da text a relation verso modelli
// - armylist.model: da text a relation verso elementi
//
// Uso: node migrate-schema-v2.mjs
// NOTA: lancialo DOPO aver fatto un backup di pb_data (copia la cartella),
// una migrazione di schema su campi relation può comportarsi in modo
// diverso a seconda della versione di PocketBase — se qualcosa va storto,
// puoi sempre ripristinare la copia.

const PB_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "maxm4004@mymail.com";
const ADMIN_PASSWORD = "maxm4004";

async function authenticate() {
  const resp = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!resp.ok) throw new Error(`Autenticazione fallita (${resp.status}): ${await resp.text()}`);
  return (await resp.json()).token;
}

async function getCollection(token, name) {
  const resp = await fetch(`${PB_URL}/api/collections?filter=${encodeURIComponent(`name="${name}"`)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await resp.json();
  return data.items?.[0];
}

async function patchCollection(token, id, body) {
  const resp = await fetch(`${PB_URL}/api/collections/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(JSON.stringify(data));
  return data;
}

async function main() {
  const token = await authenticate();

  // --- modelli: aggiunge army_tag ---
  const modelli = await getCollection(token, "modelli");
  if (!modelli) throw new Error("Collection 'modelli' non trovata.");
  const modelliFields = [...modelli.fields, { name: "army_tag", type: "text" }];
  await patchCollection(token, modelli.id, { fields: modelliFields });
  console.log("✓ modelli: aggiunto campo army_tag");

  // --- elementi: group_id da text a relation verso modelli ---
  const elementi = await getCollection(token, "elementi");
  if (!elementi) throw new Error("Collection 'elementi' non trovata.");
  const elementiFields = elementi.fields.map((f) =>
    f.name === "group_id"
      ? { name: "group_id", type: "relation", collectionId: modelli.id, maxSelect: 1, cascadeDelete: false }
      : f
  );
  await patchCollection(token, elementi.id, { fields: elementiFields });
  console.log("✓ elementi: group_id ora è relation verso modelli");

  // --- armylist: model da text a relation verso elementi ---
  const armylist = await getCollection(token, "armylist");
  if (!armylist) throw new Error("Collection 'armylist' non trovata.");
  const armylistFields = armylist.fields.map((f) =>
    f.name === "model"
      ? { name: "model", type: "relation", collectionId: elementi.id, maxSelect: 1, cascadeDelete: false, required: false }
      : f
  );
  await patchCollection(token, armylist.id, { fields: armylistFields });
  console.log("✓ armylist: model ora è relation verso elementi");

  console.log("\nFatto. Controlla nel pannello admin che i 3 campi siano del tipo giusto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
