// Importa i gruppi Modelli (già migrati a id) dentro PocketBase, usando gli
// STESSI id di generated/conf/modelli.json — fondamentale perché gli
// elementi già salvati referenziano questi id tramite groupId.
//
// Uso: node import-modelli.mjs

const PB_URL = "http://127.0.0.1:8090";

const gruppi = {
  "hbrpoig8f1cbf00": { name: "Fig1_4x3", note: "1 figura base 4x3 (Generale in capo e subordinati)", tipi: ["FP", "CP"], base: { material: 3, type: 0, scaleZ: 1 }, slots: [
    { offsetX: -0.042, offsetY: 0.077, offsetZ: -0.007, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0.018, offsetY: 0.045, offsetZ: 0.7, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "no6b9m80o2rak00": { name: "Fig2_4x3", note: "2 figure base 4x3", tipi: ["CL"], base: { material: 3, type: 0, scaleZ: 1 }, slots: [
    { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "1vrjnvgfygwwq00": { name: "Fig2_4x2", note: "2 figure base 4x2 ", tipi: ["FL"], base: { material: 3, type: 0, scaleZ: 0.66 }, slots: [
    { offsetX: 0.816, offsetY: 0.073, offsetZ: -0.035, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: -0.832, offsetY: 0.077, offsetZ: -0.035, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "c38hyf9sxmeco00": { name: "Fig3_4x2", note: "3 figure base 4x2", tipi: ["FM"], base: { material: 3, type: 0, scaleZ: 0.66 }, slots: [
    { offsetX: -0.942, offsetY: 0.671, offsetZ: -0.076, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0.074, offsetY: 0.671, offsetZ: -0.113, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 1.112, offsetY: 0.671, offsetZ: -0.046, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "sfogyr3xkxwnr00": { name: "Fig4_4x1.5", note: "4 figure base 4x1.5", tipi: ["FP"], base: { material: 3, type: 0, scaleZ: 0.5 }, slots: [
    { offsetX: -1.084, offsetY: 0.671, offsetZ: -0.089, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: -0.278, offsetY: 0.671, offsetZ: -0.092, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0.481, offsetY: 0.671, offsetZ: -0.09, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 1.226, offsetY: 0.671, offsetZ: -0.09, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "ek8pk3yr9oudo00": { name: "Fig3_4x4", note: "", tipi: ["EL", "ART"], base: { material: 3, type: 0, scaleZ: 1.33 }, slots: [
    { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
  "cuzrenun5z3jq00": { name: "Fig6_4x3", note: "3 cavalieri 3 cavalli base 4x3 ", tipi: ["KN", "CP"], base: { material: 3, type: 0, scaleZ: 1 }, slots: [
    { offsetX: -1, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7, child: { offsetX: -1, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 } },
    { offsetX: 0, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7, child: { offsetX: 0, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 } },
    { offsetX: 1, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7, child: { offsetX: 1, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 } },
  ]},
  "ip98q1zxoi65f00": { name: "Fig3_4x3", note: "3 fig base 4x3", tipi: ["CP"], base: { material: 3, type: 0, scaleZ: 1 }, slots: [
    { offsetX: -1.051, offsetY: 0.077, offsetZ: -0.173, material: 11, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: -0.066, offsetY: 0.077, offsetZ: -0.175, material: 11, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
    { offsetX: 0.974, offsetY: 0.077, offsetZ: -0.143, material: 11, type: 1, scaleX: 0.7, scaleY: 0.7, scaleZ: 0.7 },
  ]},
};

async function main() {
  for (const [id, g] of Object.entries(gruppi)) {
    const resp = await fetch(`${PB_URL}/api/collections/modelli/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: g.name, note: g.note, tipi: g.tipi, base: g.base, slots: g.slots }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      console.warn(`⚠ ${g.name} (${id}): ${resp.status} — ${JSON.stringify(data)}`);
    } else {
      console.log(`✓ ${g.name} (${id}) importato.`);
    }
  }
  console.log("\nFatto.");
}

main().catch((err) => {
  console.error("Errore:", err.message);
  process.exit(1);
});
