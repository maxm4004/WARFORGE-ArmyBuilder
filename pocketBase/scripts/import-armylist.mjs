// Importa in PocketBase le armylist di Anglosassoni e Vichinghi, recuperate
// dai file reali generated/armies/ang.json e vik.json su GitHub — dato che
// il caricamento destructivo da PocketBase (prima del fix) aveva svuotato
// la armylist in-app.
//
// Uso: node import-armylist.mjs

const PB_URL = "http://127.0.0.1:8090";

const records = [
  {
    "army_tag": "anglosassoni",
    "nome_display": "Generale CnC",
    "tipo": "FP",
    "morale": null,
    "armi": [],
    "modificatore": "",
    "model": "ANG_GEN_FP",
    "basi_per_rango": 1,
    "num_basi": 1,
    "order_index": 0
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Huscarls",
    "tipo": "FP",
    "morale": "VETERANI",
    "armi": [
      "ASCIA",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "ANG_HUSCARL_FP",
    "basi_per_rango": 8,
    "num_basi": 16,
    "order_index": 1
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Fyrd Scelto",
    "tipo": "FP",
    "morale": "GUERRIERI",
    "armi": [
      "LANCIA",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "ANG_FYRD_FP",
    "basi_per_rango": 8,
    "num_basi": 24,
    "order_index": 2
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Arcieri Sassoni",
    "tipo": "FM",
    "morale": "GUERRIERI",
    "armi": [
      "ARCO"
    ],
    "modificatore": "",
    "model": "ANG_BOWS_FM",
    "basi_per_rango": 6,
    "num_basi": 18,
    "order_index": 3
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Schermagliatori con Arco",
    "tipo": "FL",
    "morale": "GUERRIERI",
    "armi": [
      "ARCO"
    ],
    "modificatore": "",
    "model": "ANG_BOWS_FL",
    "basi_per_rango": 6,
    "num_basi": 6,
    "order_index": 4
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Huscarls a Cavallo",
    "tipo": "CP",
    "morale": "GUERRIERI",
    "armi": [
      "ARMI_CORTE",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "ANG_HUSCARL_CP",
    "basi_per_rango": 4,
    "num_basi": 12,
    "order_index": 5
  },
  {
    "army_tag": "anglosassoni",
    "nome_display": "Generali Subordinati",
    "tipo": "FP",
    "morale": null,
    "armi": [],
    "modificatore": "",
    "model": "ANG_GEN_FP",
    "basi_per_rango": 1,
    "num_basi": 1,
    "order_index": 6
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Generale CnC",
    "tipo": "FP",
    "morale": null,
    "armi": [],
    "modificatore": "",
    "model": "VIK_GEN_FP",
    "basi_per_rango": 1,
    "num_basi": 1,
    "order_index": 0
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Huscarls",
    "tipo": "FP",
    "morale": "VETERANI",
    "armi": [
      "ASCIA",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "VIK_HUSCARL_FP",
    "basi_per_rango": 8,
    "num_basi": 16,
    "order_index": 1
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Bondi o Leidang Lancieri",
    "tipo": "FP",
    "morale": "GUERRIERI",
    "armi": [
      "LANCIA",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "VIK_BONDI_LAN_FP",
    "basi_per_rango": 8,
    "num_basi": 16,
    "order_index": 2
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Bondi o Leidang Mista",
    "tipo": "FP",
    "morale": "GUERRIERI",
    "armi": [
      "LANCIA",
      "SCUDO",
      "ARCO"
    ],
    "modificatore": "",
    "model": "VIK_BONDI_MIX_FP",
    "basi_per_rango": 8,
    "num_basi": 16,
    "order_index": 3
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Huscarls a Cavallo",
    "tipo": "CP",
    "morale": "VETERANI",
    "armi": [
      "ARMI_CORTE",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "VIK_HUSCARL_CP",
    "basi_per_rango": 4,
    "num_basi": 8,
    "order_index": 4
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Schermagliatori con Giavellotto",
    "tipo": "FL",
    "morale": "GUERRIERI",
    "armi": [
      "GIAVELLOTTO",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "VIK_GIAV_FL",
    "basi_per_rango": 6,
    "num_basi": 6,
    "order_index": 5
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Berserker",
    "tipo": "FM",
    "morale": "ELITE",
    "armi": [
      "ARMI_CORTE",
      "SCUDO"
    ],
    "modificatore": "",
    "model": "VIK_BERSERK_FM",
    "basi_per_rango": 6,
    "num_basi": 6,
    "order_index": 6
  },
  {
    "army_tag": "vichinghi",
    "nome_display": "Generale Subordinato",
    "tipo": "FP",
    "morale": null,
    "armi": [],
    "modificatore": "",
    "model": "VIK_GEN_FP",
    "basi_per_rango": 1,
    "num_basi": 1,
    "order_index": 7
  }
];

async function main() {
  for (const rec of records) {
    const resp = await fetch(`${PB_URL}/api/collections/armylist/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rec),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.warn(`⚠ ${rec.army_tag} / ${rec.nome_display}: ${resp.status} — ${JSON.stringify(data)}`);
    } else {
      console.log(`✓ ${rec.army_tag} / ${rec.nome_display} importato.`);
    }
  }
  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
