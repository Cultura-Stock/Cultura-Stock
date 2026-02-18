import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { BrowserMultiFormatReader } from "@zxing/browser";

const INIT_PRODUCTS = [
  { ean: "3017620422003", name: "Nutella 400g",         category: "Alimentaire", stock: 48,  unit: "pcs" },
  { ean: "5000112546415", name: "Coca-Cola 33cl",        category: "Boissons",   stock: 120, unit: "pcs" },
  { ean: "3228857000166", name: "Évian 1.5L",            category: "Boissons",   stock: 72,  unit: "pcs" },
  { ean: "8000500310427", name: "Ferrero Rocher 16pcs",  category: "Confiserie", stock: 30,  unit: "boîtes" },
  { ean: "3175680011684", name: "Président Beurre 250g", category: "Crémerie",   stock: 55,  unit: "pcs" },
  { ean: "3256220062942", name: "Ricoré 100g",           category: "Alimentaire",stock: 18,  unit: "pcs" },
];

const INIT_ADDRESSES = (() => {
  const a = {};
  for (let i = 1; i <= 99; i++) a[`100-${String(i).padStart(2,"0")}`] = { products: [] };
  a["100-01"].products = [{ ean: "3017620422003", qty: 10 }, { ean: "5000112546415", qty: 5 }];
  a["100-05"].products = [{ ean: "3228857000166", qty: 24 }];
  a["100-12"].products = [{ ean: "8000500310427", qty: 8 }, { ean: "3175680011684", qty: 12 }];
  return a;
})();

const Ic = ({ d, size = 20, sw = 1.8, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);

const D = {
  barcode: "M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M3 3h4M17 3h4M3 21h4M17 21h4",
  scan:    "M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10",
  pkg:     "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12",
  map:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  srch:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  upload:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  camera:  "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
};

const C = {
  navy:    "#1a2b6b",
  navyD:   "#14205a",
  navyL:   "#2540a0",
  white:   "#ffffff",
  offwhite:"#f4f5f8",
  light:   "#eef0f9",
  border:  "#dde0ee",
  grey:    "#8b92b8",
  greyL:   "#c5cadf",
  green:   "#27ae60",
  red:     "#e74c3c",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-thumb { background: #c5cadf; border-radius: 10px; }
  input, button { font-family: 'Nunito', sans-serif; }

  .btn-main { background:linear-gradient(135deg,#1a2b6b,#2540a0); color:white; border:none; border-radius:12px; padding:10px 20px; font-weight:700; font-size:14px; cursor:pointer; display:flex; align-items:center; gap:7px; transition:all .2s; box-shadow:0 4px 14px rgba(26,43,107,.3); }
  .btn-main:hover { transform:translateY(-2px); box-shadow:0 7px 22px rgba(26,43,107,.42); }

  .btn-outline { background:white; color:#1a2b6b; border:2px solid #dde0ee; border-radius:10px; padding:8px 16px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .15s; }
  .btn-outline:hover { border-color:#1a2b6b; background:#eef0f9; }
  .btn-outline.active { background:#1a2b6b; color:white; border-color:#1a2b6b; }

  .btn-danger { background:white; border:1.5px solid #fcd4d0; border-radius:8px; color:#e74c3c; cursor:pointer; padding:6px 9px; display:flex; align-items:center; transition:all .15s; }
  .btn-danger:hover { background:#fdecea; border-color:#e74c3c; }

  .btn-scan { background:linear-gradient(135deg,#1a2b6b,#2540a0); color:white; border:none; border-radius:10px; padding:8px 16px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; transition:all .2s; }
  .btn-scan:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(26,43,107,.3); }
  .btn-scan.active { background:linear-gradient(135deg,#e74c3c,#c0392b); box-shadow:0 4px 14px rgba(231,76,60,.3); }

  .field { background:white; border:2px solid #dde0ee; color:#1a2b6b; border-radius:12px; padding:11px 16px; font-size:14px; font-weight:600; outline:none; transition:all .15s; width:100%; }
  .field:focus { border-color:#1a2b6b; box-shadow:0 0 0 3px rgba(26,43,107,.1); }
  .field::placeholder { color:#c5cadf; font-weight:500; }
  .field-sm { padding:7px 12px; font-size:13px; border-radius:9px; }

  .card { background:white; border-radius:16px; box-shadow:0 2px 14px rgba(26,43,107,.07); border:1.5px solid #eaecf5; }

  .bdg { font-size:11px; font-weight:800; padding:3px 9px; border-radius:20px; letter-spacing:.04em; }
  .b-navy  { background:#eef0f9; color:#1a2b6b; }
  .b-green { background:#e6f9ee; color:#1a7a3e; }
  .b-red   { background:#fdecea; color:#c0392b; }

  .anim { animation:aup .22s ease; }
  @keyframes aup { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .notif-box { position:fixed; top:20px; right:20px; z-index:9999; background:white; border-radius:14px; padding:13px 20px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(26,43,107,.18); animation:aup .3s ease; max-width:340px; border-left:4px solid; }
  .n-ok  { border-color:#27ae60; color:#1a7a3e; }
  .n-err { border-color:#e74c3c; color:#c0392b; }

  .addr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(82px,1fr)); gap:8px; }
  .addr-cell { background:white; border:2px solid #dde0ee; border-radius:10px; padding:10px 6px; text-align:center; cursor:pointer; transition:all .15s; font-size:12px; font-weight:800; color:#8b92b8; }
  .addr-cell:hover  { border-color:#1a2b6b; color:#1a2b6b; transform:translateY(-1px); box-shadow:0 4px 12px rgba(26,43,107,.12); }
  .addr-cell.filled { border-color:#1a2b6b; color:#1a2b6b; background:#eef0f9; }
  .addr-cell.sel    { background:#1a2b6b; color:white; border-color:#1a2b6b; box-shadow:0 4px 14px rgba(26,43,107,.35); transform:scale(1.05); }

  .trow { transition:background .1s; }
  .trow:hover { background:#f7f8fd; }

  .qty-btn-minus { background:#eef0f9; border:none; border-radius:6px; width:26px; height:26px; cursor:pointer; font-weight:900; font-size:16px; color:#1a2b6b; display:flex; align-items:center; justify-content:center; transition:background .1s; }
  .qty-btn-minus:hover { background:#dde0ee; }
  .qty-btn-plus  { background:#1a2b6b; border:none; border-radius:6px; width:26px; height:26px; cursor:pointer; font-weight:900; font-size:16px; color:white; display:flex; align-items:center; justify-content:center; transition:background .1s; }
  .qty-btn-plus:hover  { background:#2540a0; }
  .qty-input { width:64px; background:#f7f8fd; border:2px solid #dde0ee; border-radius:8px; padding:5px 8px; font-size:13px; font-weight:700; color:#1a2b6b; outline:none; text-align:center; font-family:'Nunito',sans-serif; transition:border-color .15s; }
  .qty-input:focus { border-color:#1a2b6b; }

  .modal-bg { position:fixed; inset:0; background:rgba(10,15,40,.5); display:flex; align-items:center; justify-content:center; z-index:500; animation:fadeIn .2s ease; }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal { background:white; border-radius:20px; padding:28px; width:560px; max-width:95vw; max-height:85vh; overflow-y:auto; box-shadow:0 20px 60px rgba(10,15,40,.3); animation:aup .25s ease; }
  .drop-zone { border:2.5px dashed #c5cadf; border-radius:14px; padding:32px 20px; text-align:center; cursor:pointer; transition:all .2s; }
  .drop-zone:hover, .drop-zone.over { border-color:#1a2b6b; background:#eef0f9; }

  /* Scanner caméra */
  .scanner-modal { position:fixed; inset:0; background:rgba(0,0,0,.92); z-index:1000; display:flex; flex-direction:column; align-items:center; justify-content:center; }
  .scanner-video { width:100%; max-width:400px; border-radius:16px; overflow:hidden; position:relative; }
  .scanner-video video { width:100%; display:block; border-radius:16px; }
  .scanner-line { position:absolute; left:10%; right:10%; height:3px; background:linear-gradient(90deg,transparent,#1a2b6b,transparent); animation:scanline 2s ease-in-out infinite; top:50%; }
  @keyframes scanline { 0%,100%{top:20%} 50%{top:80%} }
  .scanner-frame { position:absolute; inset:0; pointer-events:none; }
  .scanner-corner { position:absolute; width:24px; height:24px; border-color:#1a2b6b; border-style:solid; }
  .sc-tl { top:8%; left:8%; border-width:3px 0 0 3px; border-radius:4px 0 0 0; }
  .sc-tr { top:8%; right:8%; border-width:3px 3px 0 0; border-radius:0 4px 0 0; }
  .sc-bl { bottom:8%; left:8%; border-width:0 0 3px 3px; border-radius:0 0 0 4px; }
  .sc-br { bottom:8%; right:8%; border-width:0 3px 3px 0; border-radius:0 0 4px 0; }
`;

// ── Scanner Caméra ────────────────────────────────────────────────────────────
function CameraScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const readerRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let active = true;
    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader.decodeFromVideoDevice(null, videoRef.current, (result, err) => {
      if (!active) return;
      if (result) {
        setScanning(false);
        active = false;
        onScan(result.getText());
      }
    }).catch(e => {
      setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    });

    return () => {
      active = false;
      try { reader.reset(); } catch {}
    };
  }, [onScan]);

  return (
    <div className="scanner-modal" onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ textAlign:"center", marginBottom:20 }}>
        <div style={{ color:"white", fontWeight:900, fontSize:18, marginBottom:6 }}>📷 Scanner un code-barres</div>
        <div style={{ color:"rgba(255,255,255,.6)", fontSize:13 }}>Pointez la caméra vers le code-barres</div>
      </div>

      {error ? (
        <div style={{ background:"#fdecea", borderRadius:14, padding:"20px 24px", textAlign:"center", maxWidth:320 }}>
          <div style={{ color:C.red, fontWeight:700, marginBottom:14 }}>{error}</div>
          <button className="btn-main" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <div className="scanner-video">
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="scanner-frame">
            <div className="scanner-corner sc-tl" />
            <div className="scanner-corner sc-tr" />
            <div className="scanner-corner sc-bl" />
            <div className="scanner-corner sc-br" />
            {scanning && <div className="scanner-line" />}
          </div>
        </div>
      )}

      <button onClick={onClose} style={{ marginTop:24, background:"rgba(255,255,255,.15)", border:"2px solid rgba(255,255,255,.3)", borderRadius:12, padding:"12px 32px", color:"white", fontFamily:"inherit", fontWeight:700, fontSize:15, cursor:"pointer" }}>
        Annuler
      </button>
    </div>
  );
}

// ── Parsers Excel ─────────────────────────────────────────────────────────────
function parseFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        res(XLSX.utils.sheet_to_json(ws, { defval: "" }));
      } catch(err) { rej(err); }
    };
    r.onerror = rej;
    r.readAsArrayBuffer(file);
  });
}

function normalizeRow(row) {
  const n = {};
  Object.keys(row).forEach(k => { n[k.toLowerCase().replace(/[^a-z0-9]/g, "")] = row[k]; });
  return n;
}

async function parseProducts(file) {
  const rows = await parseFile(file);
  const products = [], errors = [];
  rows.forEach((row, i) => {
    const r = normalizeRow(row);
    const ean  = String(r.ean || r.codebarres || r.barcode || "").trim();
    const name = String(r.nomduproduit || r.nom || r.designation || r.name || r.libelle || "").trim();
    if (!ean || !name) { errors.push(`Ligne ${i+2} ignorée (EAN ou nom manquant)`); return; }
    products.push({ ean, name, category: String(r.categorie || r.category || "").trim() || "—", stock: Number(r.stock || r.quantite || 0) || 0, unit: String(r.unite || r.unit || "pcs").trim() || "pcs" });
  });
  return { products, errors };
}

async function parseAddresses(file) {
  const rows = await parseFile(file);
  const addrMap = {}, errors = [];
  rows.forEach((row, i) => {
    const r = normalizeRow(row);
    const addr = String(r.adresse || r.address || r.emplacement || "").trim();
    const ean  = String(r.eanproduit || r.ean || r.codebarres || "").trim();
    const qty  = Number(r.quantite || r.qty || r.stock || 1) || 1;
    if (!addr || !ean) { errors.push(`Ligne ${i+2} ignorée`); return; }
    if (!addrMap[addr]) addrMap[addr] = [];
    if (!addrMap[addr].find(p => p.ean === ean)) addrMap[addr].push({ ean, qty });
  });
  return { addrMap, errors };
}

// ── Modal Import ──────────────────────────────────────────────────────────────
function ImportModal({ type, onClose, onDone }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("replace");
  const inputRef = useRef();
  const isProducts = type === "products";

  const process = async f => {
    if (!f) return;
    setFile(f); setLoading(true); setErrors([]);
    try {
      if (isProducts) { const { products, errors: e } = await parseProducts(f); setPreview(products); setErrors(e); }
      else { const { addrMap, errors: e } = await parseAddresses(f); setPreview(addrMap); setErrors(e); }
    } catch { setErrors(["Erreur de lecture du fichier."]); }
    setLoading(false);
  };

  const count = isProducts ? (preview?.length ?? 0) : (preview ? Object.keys(preview).length : 0);

  return (
    <div className="modal-bg" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <div>
            <div style={{ fontWeight:900, fontSize:19, color:C.navy }}>Importer {isProducts ? "des produits" : "des adresses"}</div>
            <div style={{ fontSize:13, color:C.grey, fontWeight:600, marginTop:3 }}>Fichier .xlsx, .xls ou .csv</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", color:C.greyL }}>
            <Ic d={D.x} size={20} sw={2.5} />
          </button>
        </div>

        <div style={{ background:C.light, borderRadius:12, padding:"12px 16px", marginBottom:18, border:`1.5px solid ${C.border}` }}>
          <div style={{ fontWeight:800, fontSize:11, color:C.grey, letterSpacing:".07em", marginBottom:10 }}>FORMAT ATTENDU</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {(isProducts
              ? [["EAN","obligatoire"],["Nom du produit","obligatoire"],["Catégorie","facultatif"],["Stock","facultatif"],["Unité","facultatif"]]
              : [["Adresse","obligatoire"],["EAN produit","obligatoire"],["Quantité","facultatif"]]
            ).map(([col, req]) => (
              <div key={col} style={{ background:"white", borderRadius:8, padding:"7px 12px", border:`1.5px solid ${C.border}`, textAlign:"center" }}>
                <div style={{ fontWeight:800, fontSize:12, color:C.navy }}>{col}</div>
                <div style={{ fontSize:10, color:req==="obligatoire"?C.red:C.green, fontWeight:700, marginTop:2 }}>{req}</div>
              </div>
            ))}
          </div>
        </div>

        {!file && (
          <div className={`drop-zone ${dragging?"over":""}`}
            onClick={() => inputRef.current.click()}
            onDragOver={e=>{e.preventDefault();setDragging(true)}}
            onDragLeave={()=>setDragging(false)}
            onDrop={e=>{e.preventDefault();setDragging(false);process(e.dataTransfer.files[0])}}>
            <Ic d={D.upload} size={36} sw={1.5} style={{ color:C.greyL, marginBottom:12 }} />
            <div style={{ fontWeight:800, fontSize:15, color:C.navy, marginBottom:6 }}>Glissez votre fichier ici</div>
            <div style={{ fontWeight:600, fontSize:13, color:C.grey }}>ou <span style={{ color:C.navy, textDecoration:"underline" }}>parcourir</span></div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{ display:"none" }} onChange={e=>process(e.target.files[0])} />
          </div>
        )}

        {loading && <div style={{ textAlign:"center", padding:"24px 0", color:C.grey, fontWeight:700 }}>⏳ Lecture du fichier…</div>}

        {errors.length > 0 && (
          <div style={{ background:"#fdecea", borderRadius:10, padding:"10px 14px", marginTop:14, border:"1.5px solid #fcd4d0" }}>
            {errors.map((e,i) => <div key={i} style={{ fontSize:12, color:C.red, fontWeight:600 }}>{e}</div>)}
          </div>
        )}

        {preview && !loading && (
          <div className="anim">
            <div style={{ background:"#e6f9ee", borderRadius:10, padding:"10px 14px", marginTop:14, border:"1.5px solid #b8edcc", marginBottom:16 }}>
              <span style={{ fontWeight:800, fontSize:13, color:"#1a7a3e" }}>✅ {count} {isProducts?"produit":"emplacement"}{count>1?"s":""} prêt{count>1?"s":""} à importer</span>
            </div>

            <div style={{ maxHeight:150, overflowY:"auto", border:`1.5px solid ${C.border}`, borderRadius:10, marginBottom:16 }}>
              {isProducts ? (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"150px 1fr 100px", background:C.light, padding:"7px 12px", fontSize:11, fontWeight:800, color:C.grey, letterSpacing:".06em", position:"sticky", top:0 }}>
                    <span>EAN</span><span>NOM</span><span>STOCK</span>
                  </div>
                  {preview.slice(0,15).map((p,i) => (
                    <div key={i} className="trow" style={{ display:"grid", gridTemplateColumns:"150px 1fr 100px", padding:"6px 12px", borderBottom:"1px solid #f0f2f9", fontSize:12, color:C.navy, fontWeight:600 }}>
                      <span style={{ color:C.navyL, fontWeight:700 }}>{p.ean}</span>
                      <span>{p.name}</span>
                      <span>{p.stock} {p.unit}</span>
                    </div>
                  ))}
                  {preview.length > 15 && <div style={{ padding:"5px 12px", fontSize:11, color:C.grey }}>…et {preview.length-15} de plus</div>}
                </>
              ) : (
                <>
                  <div style={{ display:"grid", gridTemplateColumns:"110px 1fr 70px", background:C.light, padding:"7px 12px", fontSize:11, fontWeight:800, color:C.grey, letterSpacing:".06em", position:"sticky", top:0 }}>
                    <span>ADRESSE</span><span>EAN</span><span>QTÉ</span>
                  </div>
                  {Object.entries(preview).slice(0,15).flatMap(([addr,prods]) =>
                    prods.map((p,j) => (
                      <div key={`${addr}-${j}`} className="trow" style={{ display:"grid", gridTemplateColumns:"110px 1fr 70px", padding:"6px 12px", borderBottom:"1px solid #f0f2f9", fontSize:12, color:C.navy, fontWeight:600 }}>
                        <span className="bdg b-navy" style={{ display:"inline-block" }}>{addr}</span>
                        <span style={{ color:C.navyL }}>{p.ean}</span>
                        <span>{p.qty}</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>

            <div style={{ marginBottom:18 }}>
              <div style={{ fontWeight:800, fontSize:11, color:C.grey, letterSpacing:".07em", marginBottom:10 }}>MODE D'IMPORT</div>
              <div style={{ display:"flex", gap:8 }}>
                {[["replace","🔄 Remplacer","Efface les données existantes"],["merge","➕ Fusionner","Ajoute sans supprimer"]].map(([id,label,desc]) => (
                  <div key={id} onClick={()=>setMode(id)} style={{ flex:1, padding:"10px 12px", borderRadius:12, cursor:"pointer", border:`2px solid ${mode===id?C.navy:C.border}`, background:mode===id?C.light:"white", transition:"all .15s" }}>
                    <div style={{ fontWeight:800, fontSize:13, color:C.navy }}>{label}</div>
                    <div style={{ fontSize:11, color:C.grey, fontWeight:600, marginTop:2 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-main" onClick={() => onDone(preview, mode)} style={{ flex:1, justifyContent:"center" }}>
                <Ic d={D.check} size={15} sw={2.5} /> Confirmer l'import
              </button>
              <button className="btn-outline" onClick={() => { setFile(null); setPreview(null); setErrors([]); }}>Changer de fichier</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ───────────────────────────────────────────────────────────────────────
export default function StockApp() {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState(INIT_PRODUCTS);
  const [addresses, setAddresses] = useState(INIT_ADDRESSES);
  const [notif, setNotif] = useState(null);
  const [importModal, setImportModal] = useState(null);
  const [scanner, setScanner] = useState(null); // { target: "products"|"addresses", onScan }

  const notify = (msg, type = "success") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  };

  const handleImportProducts = (data, mode) => {
    if (mode === "replace") { setProducts(data); notify(`${data.length} produits importés`); }
    else {
      const merged = [...products]; let added = 0, updated = 0;
      data.forEach(p => { const idx = merged.findIndex(x => x.ean===p.ean); if (idx>=0){merged[idx]=p;updated++;}else{merged.push(p);added++;} });
      setProducts(merged); notify(`${added} ajouté${added>1?"s":""}, ${updated} mis à jour`);
    }
    setImportModal(null);
  };

  const handleImportAddresses = (addrMap, mode) => {
    setAddresses(prev => {
      const next = mode==="replace" ? (() => { const a={}; for(let i=1;i<=99;i++) a[`100-${String(i).padStart(2,"0")}`]={products:[]}; return a; })() : {...prev};
      Object.entries(addrMap).forEach(([addr,prods]) => {
        if (!next[addr]) next[addr]={products:[]};
        if (mode==="replace") next[addr].products=prods;
        else prods.forEach(p => { const ex=next[addr].products.findIndex(x=>x.ean===p.ean); if(ex>=0)next[addr].products[ex].qty=p.qty; else next[addr].products.push(p); });
      });
      return next;
    });
    notify(`${Object.keys(addrMap).length} emplacements importés`);
    setImportModal(null);
  };

  const usedSlots = Object.values(addresses).filter(a => a.products.length>0).length;

  const openScanner = useCallback((onScan) => {
    setScanner({ onScan });
  }, []);

  const handleScan = useCallback((ean) => {
    setScanner(null);
    if (scanner?.onScan) scanner.onScan(ean);
  }, [scanner]);

  return (
    <div style={{ minHeight:"100vh", background:C.offwhite, fontFamily:"'Nunito','Trebuchet MS',sans-serif", color:C.navy }}>
      <style>{CSS}</style>

      {notif && (
        <div className={`notif-box ${notif.type==="success"?"n-ok":"n-err"}`}>
          <Ic d={notif.type==="success"?D.check:D.x} size={16} sw={2.5} />{notif.msg}
        </div>
      )}

      {importModal && (
        <ImportModal type={importModal} onClose={()=>setImportModal(null)}
          onDone={importModal==="products" ? handleImportProducts : handleImportAddresses} />
      )}

      {scanner && (
        <CameraScanner onScan={handleScan} onClose={() => setScanner(null)} />
      )}

      {/* HEADER */}
      <header style={{ background:`linear-gradient(135deg,${C.navy},${C.navyD})`, padding:"0 24px", height:64, display:"flex", alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 22px rgba(26,43,107,.32)", position:"sticky", top:0, zIndex:100 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <div style={{ background:"white", borderRadius:10, width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Ic d={D.barcode} size={20} sw={1.8} style={{ color:C.navy }} />
          </div>
          <div>
            <div style={{ fontWeight:900, fontSize:20, color:"white", letterSpacing:"-.02em", lineHeight:1 }}>
              cultura<span style={{ opacity:.5 }}>·</span>stock
            </div>
            <div style={{ fontSize:9, color:"rgba(255,255,255,.5)", letterSpacing:".1em", fontWeight:700, marginTop:2 }}>GESTION D'INVENTAIRE</div>
          </div>
        </div>

        <nav style={{ display:"flex", gap:6 }}>
          {[["products","Produits",D.pkg],["addresses","Adressage",D.map]].map(([id,label,icon]) => (
            <button key={id} onClick={()=>setTab(id)} style={{ background:tab===id?"white":"rgba(255,255,255,.12)", color:tab===id?C.navy:"rgba(255,255,255,.85)", border:"none", borderRadius:10, padding:"8px 20px", fontFamily:"inherit", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", gap:7, transition:"all .2s" }}>
              <Ic d={icon} size={16} sw={2} />{label}
            </button>
          ))}
        </nav>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={()=>setImportModal(tab)} style={{ background:"rgba(255,255,255,.12)", border:"1.5px solid rgba(255,255,255,.25)", borderRadius:10, padding:"7px 14px", color:"white", fontFamily:"inherit", fontWeight:700, fontSize:12, cursor:"pointer", display:"flex", alignItems:"center", gap:6, transition:"all .15s" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,.22)"}
            onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.12)"}>
            <Ic d={D.upload} size={14} sw={2} /> Importer Excel
          </button>
          <div style={{ background:"rgba(255,255,255,.12)", borderRadius:20, padding:"6px 14px", fontSize:12, color:"rgba(255,255,255,.75)", fontWeight:700 }}>
            {products.length} réf. · {usedSlots} empl.
          </div>
        </div>
      </header>

      <main style={{ padding:"28px 24px", maxWidth:1140, margin:"0 auto" }}>
        {tab==="products"
          ? <Products products={products} setProducts={setProducts} addresses={addresses} notify={notify} onImport={()=>setImportModal("products")} openScanner={openScanner} />
          : <Addresses products={products} addresses={addresses} setAddresses={setAddresses} notify={notify} onImport={()=>setImportModal("addresses")} openScanner={openScanner} />
        }
      </main>
    </div>
  );
}

// ── VUE PRODUITS ──────────────────────────────────────────────────────────────
function Products({ products, setProducts, addresses, notify, onImport, openScanner }) {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ean:"", name:"", category:"", stock:0, unit:"pcs" });

  const addrMap = {};
  Object.entries(addresses).forEach(([addr,d]) => d.products.forEach(({ean})=>{if(!addrMap[ean])addrMap[ean]=[];addrMap[ean].push(addr);}));

  const list = products.filter(p => p.ean.includes(q)||p.name.toLowerCase().includes(q.toLowerCase())||p.category.toLowerCase().includes(q.toLowerCase()));

  const handleScanResult = (ean) => {
    setQ(ean);
    notify(`Code scanné : ${ean}`);
  };

  const add = () => {
    if (!form.ean||!form.name) return notify("EAN et nom requis","error");
    if (products.find(p=>p.ean===form.ean)) return notify("Cet EAN existe déjà","error");
    setProducts([...products,{...form,stock:Number(form.stock)}]);
    setForm({ean:"",name:"",category:"",stock:0,unit:"pcs"}); setShowForm(false);
    notify(`"${form.name}" ajouté avec succès`);
  };

  return (
    <div className="anim">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"-.03em", color:C.navy }}>Produits</h1>
          <p style={{ color:C.grey, fontSize:14, fontWeight:600, marginTop:4 }}>{products.length} références enregistrées</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="btn-outline" onClick={onImport}><Ic d={D.upload} size={15} sw={2}/>Importer Excel</button>
          <button className="btn-main" onClick={()=>setShowForm(v=>!v)}><Ic d={D.plus} size={16} sw={2.5}/>Nouveau produit</button>
        </div>
      </div>

      {showForm && (
        <div className="card anim" style={{ padding:20, marginBottom:18, borderColor:C.navy, borderWidth:2 }}>
          <div style={{ fontWeight:900, fontSize:12, color:C.navy, letterSpacing:".08em", marginBottom:14 }}>NOUVEAU PRODUIT</div>
          <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1.5fr 1fr 90px 80px", gap:10, marginBottom:12 }}>
            {[["ean","EAN *"],["name","Désignation *"],["category","Catégorie"],["stock","Stock","number"],["unit","Unité"]].map(([k,ph,t])=>(
              <input key={k} className="field" type={t||"text"} placeholder={ph} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} />
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button className="btn-main" onClick={add}><Ic d={D.check} size={15} sw={2.5}/>Ajouter</button>
            <button className="btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding:14, marginBottom:18, display:"flex", gap:10, alignItems:"center" }}>
        <div style={{ position:"relative", flex:1 }}>
          <div style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:C.greyL }}><Ic d={D.srch} size={18} sw={2}/></div>
          <input className="field" style={{ paddingLeft:44 }} placeholder="Rechercher par EAN, nom, catégorie…" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
        {/* Bouton scanner caméra */}
        <button className="btn-scan" onClick={() => openScanner(handleScanResult)}>
          <Ic d={D.camera} size={16} sw={2}/> Scanner
        </button>
        {q && <button className="btn-outline" style={{ padding:"8px 11px" }} onClick={()=>setQ("")}><Ic d={D.x} size={14} sw={2.5}/></button>}
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"160px 1fr 120px 75px 70px 1fr", background:C.light, padding:"10px 18px", fontSize:11, fontWeight:800, color:C.grey, letterSpacing:".08em", borderBottom:`1.5px solid ${C.border}` }}>
          <span>EAN</span><span>DÉSIGNATION</span><span>CATÉGORIE</span><span>STOCK</span><span>UNITÉ</span><span>EMPLACEMENTS</span>
        </div>
        {list.length===0 && (
          <div style={{ padding:"48px 20px", textAlign:"center", color:C.greyL }}>
            <Ic d={D.srch} size={38} sw={1.5}/><br/><br/>
            <span style={{ fontWeight:700, fontSize:14 }}>Aucun produit trouvé</span>
          </div>
        )}
        {list.map((p,i) => {
          const addrs = addrMap[p.ean]||[];
          return (
            <div key={p.ean} className="trow" style={{ display:"grid", gridTemplateColumns:"160px 1fr 120px 75px 70px 1fr", padding:"12px 18px", borderBottom:i<list.length-1?`1px solid ${C.light}`:"none", alignItems:"center" }}>
              <span style={{ fontWeight:700, fontSize:12, color:C.navy, background:C.light, borderRadius:6, padding:"3px 8px", display:"inline-block" }}>{p.ean}</span>
              <span style={{ fontWeight:700, fontSize:14, color:C.navy }}>{p.name}</span>
              <span><span className="bdg b-navy">{p.category}</span></span>
              <span><span className={`bdg ${p.stock>20?"b-green":"b-red"}`}>{p.stock}</span></span>
              <span style={{ color:C.grey, fontSize:13, fontWeight:600 }}>{p.unit}</span>
              <span style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                {addrs.length===0 ? <span style={{ color:C.greyL, fontWeight:600, fontSize:13 }}>—</span>
                  : addrs.map(a=><span key={a} className="bdg b-navy">{a}</span>)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── VUE ADRESSAGE ─────────────────────────────────────────────────────────────
function Addresses({ products, addresses, setAddresses, notify, onImport, openScanner }) {
  const [sel, setSel] = useState(null);
  const [ean, setEan] = useState("");
  const [qty, setQty] = useState(1);
  const [filter, setFilter] = useState("all");

  const selData = sel ? addresses[sel] : null;
  const keys = Object.keys(addresses);
  const used = keys.filter(k=>addresses[k].products.length>0).length;
  const shown = filter==="all"?keys:filter==="used"?keys.filter(k=>addresses[k].products.length>0):keys.filter(k=>addresses[k].products.length===0);

  const addProd = () => {
    if (!sel||!ean.trim()) return;
    const prod = products.find(p=>p.ean===ean.trim());
    if (!prod) return notify(`EAN "${ean}" introuvable`,"error");
    if (addresses[sel].products.find(p=>p.ean===ean.trim())) return notify("Produit déjà présent","error");
    setAddresses(prev=>({...prev,[sel]:{...prev[sel],products:[...prev[sel].products,{ean:ean.trim(),qty:Number(qty)||1}]}}));
    setEan(""); setQty(1);
    notify(`"${prod.name}" ajouté à ${sel}`);
  };

  const rmProd = (addr,e) => {
    setAddresses(prev=>({...prev,[addr]:{...prev[addr],products:prev[addr].products.filter(x=>x.ean!==e)}}));
    notify(`Produit retiré de ${addr}`);
  };

  const updateQty = (addr,eanVal,val) => {
    const q = Math.max(0,Number(val)||0);
    if (q===0) return rmProd(addr,eanVal);
    setAddresses(prev=>({...prev,[addr]:{...prev[addr],products:prev[addr].products.map(p=>p.ean===eanVal?{...p,qty:q}:p)}}));
  };

  const handleScanResult = (scannedEan) => {
    setEan(scannedEan);
    notify(`Code scanné : ${scannedEan}`);
  };

  return (
    <div className="anim" style={{ display:"grid", gridTemplateColumns:"1fr 360px", gap:22, alignItems:"start" }}>
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:"-.03em", color:C.navy }}>Adressage</h1>
            <p style={{ color:C.grey, fontSize:14, fontWeight:600, marginTop:4 }}>{used} emplacement{used>1?"s":""} occupé{used>1?"s":""} sur {keys.length}</p>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", justifyContent:"flex-end" }}>
            <button className="btn-outline" onClick={onImport}><Ic d={D.upload} size={15} sw={2}/>Importer Excel</button>
            {[["all","Tous"],["used","Occupés"],["free","Libres"]].map(([id,l])=>(
              <button key={id} className={`btn-outline ${filter===id?"active":""}`} onClick={()=>setFilter(id)}>{l}</button>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:16, marginBottom:14, fontSize:12, fontWeight:700, color:C.grey }}>
          {[["#dde0ee","Libre"],["#eef0f9","Occupé"],["#1a2b6b","Sélectionné"]].map(([bgc,l],i)=>(
            <span key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ width:12, height:12, background:bgc, borderRadius:3, display:"inline-block", border:i===1?"2px solid #1a2b6b":"none" }} />{l}
            </span>
          ))}
        </div>

        <div className="addr-grid">
          {shown.map(key => {
            const filled = addresses[key].products.length>0;
            return (
              <div key={key} className={`addr-cell ${filled?"filled":""} ${sel===key?"sel":""}`}
                onClick={()=>setSel(key===sel?null:key)}>
                <div>{key}</div>
                {filled && <div style={{ fontSize:10, marginTop:2, opacity:.8 }}>{addresses[key].products.length} art.</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position:"sticky", top:84 }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
          <div className="card" style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:C.navy }}>{used}</div>
            <div style={{ fontSize:10, fontWeight:800, color:C.grey, letterSpacing:".07em", marginTop:2 }}>OCCUPÉS</div>
          </div>
          <div className="card" style={{ padding:16, textAlign:"center" }}>
            <div style={{ fontSize:26, fontWeight:900, color:C.grey }}>{keys.length-used}</div>
            <div style={{ fontSize:10, fontWeight:800, color:C.grey, letterSpacing:".07em", marginTop:2 }}>LIBRES</div>
          </div>
        </div>

        {!sel ? (
          <div className="card" style={{ padding:"42px 20px", textAlign:"center" }}>
            <div style={{ color:C.greyL, marginBottom:12 }}><Ic d={D.map} size={42} sw={1.4}/></div>
            <p style={{ color:C.greyL, fontWeight:700, fontSize:14 }}>Sélectionnez un emplacement</p>
            <p style={{ color:C.greyL, fontWeight:600, fontSize:12, marginTop:6 }}>Cliquez sur une case de la grille</p>
          </div>
        ) : (
          <div className="card anim" style={{ padding:22, borderColor:C.navy, borderWidth:2 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
              <div>
                <div style={{ background:`linear-gradient(135deg,${C.navy},${C.navyL})`, color:"white", fontWeight:900, fontSize:22, borderRadius:10, padding:"4px 14px", display:"inline-block" }}>{sel}</div>
                <div style={{ color:C.grey, fontSize:12, fontWeight:700, marginTop:8 }}>
                  {selData.products.length} produit{selData.products.length!==1?"s":""} · {selData.products.reduce((s,p)=>s+p.qty,0)} unités
                </div>
              </div>
              <button onClick={()=>setSel(null)} style={{ background:"none", border:"none", cursor:"pointer", color:C.greyL, padding:4 }}>
                <Ic d={D.x} size={17} sw={2.5}/>
              </button>
            </div>

            <div style={{ marginBottom:16, maxHeight:320, overflowY:"auto" }}>
              {selData.products.length===0 ? (
                <div style={{ textAlign:"center", padding:"20px 0", color:C.greyL, fontWeight:700, fontSize:13, border:`2px dashed ${C.border}`, borderRadius:10 }}>Emplacement vide</div>
              ) : selData.products.map(({ean:e,qty:q})=>{
                const prod=products.find(p=>p.ean===e);
                return (
                  <div key={e} style={{ padding:"10px 12px", marginBottom:8, background:C.light, borderRadius:10, border:`1.5px solid ${C.border}` }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                      <div>
                        <div style={{ fontSize:14, fontWeight:800, color:C.navy }}>{prod?.name||"Inconnu"}</div>
                        <div style={{ fontSize:11, color:C.navyL, fontWeight:700, marginTop:2 }}>{e}</div>
                      </div>
                      <button className="btn-danger" onClick={()=>rmProd(sel,e)}><Ic d={D.trash} size={13} sw={2}/></button>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:C.grey, letterSpacing:".05em" }}>QUANTITÉ</span>
                      <button className="qty-btn-minus" onClick={()=>updateQty(sel,e,q-1)}>−</button>
                      <input className="qty-input" value={q} type="number" min="1"
                        onChange={ev=>updateQty(sel,e,ev.target.value)}
                        onBlur={ev=>{ if(!ev.target.value) updateQty(sel,e,1); }} />
                      <button className="qty-btn-plus" onClick={()=>updateQty(sel,e,q+1)}>+</button>
                      <span style={{ fontSize:11, color:C.grey, fontWeight:600 }}>{prod?.unit||"pcs"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop:`1.5px solid ${C.border}`, paddingTop:16 }}>
              <p style={{ fontSize:11, fontWeight:900, color:C.grey, letterSpacing:".08em", marginBottom:10 }}>AJOUTER UN PRODUIT</p>
              <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                <input className="field field-sm" placeholder="EAN…" value={ean}
                  onChange={ev=>setEan(ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&addProd()} style={{ flex:1 }} />
                <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
                  <span style={{ fontSize:11, fontWeight:800, color:C.grey }}>Qté</span>
                  <input className="qty-input field-sm" type="number" min="1" style={{ width:56 }} value={qty} onChange={ev=>setQty(ev.target.value)} />
                </div>
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn-main" style={{ flex:1, justifyContent:"center" }} onClick={addProd}>
                  <Ic d={D.plus} size={15} sw={2.5}/>Ajouter
                </button>
                {/* Bouton scanner caméra */}
                <button className="btn-scan" onClick={() => openScanner(handleScanResult)}>
                  <Ic d={D.camera} size={14} sw={2}/>Scan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

