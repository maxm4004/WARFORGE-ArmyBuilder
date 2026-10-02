import React, { useState, useEffect } from "react";
import { UNIT_TYPES_LIST } from "./ModelliEditor.jsx";
import { ARMY_CATALOGS, ARMY_CODES, ARMY_KEYS } from "./ArmyBuilder.jsx";

/* ============================================================
   Template.json "slim" Editor — WARFORGE
   Per ogni esercito, per ogni nickname (unità), solo le URL
   mesh/diffuse/collider per la base e per ogni figura (slot +
   eventuale figlio annidato). Nessun offset/scale qui — quelli
   vivono in Coordinate.json e vengono iniettati al momento del
   merge finale (fuori dallo scope di questo editor).
   ============================================================ */

export { findGroupForTipo, genId };

function findGroupForTipo(groups, tipo) {
  const entry = Object.entries(groups || {}).find(([, g]) => g.tipi.includes(tipo));
  return entry ? { id: entry[0], group: entry[1] } : null;
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function emptyMesh() {
  return { kind: "model", meshURL: "", diffuseURL: "", colliderURL: "", assetBundleURL: "", assetBundleSecondaryURL: "", rotY_fix: null };
}

function MeshFields({ label, mesh, onChange }) {
  const setField = (field, value) => onChange({ ...mesh, [field]: value });
  const kind = mesh.kind || "model";

  return (
    <div className="border border-[#9C7A3C]/30 bg-[#1C1917] p-2 space-y-1.5">
      <span className="text-[9px] font-mono uppercase tracking-wider text-[#9C7A3C]">{label}</span>

      <div className="flex gap-3 text-[10px] font-mono text-[#EDE6D6]/70">
        <label className="flex items-center gap-1">
          <input type="radio" checked={kind === "model"} onChange={() => setField("kind", "model")} />
          Custom Model
        </label>
        <label className="flex items-center gap-1">
          <input type="radio" checked={kind === "bundle"} onChange={() => setField("kind", "bundle")} />
          Custom Asset Bundle
        </label>
      </div>

      {kind === "model" ? (
        <>
          <input
            value={mesh.meshURL}
            onChange={(e) => setField("meshURL", e.target.value)}
            placeholder="meshURL"
            className="w-full border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-[11px] font-mono"
          />
          <input
            value={mesh.diffuseURL}
            onChange={(e) => setField("diffuseURL", e.target.value)}
            placeholder="diffuseURL"
            className="w-full border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-[11px] font-mono"
          />
          <input
            value={mesh.colliderURL}
            onChange={(e) => setField("colliderURL", e.target.value)}
            placeholder="colliderURL"
            className="w-full border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-[11px] font-mono"
          />
        </>
      ) : (
        <>
          <input
            value={mesh.assetBundleURL}
            onChange={(e) => setField("assetBundleURL", e.target.value)}
            placeholder="assetBundleURL"
            className="w-full border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-[11px] font-mono"
          />
          <input
            value={mesh.assetBundleSecondaryURL}
            onChange={(e) => setField("assetBundleSecondaryURL", e.target.value)}
            placeholder="assetBundleSecondaryURL (opzionale)"
            className="w-full border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-[11px] font-mono"
          />
        </>
      )}

      <label className="flex items-center gap-1.5 text-[10px] font-mono text-[#EDE6D6]/50">
        <input
          type="checkbox"
          checked={mesh.rotY_fix != null}
          onChange={(e) => setField("rotY_fix", e.target.checked ? 0 : null)}
        />
        rotY_fix (mesh esportato con rotazione errata)
        {mesh.rotY_fix != null && (
          <input
            type="number"
            value={mesh.rotY_fix}
            onChange={(e) => setField("rotY_fix", Number(e.target.value))}
            className="w-16 border border-[#9C7A3C]/40 bg-[#EDE6D6] text-[#2B2622] px-1 py-0.5 text-[10px]"
          />
        )}
      </label>
    </div>
  );
}

function NicknameEditor({ entry, groups, onChange, onRemove, initiallyOpen }) {
  const [open, setOpen] = useState(!!initiallyOpen);
  const groupIds = Object.keys(groups || {}).filter((id) => (groups[id].tipi || []).includes(entry.tipo));
  const currentGroupId = entry.groupId || findGroupForTipo(groups, entry.tipo)?.id || "";
  const group = groups?.[currentGroupId];
  const slotCount = group?.slots?.length ?? 0;
  const groupReady = group && group.base && slotCount > 0;

  const setNickname = (nickname) => onChange({ ...entry, nickname });
  const setTipo = (tipo) => {
    const suggested = findGroupForTipo(groups, tipo)?.id || "";
    const newSlotCount = groups?.[suggested]?.slots?.length ?? 0;
    onChange({
      ...entry,
      tipo,
      groupId: suggested,
      base: emptyMesh(),
      slots: Array.from({ length: newSlotCount }, () => emptyMesh()),
      children: Array.from({ length: newSlotCount }, () => null),
    });
  };
  const setGroupId = (groupId) => {
    const newSlotCount = groups?.[groupId]?.slots?.length ?? 0;
    onChange({
      ...entry,
      groupId,
      base: entry.base || emptyMesh(),
      slots: Array.from({ length: newSlotCount }, (_, i) => entry.slots?.[i] || emptyMesh()),
      children: Array.from({ length: newSlotCount }, (_, i) => entry.children?.[i] || null),
    });
  };

  const setBase = (base) => onChange({ ...entry, base });
  const setRuolo = (ruolo) => onChange({ ...entry, ruolo });
  const setSlot = (i, mesh) => {
    const slots = [...entry.slots];
    slots[i] = mesh;
    onChange({ ...entry, slots });
  };
  const setChild = (i, mesh) => {
    const children = [...(entry.children || [])];
    children[i] = mesh;
    onChange({ ...entry, children });
  };
  const toggleChild = (i, has) => setChild(i, has ? emptyMesh() : null);

  return (
    <div className="border border-[#9C7A3C]/40 bg-[#26211d] p-3 space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-[#9C7A3C] font-mono text-xs w-4 shrink-0"
          title={open ? "Comprimi" : "Espandi"}
        >
          {open ? "▾" : "▸"}
        </button>
        <input
          value={entry.nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="nickname (es. CP_1_1)"
          className="font-mono text-sm font-bold border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 w-40"
        />
        <select
          value={entry.tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-sm font-mono"
        >
          <option value="" disabled>— tipo unità —</option>
          {UNIT_TYPES_LIST.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select
          value={entry.ruolo || "normale"}
          onChange={(e) => setRuolo(e.target.value)}
          className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-sm font-mono"
        >
          <option value="normale">Normale</option>
          <option value="generale">Generale</option>
        </select>
        <select
          value={currentGroupId}
          onChange={(e) => setGroupId(e.target.value)}
          disabled={!entry.tipo}
          className="border border-[#9C7A3C]/60 bg-[#EDE6D6] text-[#2B2622] px-2 py-1 text-sm font-mono disabled:opacity-40"
        >
          <option value="" disabled>— modello —</option>
          {groupIds.map((id) => (
            <option key={id} value={id}>{groups[id].name || id} ({(groups[id].tipi || []).join(", ") || "custom"})</option>
          ))}
        </select>
        {entry.tipo && groupIds.length === 0 && (
          <span className="text-[10px] italic text-[#c26b6b]">nessun modello in "Modelli" è aperto al tipo {entry.tipo}</span>
        )}
        <button onClick={onRemove} className="ml-auto text-[10px] font-mono text-[#c26b6b] hover:text-[#e08a8a] underline">rimuovi</button>
      </div>

      {open && (
        <>
          {entry.tipo && !groupReady && (
            <div className="text-[11px] font-mono text-[#c26b6b] bg-[#7A2E2E]/10 border border-[#7A2E2E]/40 px-2 py-1">
              ⚠ Il gruppo {currentGroupId || "?"} non è ancora popolato in Modelli (nessuno slot definito) — completalo prima di inserire le URL qui.
            </div>
          )}

          {entry.tipo && groupReady && (
            <>
              <MeshFields label="Base" mesh={entry.base} onChange={setBase} />
              <div className="grid grid-cols-2 gap-2">
                {entry.slots.map((slotMesh, i) => (
                  <div key={i} className="space-y-1.5">
                    <MeshFields label={`Figura ${i + 1}`} mesh={slotMesh} onChange={(m) => setSlot(i, m)} />
                    {group.slots[i]?.child && (
                      <>
                        <label className="flex items-center gap-1.5 text-[10px] font-mono text-[#EDE6D6]/60 pl-2">
                          <input
                            type="checkbox"
                            checked={!!entry.children?.[i]}
                            onChange={(e) => toggleChild(i, e.target.checked)}
                          />
                          ha figura annidata (cavaliere)
                        </label>
                        {entry.children?.[i] && (
                          <MeshFields label={`Figura ${i + 1} — annidata`} mesh={entry.children[i]} onChange={(m) => setChild(i, m)} />
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function ElementiEditor({ githubConfig, templates: templatesProp, setTemplates: setTemplatesProp, currentTag: currentTagProp, setCurrentTag: setCurrentTagProp }) {
  const armyKeys = ARMY_KEYS;
  const [internalCurrentArmy, setInternalCurrentArmy] = useState(armyKeys[0]);
  const currentArmy = currentTagProp ?? internalCurrentArmy;
  const setCurrentArmy = setCurrentTagProp ?? setInternalCurrentArmy;
  const [internalTemplates, setInternalTemplates] = useState(() => Object.fromEntries(armyKeys.map((k) => [k, []])));
  const templates = templatesProp ?? internalTemplates;
  const setTemplates = setTemplatesProp ?? setInternalTemplates;
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [githubStatus, setGithubStatus] = useState("");

  const PB_URL = "http://127.0.0.1:8090";

  // Gruppi Modelli dell'esercito corrente — letti direttamente da
  // PocketBase (Modelli è per esercito, non più una prop condivisa).
  const [groups, setGroups] = useState({});
  useEffect(() => {
    fetch(`${PB_URL}/api/collections/modelli/records?filter=${encodeURIComponent(`army_tag="${currentArmy}"`)}&perPage=200`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        const loaded = {};
        (data.items || []).forEach((r) => {
          loaded[r.id] = { name: r.name || r.id, tipi: r.tipi || [], base: r.base, slots: r.slots || [] };
        });
        setGroups(loaded);
      })
      .catch(() => setGroups({}));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArmy]);

  const entries = templates[currentArmy] || [];
  const setEntries = (next) => setTemplates((t) => ({ ...t, [currentArmy]: next }));

  const [justCreatedId, setJustCreatedId] = useState(null);

  const addNickname = () => {
    const code = ARMY_CODES[currentArmy];
    const n = entries.length + 1;
    const newId = genId();
    setEntries([{
      id: newId,
      nickname: `${code}_${n}`,
      tipo: "",
      ruolo: "normale",
      groupId: "",
      base: null,
      slots: [],
      children: [],
    }, ...entries]);
    setJustCreatedId(newId);
  };
  const updateEntry = (i, entry) => {
    const next = [...entries];
    next[i] = entry;
    setEntries(next);
  };
  const removeEntry = (i) => setEntries(entries.filter((_, idx) => idx !== i));

  const exportObj = {
    versione: "1.0-slim",
    name: currentArmy,
    Tag: ARMY_CODES[currentArmy],
    modelli: entries.map((e) => ({
      nickname: e.nickname,
      id: e.id,
      tipo: e.tipo,
      ruolo: e.ruolo || "normale",
      groupId: e.groupId || "",
      base: e.base,
      slots: e.slots,
      children: e.children,
    })),
  };
  const jsonString = JSON.stringify(exportObj, null, 2);

  const resolvedPath = () => {
    const code = (ARMY_CODES[currentArmy] || "").toLowerCase();
    const template = githubConfig?.elementiPathTemplate || "generated/conf/elementi/{code}_elementi.json";
    return template.replace("{tag}", currentArmy).replace("{code}", code).trim().replace(/^\/+/, "");
  };

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
  // Ogni elemento è un record a sé nella collection "elementi", con
  // army_tag a identificare a quale esercito appartiene.
  const saveToGithub = async () => {
    setGithubStatus("Salvataggio su PocketBase in corso...");
    try {
      // Sync completo e semplice: cancella tutti i record esistenti per
      // questo esercito, poi ricrea quelli attuali. Evita la complessità
      // di un upsert con id da tracciare record per record.
      const listResp = await fetch(
        `${PB_URL}/api/collections/elementi/records?filter=${encodeURIComponent(`army_tag="${currentArmy}"`)}&perPage=200`
      );
      if (!listResp.ok) throw new Error(`lista PocketBase fallita (${listResp.status})`);
      const listData = await listResp.json();
      for (const rec of listData.items) {
        await fetch(`${PB_URL}/api/collections/elementi/records/${rec.id}`, { method: "DELETE" });
      }

      for (const e of entries) {
        await fetch(`${PB_URL}/api/collections/elementi/records`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nickname: e.nickname,
            army_tag: currentArmy,
            tipo: e.tipo,
            ruolo: e.ruolo || "normale",
            group_id: e.groupId || "",
            base: e.base,
            slots: e.slots,
            children: e.children,
          }),
        });
      }
      setGithubStatus(`✓ Salvato su PocketBase (${entries.length} elementi).`);
    } catch (err) {
      setGithubStatus(`⚠ PocketBase non raggiungibile: ${err.message} — è avviato (./pocketbase serve)?`);
    }
  };

  const loadFromGithub = async () => {
    setGithubStatus("Caricamento da PocketBase in corso...");
    try {
      const resp = await fetch(
        `${PB_URL}/api/collections/elementi/records?filter=${encodeURIComponent(`army_tag="${currentArmy}"`)}&perPage=200`
      );
      if (!resp.ok) throw new Error(`lista PocketBase fallita (${resp.status})`);
      const data = await resp.json();
      if (data.items.length === 0) {
        setGithubStatus("⚠ Nessun elemento salvato su PocketBase per questo esercito — elementi attuali lasciati invariati.");
        return;
      }
      const loadedEntries = data.items.map((r) => ({
        nickname: r.nickname,
        id: r.id,
        tipo: r.tipo,
        ruolo: r.ruolo || "normale",
        groupId: r.group_id || "",
        base: r.base,
        slots: r.slots || [],
        children: r.children || [],
      }));
      setEntries(loadedEntries);
      setGithubStatus(`✓ Caricati ${loadedEntries.length} elementi da PocketBase.`);
    } catch (err) {
      setGithubStatus(`⚠ PocketBase non raggiungibile: ${err.message} — è avviato (./pocketbase serve)?`);
    }
  };

  useEffect(() => {
    loadFromGithub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentArmy]);

  return (
    <div className="min-h-screen bg-[#1C1917] p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">

        <div>
          <h1 className="font-serif text-2xl text-[#EDE6D6] tracking-wide">ELEMENTI</h1>
          <p className="text-xs font-mono text-[#EDE6D6]/50">
            Solo URL mesh/diffuse/collider per esercito — la geometria (offset/scale) arriva da Modelli al momento del merge finale.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="bg-[#EDE6D6] border border-[#9C7A3C] px-3 py-1.5 text-sm font-mono font-bold text-[#2B2622]">
            {ARMY_CODES[currentArmy] || "?"} - {ARMY_CATALOGS[currentArmy]?.name || currentArmy}
          </span>
          <button onClick={addNickname} className="bg-[#9C7A3C] text-[#1C1917] px-3 py-1.5 text-sm font-mono font-bold hover:bg-[#b28e49] transition-colors">
            + Nuovo Elemento
          </button>
        </div>

        <div className="space-y-3">
          {entries.length === 0 ? (
            <div className="py-8 text-center text-sm font-mono text-[#EDE6D6]/40 bg-[#26211d] border border-[#9C7A3C]/40">
              Nessun elemento per {ARMY_CODES[currentArmy]} ancora. Aggiungine uno.
            </div>
          ) : (
            entries.map((entry, i) => (
              <NicknameEditor
                key={entry.id || i}
                entry={entry}
                groups={groups}
                initiallyOpen={entry.id === justCreatedId}
                onChange={(e) => updateEntry(i, e)}
                onRemove={() => removeEntry(i)}
              />
            ))
          )}
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
