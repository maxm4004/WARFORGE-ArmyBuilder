// Rende le 3 collection accessibili via API senza autenticazione — va bene
// per uno strumento solo-locale-per-te. Lancialo UNA VOLTA dopo aver creato
// le collection con create-collections.mjs.
//
// Uso: node set-public-rules.mjs

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
  const data = await resp.json();
  return data.token;
}

const collections = ["modelli", "elementi", "armylist"];

async function makePublic(token, name) {
  // Trova l'id della collection dal nome
  const listResp = await fetch(`${PB_URL}/api/collections?filter=${encodeURIComponent(`name="${name}"`)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const listData = await listResp.json();
  const col = listData.items?.[0];
  if (!col) {
    console.warn(`⚠ Collection "${name}" non trovata.`);
    return;
  }

  const resp = await fetch(`${PB_URL}/api/collections/${col.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      listRule: "",
      viewRule: "",
      createRule: "",
      updateRule: "",
      deleteRule: "",
    }),
  });
  const data = await resp.json();
  if (!resp.ok) {
    console.warn(`⚠ ${name}: ${resp.status} — ${JSON.stringify(data)}`);
    return;
  }
  console.log(`✓ Collection "${name}" ora pubblica.`);
}

async function main() {
  const token = await authenticate();
  for (const name of collections) {
    await makePublic(token, name);
  }
  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
