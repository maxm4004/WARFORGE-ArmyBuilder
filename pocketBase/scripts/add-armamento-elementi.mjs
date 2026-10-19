// ============================================================
// add-armamento-elementi.mjs
// Aggiunge alla collection "elementi" il campo "armamento"
// (select: normale | misto, non obbligatorio).
// I record esistenti restano vuoti → l'app li tratta come "normale".
//
// Solo modifica di schema: nessun record viene toccato.
// Se il campo esiste già non fa nulla.
//
// Uso: node add-armamento-elementi.mjs
// Prima: copia di backup di pb_data.
// ============================================================

const PB_URL = "http://127.0.0.1:8090";
const ADMIN_EMAIL = "maxm4004@mymail.com";
const ADMIN_PASSWORD = "maxm4004";

// ============================================================
// authenticate() — token superuser
// ============================================================
async function authenticate() {
  const resp = await fetch(`${PB_URL}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!resp.ok) throw new Error(`Autenticazione fallita (${resp.status}): ${await resp.text()}`);
  return (await resp.json()).token;
}

// ============================================================
// main
// ============================================================
async function main() {
  const token = await authenticate();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const resp = await fetch(`${PB_URL}/api/collections/elementi`, { headers });
  if (!resp.ok) throw new Error(`Collection 'elementi' non trovata (${resp.status})`);
  const elementi = await resp.json();

  if (elementi.fields.some((f) => f.name === "armamento")) {
    console.log("= elementi ha già il campo armamento — niente da fare.");
    return;
  }

  const fields = [
    ...elementi.fields,
    { name: "armamento", type: "select", values: ["normale", "misto"], maxSelect: 1, required: false },
  ];
  const patch = await fetch(`${PB_URL}/api/collections/${elementi.id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields }),
  });
  if (!patch.ok) throw new Error(`Aggiornamento schema fallito: ${await patch.text()}`);

  console.log("✓ elementi: aggiunto campo armamento (normale | misto)");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
