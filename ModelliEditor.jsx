import React, { useState, useEffect } from "react";
import { ARMY_CATALOGS, ARMY_CODES } from "./ArmyBuilder.jsx";

/* ============================================================
   Coordinate.json Editor — WARFORGE
   Gestisce i gruppi di geometria (offset/scale/material/type) per
   footprint+numero-figure, condivisi da tutte le 14 armate IEF.
   Non contiene mai URL mesh/diffuse/collider — quelle vivono nel
   Template.json "slim" per esercito (prossimo editor).
   ============================================================ */

const UNIT_TYPES_LIST = ["KN", "CP", "CL", "FM", "FL", "FP", "ART", "EL"];

function genId() {
  // PocketBase richiede id di ESATTAMENTE 15 caratteri (non solo "almeno") —
  // timestamp + casuale, poi pad o taglio per garantire sempre 15 netti.
  const raw = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return raw.padEnd(15, "0").slice(0, 15);
}

// Indicizzato per id univoco (non più per nome) — il nome vive dentro ogni
// gruppo come campo "name", libero e ripetibile tra gruppi diversi.
const INITIAL_GROUPS = {
  seed_g4x3f3_df0: {
    name: "G_4x3_f3",
    note: "KN, CP — base 4x3cm, 3 figure a cavallo (slot+child). Ricavato da ENG_AC1/FRA_AC1.",
    tipi: ["KN", "CP"],
    base: { material: 3, type: 0, scaleZ: 1 },
    slots: [
      { offsetX: -1.0, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68,
        child: { offsetX: -1.0, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 } },
      { offsetX: 0, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68,
        child: { offsetX: 0, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 } },
      { offsetX: 1.0, offsetY: 0, offsetZ: 0.4, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68,
        child: { offsetX: 1.0, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 } },
    ],
  },
  seed_g4x3f2_df0: {
    name: "G_4x3_f2",
    note: "CL — base 4x3cm, 2 figure. DA FARE: nessun riferimento diretto nei dati Lionheart forniti, sospeso.",
    tipi: ["CL"],
    base: null,
    slots: [],
  },
  seed_g4x2f3_df0: {
    name: "G_4x2_f3",
    note: "FM — base 4x2cm, 3 figure appiedate. Ricavato da ENG_UI1/ENG_UI2. Attenzione: nei dati sorgente una delle due varianti aveva rotY:270 su tutti gli slot (mesh esportato con rotazione errata), l'altra no — qui lasciato senza rotY, verificare caso per caso in Template.json con rotY_fix.",
    tipi: ["FM"],
    base: { material: 3, type: 0, scaleZ: 0.65 },
    slots: [
      { offsetX: -0.942, offsetY: 0.671, offsetZ: -0.076, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
      { offsetX: 0.074, offsetY: 0.671, offsetZ: -0.113, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
      { offsetX: 1.112, offsetY: 0.671, offsetZ: -0.046, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
    ],
  },
  seed_g4x2f2_df0: {
    name: "G_4x2_f2",
    note: "FL — base 4x2cm, 2 figure. DA FARE: sospeso.",
    tipi: ["FL"],
    base: null,
    slots: [],
  },
  seed_g4x1_5f4_d: {
    name: "G_4x1.5_f4",
    note: "FP — base 4x1.5cm, 4 figure appiedate. Ricavato da ENG_AI1.",
    tipi: ["FP"],
    base: { material: 3, type: 0, scaleZ: 0.5 },
    slots: [
      { offsetX: -1.084, offsetY: 0.671, offsetZ: -0.089, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
      { offsetX: -0.278, offsetY: 0.671, offsetZ: -0.092, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
      { offsetX: 0.481, offsetY: 0.671, offsetZ: -0.090, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
      { offsetX: 1.226, offsetY: 0.671, offsetZ: -0.090, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 },
    ],
  },
  seed_g4x4f3_df0: {
    name: "G_4x4_f3",
    note: "ART, EL — base 4x4cm, 3 figure. DA FARE: nessun riferimento nei dati forniti, sospeso.",
    tipi: ["ART", "EL"],
    base: null,
    slots: [],
  },
  seed_ggenf1_df0: {
    name: "G_gen_f1",
    note: "GEN — caso speciale, 1 figura, nessuna base_depth_cm definita. DA FARE: sospeso.",
    tipi: ["GEN"],
    base: null,
    slots: [],
  },
};

function emptySlot() {
  return { offsetX: 0, offsetY: 0, offsetZ: 0, material: 3, type: 0, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68, child: null };
}

function NumberField({ label, value, onChange, step = 0.01 }) {
  return (
    <label className="flex flex-col text-[10px] font-mono text-[#EDE6D6]/60 gap-0.5">
      {label}
      <input
        type="number"
        step={step}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-1.5 py-1 text-xs w-20"
      />
    </label>
  );
}

function SlotEditor({ slot, onChange, onRemove, canRemove }) {
  const setField = (field, value) => onChange({ ...slot, [field]: value });

  const toggleChild = () => {
    if (slot.child) {
      const { child, ...rest } = slot;
      onChange({ ...rest, child: null });
    } else {
      onChange({ ...slot, child: { offsetX: slot.offsetX, offsetY: 1.3, offsetZ: -0.1, material: 3, type: 1, scaleX: 0.68, scaleY: 0.68, scaleZ: 0.68 } });
    }
  };

  return (
    <div className="border border-[#9C7A3C]/40 bg-[#26211d] p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#9C7A3C]">Slot</span>
        {canRemove && (
          <button onClick={onRemove} className="text-[10px] font-mono text-[#c26b6b] hover:text-[#e08a8a] underline">rimuovi</button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <NumberField label="offsetX" value={slot.offsetX} onChange={(v) => setField("offsetX", v)} />
        <NumberField label="offsetY" value={slot.offsetY} onChange={(v) => setField("offsetY", v)} />
        <NumberField label="offsetZ" value={slot.offsetZ} onChange={(v) => setField("offsetZ", v)} />
        <NumberField label="material" value={slot.material} onChange={(v) => setField("material", v)} step={1} />
        <NumberField label="type" value={slot.type} onChange={(v) => setField("type", v)} step={1} />
        <NumberField label="scaleX" value={slot.scaleX} onChange={(v) => setField("scaleX", v)} />
        <NumberField label="scaleY" value={slot.scaleY} onChange={(v) => setField("scaleY", v)} />
        <NumberField label="scaleZ" value={slot.scaleZ} onChange={(v) => setField("scaleZ", v)} />
      </div>

      <label className="flex items-center gap-2 text-[10px] font-mono text-[#EDE6D6]/60">
        <input type="checkbox" checked={!!slot.child} onChange={toggleChild} />
        ha figura annidata (es. cavaliere sopra il cavallo)
      </label>

      {slot.child && (
        <div className="border-t border-[#9C7A3C]/30 pt-2 mt-1 pl-3 border-l-2 border-l-[#7A2E2E]/50">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A2E2E]">Figlio (annidato)</span>
          <div className="grid grid-cols-4 gap-2 mt-1">
            <NumberField label="offsetX" value={slot.child.offsetX} onChange={(v) => onChange({ ...slot, child: { ...slot.child, offsetX: v } })} />
            <NumberField label="offsetY" value={slot.child.offsetY} onChange={(v) => onChange({ ...slot, child: { ...slot.child, offsetY: v } })} />
            <NumberField label="offsetZ" value={slot.child.offsetZ} onChange={(v) => onChange({ ...slot, child: { ...slot.child, offsetZ: v } })} />
            <NumberField label="material" value={slot.child.material} onChange={(v) => onChange({ ...slot, child: { ...slot.child, material: v } })} step={1} />
            <NumberField label="type" value={slot.child.type} onChange={(v) => onChange({ ...slot, child: { ...slot.child, type: v } })} step={1} />
            <NumberField label="scaleX" value={slot.child.scaleX} onChange={(v) => onChange({ ...slot, child: { ...slot.child, scaleX: v } })} />
            <NumberField label="scaleY" value={slot.child.scaleY} onChange={(v) => onChange({ ...slot, child: { ...slot.child, scaleY: v } })} />
            <NumberField label="scaleZ" value={slot.child.scaleZ} onChange={(v) => onChange({ ...slot, child: { ...slot.child, scaleZ: v } })} />
          </div>
        </div>
      )}
    </div>
  );
}

function GroupEditor({ groupId, group, onChange, onDelete }) {
  const [pasteText, setPasteText] = useState("");
  const [pasteStatus, setPasteStatus] = useState("");

  const setName = (name) => onChange({ ...group, name });
  const setNote = (note) => onChange({ ...group, note });
  const setTipi = (tipiStr) => onChange({ ...group, tipi: tipiStr.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean) });

  const setBaseEnabled = (enabled) => {
    onChange({ ...group, base: enabled ? { material: 3, type: 0, scaleZ: 1 } : null, slots: enabled ? group.slots : [] });
  };

  const updateSlot = (i, newSlot) => {
    const slots = [...group.slots];
    slots[i] = newSlot;
    onChange({ ...group, slots });
  };
  const addSlot = () => onChange({ ...group, slots: [...group.slots, emptySlot()] });
  const removeSlot = (i) => onChange({ ...group, slots: group.slots.filter((_, idx) => idx !== i) });

  // Incolla dal log console TTS: righe tipo [N] 'x' 'y' 'z' — sostituisce
  // in un colpo solo offsetX/Y/Z di ogni slot corrispondente (material,
  // type, scale restano manuali).
  const applyPastedOffsets = () => {
    const matches = [...pasteText.matchAll(/\[(\d+)\]\s*'(-?[\d.]+)'\s*'(-?[\d.]+)'\s*'(-?[\d.]+)'/g)];
    if (matches.length === 0) {
      setPasteStatus("⚠ Nessuna riga riconosciuta nel formato [N] 'x' 'y' 'z'.");
      return;
    }
    const slots = [...group.slots];
    let applied = 0;
    matches.forEach(([, nStr, x, y, z]) => {
      const idx = Number(nStr) - 1;
      if (idx >= 0 && idx < slots.length) {
        slots[idx] = { ...slots[idx], offsetX: Number(x), offsetY: Number(y), offsetZ: Number(z) };
        applied++;
      }
    });
    onChange({ ...group, slots });
    setPasteStatus(`✓ Applicati offset a ${applied} slot su ${matches.length} righe trovate.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <input
            value={group.name || ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="nome gruppo (può ripetersi)"
            className="w-full font-serif text-lg text-[#EDE6D6] bg-transparent border-b border-[#9C7A3C]/40 focus:outline-none focus:border-[#9C7A3C] px-1"
          />
          <div className="text-[10px] font-mono text-[#EDE6D6]/30 px-1">id: {groupId}</div>
        </div>
        <button onClick={onDelete} className="text-xs font-mono text-[#c26b6b] hover:text-[#e08a8a] underline shrink-0">elimina gruppo</button>
      </div>

      <label className="flex flex-col text-xs font-mono text-[#EDE6D6]/70 gap-1">
        Tipi (separati da virgola)
        <input
          value={group.tipi.join(", ")}
          onChange={(e) => setTipi(e.target.value)}
          className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-sm"
          placeholder="es. KN, CP"
        />
      </label>

      <label className="flex flex-col text-xs font-mono text-[#EDE6D6]/70 gap-1">
        Note
        <textarea
          value={group.note}
          onChange={(e) => setNote(e.target.value)}
          className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-sm resize-y"
          rows={2}
        />
      </label>

      <label className="flex items-center gap-2 text-xs font-mono text-[#EDE6D6]/70">
        <input type="checkbox" checked={!!group.base} onChange={(e) => setBaseEnabled(e.target.checked)} />
        Gruppo popolato (ha una base e degli slot definiti)
      </label>

      {group.base && (
        <>
          <div className="border border-[#9C7A3C]/40 bg-[#26211d] p-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9C7A3C]">Base</span>
            <div className="grid grid-cols-4 gap-2 mt-1">
              <NumberField label="material" value={group.base.material} onChange={(v) => onChange({ ...group, base: { ...group.base, material: v } })} step={1} />
              <NumberField label="type" value={group.base.type} onChange={(v) => onChange({ ...group, base: { ...group.base, type: v } })} step={1} />
              <NumberField label="scaleZ" value={group.base.scaleZ} onChange={(v) => onChange({ ...group, base: { ...group.base, scaleZ: v } })} />
            </div>
          </div>

          <div className="border border-[#9C7A3C]/40 bg-[#26211d] p-3 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#9C7A3C]">Incolla da console (offset)</span>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={"[OFFSET] Base: ...\n[1] '1.13' '0.04' '-0.01'\n[2] '0.30' '0.04' '-0.03'\n..."}
              className="w-full border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-xs font-mono resize-y"
              rows={4}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={applyPastedOffsets}
                className="bg-[#9C7A3C] text-[#1C1917] px-3 py-1 text-xs font-mono font-bold hover:bg-[#b28e49] transition-colors"
              >
                Applica agli slot
              </button>
              {pasteStatus && <span className="text-[10px] font-mono text-[#EDE6D6]/60">{pasteStatus}</span>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-[#9C7A3C]">Slot ({group.slots.length})</span>
              <button onClick={addSlot} className="text-xs font-mono text-[#9C7A3C] hover:text-[#b28e49] underline">+ aggiungi slot</button>
            </div>
            {group.slots.map((slot, i) => (
              <SlotEditor
                key={i}
                slot={slot}
                onChange={(s) => updateSlot(i, s)}
                onRemove={() => removeSlot(i)}
                canRemove={group.slots.length > 0}
              />
            ))}
            {group.slots.length === 0 && (
              <div className="text-xs font-mono text-[#EDE6D6]/40 italic py-2">Nessuno slot ancora — aggiungine uno.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { INITIAL_GROUPS, UNIT_TYPES_LIST };

export default function ModelliEditor({ groups: allGroupsProp, setGroups: setAllGroupsProp, githubConfig, currentTag: currentTagProp, setCurrentTag: setCurrentTagProp } = {}) {
  // Modelli è ora per esercito (non più condiviso): "groups" è una mappa
  // { [army_tag]: { [groupId]: group } }, esattamente come templates/rosters.
  const [internalAllGroups, setInternalAllGroups] = useState({});
  const allGroups = allGroupsProp ?? internalAllGroups;
  const setAllGroups = setAllGroupsProp ?? setInternalAllGroups;
  const [internalCurrentTag, setInternalCurrentTag] = useState("anglosassoni");
  const currentArmy = currentTagProp ?? internalCurrentTag;
  const setCurrentArmy = setCurrentTagProp ?? setInternalCurrentTag;

  const groups = allGroups[currentArmy] || {};
  const setGroups = (updater) => {
    setAllGroups((prevAll) => {
      const prevArmy = prevAll[currentArmy] || {};
      const nextArmy = typeof updater === "function" ? updater(prevArmy) : updater;
      return { ...prevAll, [currentArmy]: nextArmy };
    });
  };

  const [selectedId, setSelectedId] = useState("");
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [githubStatus, setGithubStatus] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const assignedTipi = new Set(Object.values(groups).flatMap((g) => g.tipi));
  const unassignedTipi = UNIT_TYPES_LIST.filter((t) => !assignedTipi.has(t));

  const updateGroup = (id, newGroup) => setGroups((g) => ({ ...g, [id]: newGroup }));

  const PB_URL = "http://127.0.0.1:8090";

  const deleteGroup = (id) => {
    setGroups((g) => {
      const { [id]: _, ...rest } = g;
      return rest;
    });
    const remaining = Object.keys(groups).filter((k) => k !== id);
    setSelectedId(remaining[0] || "");
    // Cancella subito anche su PocketBase — unico punto che cancella
    // davvero, nessuna cancellazione automatica/implicita altrove.
    fetch(`${PB_URL}/api/collections/modelli/records/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    const id = genId();
    setGroups((g) => ({ ...g, [id]: { name, note: "", tipi: [], base: null, slots: [] } }));
    setSelectedId(id);
    setNewGroupName("");
  };

  const exportObj = {
    versione: "1.1",
    gruppi: Object.fromEntries(
      Object.entries(groups).map(([id, g]) => [
        id,
        {
          name: g.name || id,
          _note: g.note,
          tipi: g.tipi,
          base: g.base,
          slots: g.slots.map((s) => {
            const { child, ...rest } = s;
            return child ? { ...rest, child } : rest;
          }),
        },
      ])
    ),
  };
  const jsonString = JSON.stringify(exportObj, null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponibile
    }
  };

  // --- PocketBase (locale, http://127.0.0.1:8090) — banco di lavoro veloce.
  // Modelli è ora per esercito (army_tag), come Elementi e Armylist. Non
  // scrive mai su Git direttamente — solo "Genera" pubblica, leggendo tutto
  // fresco da PocketBase al momento dell'esportazione finale.
  const saveToGithub = async () => {
    setGithubStatus("Salvataggio su PocketBase in corso...");
    try {
      // Solo crea/aggiorna — MAI cancella automaticamente. La cancellazione
      // è responsabilità esclusiva del bottone "elimina gruppo" per singolo
      // gruppo, che agisce subito su PocketBase (vedi deleteGroup).
      const listResp = await fetch(
        `${PB_URL}/api/collections/modelli/records?filter=${encodeURIComponent(`army_tag="${currentArmy}"`)}&perPage=200`
      );
      if (!listResp.ok) throw new Error(`lista PocketBase fallita (${listResp.status})`);
      const listData = await listResp.json();
      const existingIds = new Set(listData.items.map((r) => r.id));

      for (const [id, g] of Object.entries(groups)) {
        const payload = { army_tag: currentArmy, name: g.name || id, note: g.note || "", tipi: g.tipi || [], base: g.base, slots: g.slots || [] };
        if (existingIds.has(id)) {
          await fetch(`${PB_URL}/api/collections/modelli/records/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
        } else {
          await fetch(`${PB_URL}/api/collections/modelli/records`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, ...payload }),
          });
        }
      }
      setGithubStatus(`✓ Salvato su PocketBase (${Object.keys(groups).length} gruppi).`);
    } catch (err) {
      setGithubStatus(`⚠ PocketBase non raggiungibile: ${err.message} — è avviato (./pocketbase serve)?`);
    }
  };

  const loadFromGithub = async () => {
    setGithubStatus("Caricamento da PocketBase in corso...");
    try {
      const resp = await fetch(
        `${PB_URL}/api/collections/modelli/records?filter=${encodeURIComponent(`army_tag="${currentArmy}"`)}&perPage=200`
      );
      if (!resp.ok) throw new Error(`lista PocketBase fallita (${resp.status})`);
      const data = await resp.json();
      if (data.items.length === 0) {
        setGithubStatus("⚠ Nessun gruppo salvato su PocketBase per questo esercito — gruppi attuali lasciati invariati.");
        return;
      }
      const loadedGroups = {};
      data.items.forEach((r) => {
        loadedGroups[r.id] = { name: r.name || r.id, note: r.note || "", tipi: r.tipi || [], base: r.base, slots: r.slots || [] };
      });
      setGroups(loadedGroups);
      setSelectedId(Object.keys(loadedGroups)[0] || "");
      setGithubStatus(`✓ Caricati ${data.items.length} gruppi da PocketBase.`);
    } catch (err) {
      setGithubStatus(`⚠ PocketBase non raggiungibile: ${err.message} — è avviato (./pocketbase serve)?`);
    }
  };

  useEffect(() => {
    loadFromGithub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArmy]);

  const selectedGroup = groups[selectedId];

  return (
    <div className="min-h-screen bg-[#1C1917] p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        <div>
          <h1 className="font-serif text-2xl text-[#EDE6D6] tracking-wide">MODELLI</h1>
          <p className="text-xs font-mono text-[#EDE6D6]/50">
            Geometria per gruppo footprint+figure, per questo esercito. Nessuna URL mesh qui.
          </p>
        </div>

        <span className="inline-block bg-[#EDE6D6] border border-[#9C7A3C] px-3 py-1.5 text-sm font-mono font-bold text-[#2B2622]">
          {ARMY_CODES[currentArmy] || "?"} - {ARMY_CATALOGS[currentArmy]?.name || currentArmy}
        </span>

        {unassignedTipi.length > 0 && (
          <div className="bg-[#7A2E2E]/10 border border-[#7A2E2E]/50 px-4 py-2">
            <span className="text-xs font-mono text-[#c26b6b]">⚠ Tipi non assegnati a nessun gruppo: {unassignedTipi.join(", ")}</span>
          </div>
        )}

        <div className="flex gap-5">
          <div className="w-56 shrink-0 space-y-1">
            {Object.entries(groups).map(([id, g]) => (
              <button
                key={id}
                onClick={() => setSelectedId(id)}
                className={`w-full text-left px-3 py-2 text-xs font-mono border ${
                  selectedId === id
                    ? "bg-[#9C7A3C]/20 border-[#9C7A3C] text-[#EDE6D6]"
                    : "bg-[#26211d] border-[#9C7A3C]/30 text-[#EDE6D6]/60 hover:bg-[#9C7A3C]/10"
                }`}
              >
                <div className="font-bold">{g.name || id}</div>
                <div className="text-[10px] opacity-70">{g.tipi.join(", ") || "—"} {g.base ? "" : "(vuoto)"}</div>
              </button>
            ))}

            <div className="flex gap-1 pt-2">
              <input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="nuovo_gruppo"
                className="flex-1 border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-xs"
              />
              <button onClick={addGroup} className="bg-[#9C7A3C] text-[#1C1917] px-2 py-1 text-xs font-bold">+</button>
            </div>
          </div>

          <div className="flex-1 bg-[#26211d] border border-[#9C7A3C]/40 p-4">
            {selectedGroup ? (
              <GroupEditor
                groupId={selectedId}
                group={selectedGroup}
                onChange={(g) => updateGroup(selectedId, g)}
                onDelete={() => deleteGroup(selectedId)}
              />
            ) : (
              <div className="text-sm font-mono text-[#EDE6D6]/40">Nessun gruppo selezionato.</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJson((s) => !s)}
            className="bg-[#9C7A3C] text-[#1C1917] px-4 py-2 text-sm font-mono font-bold tracking-wide hover:bg-[#b28e49] transition-colors"
          >
            {showJson ? "Nascondi JSON" : "Esporta JSON"}
          </button>
          {showJson && (
            <button
              onClick={copyJson}
              className="border border-[#9C7A3C] text-[#EDE6D6] px-4 py-2 text-sm font-mono hover:bg-[#9C7A3C]/10 transition-colors"
            >
              {copied ? "Copiato ✓" : "Copia negli appunti"}
            </button>
          )}
          <button
            onClick={saveToGithub}
            className="bg-[#7A2E2E] text-[#EDE6D6] px-4 py-2 text-sm font-mono font-bold tracking-wide hover:bg-[#8f3737] transition-colors"
          >
            Salva
          </button>
          <button
            onClick={loadFromGithub}
            className="border border-[#9C7A3C] text-[#EDE6D6] px-4 py-2 text-sm font-mono hover:bg-[#9C7A3C]/10 transition-colors"
          >
            Carica
          </button>
          <span className="text-[10px] font-mono text-[#EDE6D6]/40 ml-auto">
            PocketBase: 127.0.0.1:8090
          </span>
        </div>

        {githubStatus && (
          <div className="text-xs font-mono text-[#EDE6D6]/70">{githubStatus}</div>
        )}

        {showJson && (
          <pre className="bg-[#0f0d0b] border border-[#9C7A3C]/40 text-[#9dd39d] text-xs p-4 overflow-auto max-h-96 font-mono">
            {jsonString}
          </pre>
        )}
      </div>
    </div>
  );
}
