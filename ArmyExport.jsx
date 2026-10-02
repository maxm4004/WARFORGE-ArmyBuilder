import React, { useState, useEffect, useCallback } from "react";
import { ARMY_CATALOGS, ARMY_CODES, ARMY_KEYS, buildBasi } from "./ArmyBuilder.jsx";

/* ============================================================
   Generazione file esercito — WARFORGE
   Unico punto che legge DIRETTAMENTE da PocketBase (armylist,
   elementi, modelli — tutti filtrati per l'esercito corrente) e
   fonde tutto in un unico {tag}-army.json pronto per il gioco.
   È anche l'unico punto che scrive su Git: Modelli, Elementi e
   Armylist vivono solo su PocketBase, mai pubblicati da soli.
   ============================================================ */

const PB_URL = "http://127.0.0.1:8090";

function buildMeshNode(meshData, geometry) {
  const kind = meshData?.kind || "model";
  const rotY = meshData?.rotY_fix != null ? { rotY: meshData.rotY_fix } : {};

  if (kind === "bundle") {
    return {
      customAssetbundle: {
        assetBundleURL: meshData?.assetBundleURL || "",
        assetBundleSecondaryURL: meshData?.assetBundleSecondaryURL || "",
        material: geometry.material,
        type: geometry.type,
        ...(geometry.scaleX !== undefined ? { scaleX: geometry.scaleX } : {}),
        ...(geometry.scaleY !== undefined ? { scaleY: geometry.scaleY } : {}),
        ...(geometry.scaleZ !== undefined ? { scaleZ: geometry.scaleZ } : {}),
        ...(geometry.offsetX !== undefined ? { offsetX: geometry.offsetX, offsetY: geometry.offsetY, offsetZ: geometry.offsetZ } : {}),
        ...rotY,
      },
    };
  }
  return {
    customMesh: {
      meshURL: meshData?.meshURL || "",
      diffuseURL: meshData?.diffuseURL || "",
      colliderURL: meshData?.colliderURL || "",
      material: geometry.material,
      type: geometry.type,
      ...(geometry.scaleX !== undefined ? { scaleX: geometry.scaleX } : {}),
      ...(geometry.scaleY !== undefined ? { scaleY: geometry.scaleY } : {}),
      ...(geometry.scaleZ !== undefined ? { scaleZ: geometry.scaleZ } : {}),
      ...(geometry.offsetX !== undefined ? { offsetX: geometry.offsetX, offsetY: geometry.offsetY, offsetZ: geometry.offsetZ } : {}),
      ...rotY,
    },
  };
}

async function pbList(collection, armyTag) {
  const filter = encodeURIComponent(`army_tag="${armyTag}"`);
  const resp = await fetch(`${PB_URL}/api/collections/${collection}/records?filter=${filter}&perPage=200`);
  if (!resp.ok) throw new Error(`${collection}: lista PocketBase fallita (${resp.status})`);
  const data = await resp.json();
  return data.items;
}

// Fonde armylist + elementi + modelli (tutti letti fresco da PocketBase per
// l'esercito corrente) in un unico oggetto esportabile.
function mergeFromPocketBase(tag, armylistRecords, elementiRecords, modelliRecords) {
  const catalog = ARMY_CATALOGS[tag];
  const armyCode = ARMY_CODES[tag];
  const warnings = [];

  if (!catalog) {
    return { exportObj: { versione: "2.0-IEF", nome: tag, tag: armyCode || "", unita: [], modelli: {} }, warnings: ["⚠ Dati esercito non ancora caricati."] };
  }

  // Ricostruisce "unita" dai record armylist — l'array "basi" si ricalcola
  // da num_basi + basi_per_rango, non viene mai salvato direttamente.
  const unitaOrdinate = [...armylistRecords].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const unita = unitaOrdinate.map((r) => ({
    nome_display: r.nome_display,
    tipo: r.tipo,
    morale: r.morale,
    armi: r.armi || [],
    modificatore: r.modificatore || "",
    model: r.model || "",
    basi_per_rango: r.basi_per_rango || 4,
    basi: buildBasi(r.tipo, r.num_basi || 0, r.basi_per_rango || 4),
  }));

  const modelliById = Object.fromEntries((modelliRecords || []).map((g) => [g.id, g]));
  const elementiById = Object.fromEntries((elementiRecords || []).map((e) => [e.id, e]));

  const usedElementIds = new Set(unita.map((u) => u.model).filter(Boolean));

  const unitaSenzaModello = unita.filter((u) => !u.model).map((u) => u.nome_display);
  if (unitaSenzaModello.length > 0) {
    warnings.push(`Unità senza modello 3D assegnato (escluse dal catalogo modelli, ma presenti in "unita"): ${unitaSenzaModello.join(", ")}`);
  }

  const modelli = {};
  usedElementIds.forEach((elId) => {
    const el = elementiById[elId];
    if (!el) {
      warnings.push(`Modello con id "${elId}" assegnato a un'unità ma non trovato in Elementi per questo esercito.`);
      return;
    }
    const group = el.group_id ? modelliById[el.group_id] : null;
    if (!group || !group.base || !group.slots || group.slots.length === 0) {
      warnings.push(`Nessun gruppo geometrico popolato in Modelli per "${el.nickname}".`);
      return;
    }

    const children = group.slots.map((slot, i) => {
      const meshSlot = el.slots?.[i] || {};
      const childNode = buildMeshNode(meshSlot, slot);
      if (slot.child) {
        const childMesh = el.children?.[i];
        if (childMesh) {
          childNode.children = [buildMeshNode(childMesh, slot.child)];
        }
      }
      return childNode;
    });

    // Usa il nickname (leggibile) come chiave nel catalogo modelli finale —
    // è quello che il Lua si aspetta di trovare, non l'id tecnico.
    modelli[el.nickname] = {
      ...buildMeshNode(el.base, group.base),
      children,
    };
  });

  // "unita" nel file finale referenzia il nickname (non l'id PocketBase) —
  // più stabile e leggibile per il Lua.
  const unitaConModelNickname = unita.map((u) => {
    const el = u.model ? elementiById[u.model] : null;
    return { ...u, model: el ? el.nickname : "" };
  });

  const tipoCounters = {};
  const unitaConNumero = unitaConModelNickname.map((u) => {
    const template = catalog.units.find((t) => t.name === u.nome_display);
    const isCommander = !!(template?.commander && template.commander !== "No");
    if (isCommander) return { ...u };
    tipoCounters[u.tipo] = (tipoCounters[u.tipo] || 0) + 1;
    return { ...u, numero_unita: tipoCounters[u.tipo] };
  });

  const exportObj = {
    versione: "2.0-IEF",
    nome: catalog.name,
    tag: armyCode,
    unita: unitaConNumero,
    modelli,
  };

  return { exportObj, warnings };
}

// Regolamento p.29 — orientamento esercito, usato da TTS per la fase FIELD.
function computeOrientamento(unita) {
  let basiMontate = 0;
  let basiFP = 0;
  let basiFMFL = 0;

  unita.forEach((u) => {
    const n = u.basi.length;
    if (u.tipo === "KN" || u.tipo === "CP" || u.tipo === "CL") basiMontate += n;
    else if (u.tipo === "FP") basiFP += n;
    else if (u.tipo === "FM" || u.tipo === "FL") basiFMFL += n;
  });

  const fanteriaMatch = basiMontate <= 4;
  const cavalleriaMatch = basiFP === 0 && basiFMFL < 12;
  const baseOrientamento = fanteriaMatch ? "Fanteria" : "Armi Bilanciate";
  const ambiguo = cavalleriaMatch;

  return {
    basiMontate, basiFP, basiFMFL,
    baseOrientamento,
    ambiguo,
    opzioni: ambiguo ? [baseOrientamento, "Cavalleria"] : [baseOrientamento],
  };
}

export default function ArmyExport({ githubConfig, currentTag: currentTagProp, setCurrentTag: setCurrentTagProp }) {
  const catalogTags = ARMY_KEYS;
  const [internalCurrentTag, setInternalCurrentTag] = useState(catalogTags[0]);
  const currentTag = currentTagProp ?? internalCurrentTag;
  const setCurrentTag = setCurrentTagProp ?? setInternalCurrentTag;

  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [githubStatus, setGithubStatus] = useState("");
  const [pbStatus, setPbStatus] = useState("");
  const [exportObj, setExportObj] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [orientamentoScelto, setOrientamentoScelto] = useState({});

  const loadAndMerge = useCallback(async () => {
    setPbStatus("Lettura da PocketBase in corso...");
    try {
      const [armylistRecords, elementiRecords, modelliRecords] = await Promise.all([
        pbList("armylist", currentTag),
        pbList("elementi", currentTag),
        pbList("modelli", currentTag),
      ]);
      const { exportObj: obj, warnings: w } = mergeFromPocketBase(currentTag, armylistRecords, elementiRecords, modelliRecords);
      setExportObj(obj);
      setWarnings(w);
      setPbStatus(`✓ Letti ${armylistRecords.length} unità, ${elementiRecords.length} elementi, ${modelliRecords.length} gruppi.`);
    } catch (err) {
      setPbStatus(`⚠ PocketBase non raggiungibile: ${err.message} — è avviato (./pocketbase serve)?`);
      setExportObj(null);
      setWarnings([]);
    }
  }, [currentTag]);

  // Ricarica automaticamente ogni volta che entri qui o cambi esercito.
  useEffect(() => {
    loadAndMerge();
  }, [loadAndMerge]);

  const unita = exportObj?.unita || [];
  const orientamentoCalc = computeOrientamento(unita);
  const sceltaAttuale = orientamentoScelto[currentTag];
  const orientamentoFinale = orientamentoCalc.ambiguo ? sceltaAttuale : orientamentoCalc.baseOrientamento;

  const finalExportObj = exportObj ? { ...exportObj, orientamento: orientamentoFinale || null } : null;
  const allWarnings = orientamentoCalc.ambiguo && !sceltaAttuale
    ? [...warnings, `⚠ Orientamento ambiguo (${orientamentoCalc.opzioni.join(" / ")}) — scegli manualmente qui sopra prima di salvare.`]
    : warnings;
  const jsonString = finalExportObj ? JSON.stringify(finalExportObj, null, 2) : "";

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponibile
    }
  };

  const resolvedPath = () => {
    const template = (githubConfig?.generatedArmyPathTemplate) || "generated/{code}-army.json";
    const code = (ARMY_CODES[currentTag] || "").toLowerCase();
    return template.replace("{tag}", currentTag).replace("{code}", code).trim().replace(/^\/+/, "");
  };

  const saveToGithub = async () => {
    if (!finalExportObj) {
      setGithubStatus("⚠ Nessun dato da pubblicare — ricarica da PocketBase prima.");
      return;
    }
    if (orientamentoCalc.ambiguo && !sceltaAttuale) {
      setGithubStatus("⚠ Scegli manualmente l'orientamento (Cavalleria o l'alternativa) prima di salvare.");
      return;
    }
    const cfg = githubConfig || {};
    const owner = (cfg.owner || "").trim();
    const repo = (cfg.repo || "").trim();
    const branch = (cfg.branch || "main").trim();
    const token = (cfg.token || "").trim();
    const path = resolvedPath();
    if (!owner || !repo || !token) {
      setGithubStatus("⚠ Compila owner, repo e token nella tab Impostazioni.");
      return;
    }
    setGithubStatus("Pubblicazione su Git in corso...");
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;
    try {
      let sha;
      const getResp = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
        headers: { Authorization: `token ${token}` },
      });
      if (getResp.ok) {
        const getData = await getResp.json();
        sha = getData.sha;
      }
      const contentBase64 = btoa(unescape(encodeURIComponent(jsonString)));
      const putResp = await fetch(apiUrl, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Genera ${path}`,
          content: contentBase64,
          branch,
          ...(sha ? { sha } : {}),
        }),
      });
      if (!putResp.ok) {
        const err = await putResp.json();
        setGithubStatus(`⚠ Errore: ${err.message || putResp.status}`);
        return;
      }
      setGithubStatus(`✓ Pubblicato su ${owner}/${repo}/${path}`);
    } catch (err) {
      setGithubStatus(`⚠ Errore di rete: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0908] p-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-5">
        <div>
          <h1 className="font-serif text-2xl text-[#EDE6D6] tracking-wide">Generazione file esercito</h1>
          <p className="text-xs font-mono text-[#EDE6D6]/50">
            Legge Armylist + Elementi + Modelli direttamente da PocketBase e li fonde in un unico file, pronto per il gioco.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-block bg-[#EDE6D6] border border-[#9C7A3C] px-3 py-1.5 text-sm font-mono font-bold text-[#2B2622]">
            {ARMY_CODES[currentTag] || "?"} - {ARMY_CATALOGS[currentTag]?.name || currentTag}
          </span>
          <button
            onClick={loadAndMerge}
            className="border border-[#9C7A3C] text-[#EDE6D6] px-3 py-1.5 text-sm font-mono hover:bg-[#9C7A3C]/10 transition-colors"
          >
            Ricarica da PocketBase
          </button>
          {pbStatus && <span className="text-[10px] font-mono text-[#EDE6D6]/50">{pbStatus}</span>}
        </div>

        {finalExportObj && (
          <>
            <div className="bg-[#26211d] border border-[#9C7A3C]/40 px-4 py-3 text-xs font-mono text-[#EDE6D6]/70 space-y-1">
              <div>Unità in armylist: <span className="text-[#9C7A3C] font-bold">{unita.length}</span></div>
              <div>Nickname unici nel catalogo modelli generato: <span className="text-[#9C7A3C] font-bold">{Object.keys(finalExportObj.modelli).length}</span></div>
              <div>Basi montate (KN+CP+CL): <span className="text-[#EDE6D6]">{orientamentoCalc.basiMontate}</span> · Basi FP: <span className="text-[#EDE6D6]">{orientamentoCalc.basiFP}</span> · Basi FM+FL: <span className="text-[#EDE6D6]">{orientamentoCalc.basiFMFL}</span></div>
            </div>

            <div className="bg-[#26211d] border border-[#9C7A3C]/40 px-4 py-3 space-y-2">
              <div className="text-xs font-mono text-[#EDE6D6]/70">
                Orientamento esercito (regolamento p.29 — usato da TTS per la fase FIELD):
              </div>
              {orientamentoCalc.ambiguo ? (
                <div className="flex items-center gap-4">
                  {orientamentoCalc.opzioni.map((opz) => (
                    <label key={opz} className="flex items-center gap-1.5 text-sm font-mono text-[#EDE6D6]">
                      <input
                        type="radio"
                        name={`orientamento-${currentTag}`}
                        checked={sceltaAttuale === opz}
                        onChange={() => setOrientamentoScelto((s) => ({ ...s, [currentTag]: opz }))}
                      />
                      {opz}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-mono text-[#9C7A3C] font-bold">{orientamentoCalc.baseOrientamento}</div>
              )}
            </div>
          </>
        )}

        {allWarnings.length > 0 && (
          <div className="bg-[#7A2E2E]/10 border border-[#7A2E2E]/50 px-4 py-2 space-y-1">
            {allWarnings.map((w, i) => (
              <div key={i} className="text-xs font-mono text-[#c26b6b]">⚠ {w}</div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowJson((s) => !s)}
            disabled={!finalExportObj}
            className="bg-[#9C7A3C] text-[#1C1917] px-4 py-2 text-sm font-mono font-bold tracking-wide hover:bg-[#b28e49] transition-colors disabled:opacity-40"
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
            disabled={!finalExportObj}
            className="bg-[#7A2E2E] text-[#EDE6D6] px-4 py-2 text-sm font-mono font-bold tracking-wide hover:bg-[#8f3737] transition-colors disabled:opacity-40"
          >
            Pubblica su Git
          </button>
          <span className="text-[10px] font-mono text-[#EDE6D6]/40 ml-auto">
            Git: {(githubConfig?.owner) || "?"}/{(githubConfig?.repo) || "?"}/{resolvedPath()}
          </span>
        </div>

        {githubStatus && (
          <div className="text-xs font-mono text-[#EDE6D6]/70">{githubStatus}</div>
        )}

        {showJson && finalExportObj && (
          <pre className="bg-[#0f0d0b] border border-[#9C7A3C]/40 text-[#9dd39d] text-xs p-4 overflow-auto max-h-96 font-mono">
            {jsonString}
          </pre>
        )}
      </div>
    </div>
  );
}
