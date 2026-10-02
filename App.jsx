import React, { useState, useEffect } from "react";
import ArmyBuilder, { ARMY_CATALOGS, ARMY_KEYS, applyRemoteGameData } from "./ArmyBuilder.jsx";
import ModelliEditor from "./ModelliEditor.jsx";
import ElementiEditor from "./ElementiEditor.jsx";
import GithubSettings from "./GithubSettings.jsx";
import ArmyExport from "./ArmyExport.jsx";

const DEFAULT_GITHUB_CONFIG = {
  owner: "",
  repo: "",
  branch: "main",
  generatedArmyPathTemplate: "generated/{code}-army.json",
  rulesJsonPath: "json",
  token: "",
};

async function fetchGithubFile(cfg, path) {
  const owner = (cfg.owner || "").trim();
  const repo = (cfg.repo || "").trim();
  const branch = (cfg.branch || "main").trim();
  const token = (cfg.token || "").trim();
  if (!owner || !repo) return null;
  const cleanPath = path.trim().replace(/^\/+/, "");
  const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${cleanPath.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(branch)}`;
  const resp = await fetch(apiUrl, { headers: token ? { Authorization: `token ${token}` } : {} });
  if (!resp.ok) return null;
  const data = await resp.json();
  const decoded = decodeURIComponent(escape(atob(data.content)));
  return JSON.parse(decoded);
}

// Recupera i dataset di regole base (unit_types, morale, weapons,
// capabilities, i 14 cataloghi esercito, codici) da GitHub — l'unica cosa
// che ancora vive su Git prima della pubblicazione finale, dato che sono
// dati di regolamento, non dati di lavoro quotidiano (quelli vivono su
// PocketBase: Modelli, Elementi, Armylist).
async function loadRemoteGameData(cfg) {
  const basePath = (cfg.rulesJsonPath || "json").replace(/\/+$/, "");
  const armyKeys = ARMY_KEYS;

  const [unitTypesRaw, armyCodesRaw, moraleRaw, weaponsRaw, capabilitiesRaw, ...armyResults] = await Promise.all([
    fetchGithubFile(cfg, `${basePath}/unit_types.json`),
    fetchGithubFile(cfg, `${basePath}/army_codes.json`),
    fetchGithubFile(cfg, `${basePath}/morale.json`),
    fetchGithubFile(cfg, `${basePath}/weapons.json`),
    fetchGithubFile(cfg, `${basePath}/capabilities.json`),
    ...armyKeys.map((key) => fetchGithubFile(cfg, `${basePath}/armies/${key}.json`)),
  ]);

  const result = {};

  if (unitTypesRaw?.unit_types) result.unitTypes = unitTypesRaw.unit_types;
  if (moraleRaw?.morale_levels) result.moraleLevels = moraleRaw.morale_levels;
  if (weaponsRaw?.weapons) result.weapons = weaponsRaw.weapons;

  if (capabilitiesRaw?.capabilities) {
    const capabilities = {};
    Object.entries(capabilitiesRaw.capabilities).forEach(([key, val]) => {
      capabilities[key] = typeof val === "string" ? val : (val.description || "");
    });
    result.capabilities = capabilities;
  }

  if (armyCodesRaw && Object.keys(armyCodesRaw).length > 0) {
    result.armyCodes = armyCodesRaw;
  }

  const armyCatalogs = {};
  const armyCodesFallback = {};
  let anyArmyLoaded = false;
  armyKeys.forEach((key, i) => {
    if (armyResults[i]) {
      armyCatalogs[key] = armyResults[i];
      anyArmyLoaded = true;
      if (armyResults[i].code) armyCodesFallback[key] = armyResults[i].code;
    }
  });
  if (anyArmyLoaded) {
    result.armyCatalogs = armyCatalogs;
    if (!result.armyCodes && Object.keys(armyCodesFallback).length > 0) result.armyCodes = armyCodesFallback;
  }

  return result;
}

const ARMY_SUBTABS = [
  { id: "builder", label: "Armylist" },
  { id: "modelli", label: "Modelli" },
  { id: "elementi", label: "Elementi" },
  { id: "genera", label: "Genera" },
];

export default function App() {
  const [activeTool, setActiveTool] = useState("army");
  const [armySubTab, setArmySubTab] = useState("builder");
  // Esercito selezionato condiviso tra i 4 sotto-tab di Army Builder.
  const [currentArmyTag, setCurrentArmyTag] = useState(ARMY_KEYS[0]);
  const [githubConfig, setGithubConfig] = useState(() => {
    try {
      return { ...DEFAULT_GITHUB_CONFIG, ...(JSON.parse(localStorage.getItem("warforge_github_config")) || {}) };
    } catch {
      return DEFAULT_GITHUB_CONFIG;
    }
  });

  const updateGithubConfig = (patch) => {
    setGithubConfig((c) => {
      const next = { ...c, ...patch };
      localStorage.setItem("warforge_github_config", JSON.stringify(next));
      return next;
    });
  };

  const [gameDataStatus, setGameDataStatus] = useState("");

  // Carica una volta all'avvio i dataset di regole base da GitHub — l'unico
  // caricamento da Git che resta. Modelli, Elementi e Armylist si caricano
  // invece da soli da PocketBase, dentro ciascun editor.
  useEffect(() => {
    const owner = (githubConfig.owner || "").trim();
    const repo = (githubConfig.repo || "").trim();
    if (!owner || !repo) return;
    setGameDataStatus("Caricamento dati di base da GitHub...");
    loadRemoteGameData(githubConfig)
      .then((data) => {
        applyRemoteGameData(data);
        setGameDataStatus("");
      })
      .catch((err) => {
        console.error("Caricamento dati di base fallito:", err);
        setGameDataStatus("⚠ Caricamento dati di base fallito, uso i valori di default.");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TOOLS = [
    { id: "army", label: "Army Builder" },
    { id: "settings", label: "Impostazioni" },
  ];

  const renderArmySection = () => {
    if (armySubTab === "modelli") {
      return <ModelliEditor githubConfig={githubConfig} currentTag={currentArmyTag} setCurrentTag={setCurrentArmyTag} />;
    }
    if (armySubTab === "elementi") {
      return <ElementiEditor githubConfig={githubConfig} currentTag={currentArmyTag} setCurrentTag={setCurrentArmyTag} />;
    }
    if (armySubTab === "genera") {
      return <ArmyExport githubConfig={githubConfig} currentTag={currentArmyTag} setCurrentTag={setCurrentArmyTag} />;
    }
    return <ArmyBuilder githubConfig={githubConfig} currentTag={currentArmyTag} setCurrentTag={setCurrentArmyTag} />;
  };

  return (
    <div className="min-h-screen bg-[#1C1917]">
      <nav className="border-b border-[#9C7A3C]/40 bg-[#0f0d0b] px-6 py-3 flex items-center gap-6">
        <span className="font-serif text-lg text-[#9C7A3C] tracking-widest uppercase shrink-0">WARFORGE</span>
        <div className="flex gap-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className={`px-4 py-1.5 text-sm font-mono tracking-wide transition-colors ${
                activeTool === tool.id
                  ? "bg-[#9C7A3C] text-[#1C1917] font-bold"
                  : "text-[#EDE6D6]/60 hover:text-[#EDE6D6] hover:bg-[#9C7A3C]/10"
              }`}
            >
              {tool.label}
            </button>
          ))}
        </div>
        {gameDataStatus && (
          <span className="text-xs font-mono text-[#EDE6D6]/50 ml-auto">{gameDataStatus}</span>
        )}
      </nav>

      {activeTool === "army" && (
        <>
          <div className="bg-[#1C1917] border-b border-[#9C7A3C]/20 px-6 py-2 flex gap-1">
            {ARMY_SUBTABS.map((sub) => (
              <button
                key={sub.id}
                onClick={() => setArmySubTab(sub.id)}
                className={`px-4 py-1.5 text-sm font-mono tracking-wide transition-colors ${
                  armySubTab === sub.id
                    ? "bg-[#7A2E2E] text-[#EDE6D6] font-bold"
                    : "text-[#EDE6D6]/50 hover:text-[#EDE6D6] hover:bg-[#7A2E2E]/20"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
          {renderArmySection()}
        </>
      )}
      {activeTool === "settings" && <GithubSettings githubConfig={githubConfig} updateGithubConfig={updateGithubConfig} />}
    </div>
  );
}
