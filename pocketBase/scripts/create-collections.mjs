// Script una-tantum: crea le 3 collection (modelli, elementi, armylist) in
// PocketBase con lo schema concordato. Eseguilo da terminale, in locale,
// con PocketBase già avviato (`./pocketbase serve`).
//
// Uso:
//   node create-collections.mjs
//
// Richiede Node 18+ (usa fetch nativo). Se hai una versione più vecchia,
// installa node-fetch e aggiungi `import fetch from "node-fetch";` in cima.

const PB_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "maxm4004@mymail.com";        // <-- correggi se in PocketBase hai usato una vera email
const ADMIN_PASSWORD = "maxm4004";

async function authenticate() {
  const resp = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Autenticazione fallita (${resp.status}): ${err}`);
  }
  const data = await resp.json();
  return data.token;
}

async function createCollection(token, definition) {
  const resp = await fetch(`${PB_URL}/api/collections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(definition),
  });
  const data = await resp.json();
  if (!resp.ok) {
    // Se esiste già, PocketBase risponde 400 con un messaggio sul nome duplicato — lo segnaliamo e andiamo avanti.
    console.warn(`⚠ ${definition.name}: ${resp.status} — ${JSON.stringify(data)}`);
    return null;
  }
  console.log(`✓ Collection "${definition.name}" creata (id: ${data.id})`);
  return data;
}

const textField = (name) => ({ name, type: "text" });
const numberField = (name) => ({ name, type: "number" });
const jsonField = (name) => ({ name, type: "json" });

const collections = [
  {
    name: "modelli",
    type: "base",
    fields: [
      textField("name"),
      textField("note"),
      jsonField("tipi"),
      jsonField("base"),
      jsonField("slots"),
    ],
  },
  {
    name: "elementi",
    type: "base",
    fields: [
      textField("nickname"),
      textField("army_tag"),
      textField("tipo"),
      textField("ruolo"),
      textField("group_id"),
      jsonField("base"),
      jsonField("slots"),
      jsonField("children"),
    ],
  },
  {
    name: "armylist",
    type: "base",
    fields: [
      textField("army_tag"),
      textField("nome_display"),
      textField("tipo"),
      textField("morale"),
      jsonField("armi"),
      textField("modificatore"),
      textField("model"),
      numberField("basi_per_rango"),
      numberField("num_basi"),
      textField("commander"),
      numberField("order_index"),
    ],
  },
];

async function main() {
  console.log("Autenticazione su", PB_URL, "...");
  const token = await authenticate();
  console.log("OK, procedo con la creazione delle collection.\n");

  for (const def of collections) {
    await createCollection(token, def);
  }

  console.log("\nFatto. Controlla il pannello admin per confermare.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
