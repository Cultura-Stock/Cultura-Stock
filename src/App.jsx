import { useState, useRef, useEffect, useCallback } from "react";
import * as XLSX from "xlsx";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { createClient } from "@supabase/supabase-js";

// ── Supabase ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://xzsfzxvhhpmrgnjrtriu.supabase.co";
const SUPABASE_KEY = "sb_publishable_1GWB1OcUDY2OwXNmKfzbuw_Oxh7G7KD";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

const Ic = ({ d, size = 20, sw = 1.8, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d={d} />
  </svg>
);

const D = {
  barcode: "M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M3 3h4M17 3h4M3 21h4M17 21h4",
  pkg:     "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  map:     "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  srch:    "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6",
  check:   "M20 6L9 17l-5-5",
  x:       "M18 6L6 18M6 6l12 12",
  upload:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12",
  camera:  "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2zM12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
};

const C = {
  navy:"#1a2b6b", navyD:"#14205a", navyL:"#2540a0",
  white:"#ffffff", offwhite:"#f4f5f8", light:"#eef0f9",
  border:"#dde0ee", grey:"#8b92b8", greyL:"#c5cadf",
  green:"#27ae60", red:"#e74c3c",
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
  * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
  html,body { height:100%; }
  body { font-family:'Nunito',sans-serif; background:#f4f5f8; color:#1a2b6b; overflow-x:hidden; }
  input,button { font-family:'Nunito',sans-serif; }

  .btn-main { background:linear-gradient(135deg,#1a2b6b,#2540a0); color:white; border:none; border-radius:12px; padding:13px 20px; font-weight:700; font-size:15px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; box-shadow:0 4px 14px rgba(26,43,107,.3); width:100%; }
  .btn-outline { background:white; color:#1a2b6b; border:2px solid #dde0ee; border-radius:10px; padding:10px 14px; font-weight:700; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; }
  .btn-outline.active { background:#1a2b6b; color:white; border-color:#1a2b6b; }
  .btn-danger { background:white; border:1.5px solid #fcd4d0; border-radius:8px; color:#e74c3c; cursor:pointer; padding:8px; display:flex; align-items:center; }
  .btn-scan { background:linear-gradient(135deg,#1a2b6b,#2540a0); color:white; border:none; border-radius:10px; padding:10px 16px; font-weight:700; font-size:14px; cursor:pointer; display:flex; align-items:center; gap:6px; white-space:nowrap; }

  .field { background:white; border:2px solid #dde0ee; color:#1a2b6b; border-radius:12px; padding:13px 16px; font-size:15px; font-weight:600; outline:none; width:100%; }
  .field:focus { border-color:#1a2b6b; box-shadow:0 0 0 3px rgba(26,43,107,.1); }
  .field::placeholder { color:#c5cadf; font-weight:500; }

  .card { background:white; border-radius:16px; box-shadow:0 2px 14px rgba(26,43,107,.07); border:1.5px solid #eaecf5; }

  .bdg { font-size:11px; font-weight:800; padding:3px 9px; border-radius:20px; letter-spacing:.04em; white-space:nowrap; }
  .b-navy  { background:#eef0f9; color:#1a2b6b; }
  .b-green { background:#e6f9ee; color:#1a7a3e; }
  .b-red   { background:#fdecea; color:#c0392b; }

  .anim { animation:aup .22s ease; }
  @keyframes aup { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

  .notif-box { position:fixed; top:12px; left:12px; right:12px; z-index:9999; background:white; border-radius:14px; padding:14px 18px; font-size:14px; font-weight:700; display:flex; align-items:center; gap:10px; box-shadow:0 8px 30px rgba(26,43,107,.2); animation:aup .3s ease; border-left:4px solid; }
  .n-ok  { border-color:#27ae60; color:#1a7a3e; }
  .n-err { border-color:#e74c3c; color:#c0392b; }

  .addr-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(72px,1fr)); gap:7px; }
  .addr-cell { background:white; border:2px solid #dde0ee; border-radius:10px; padding:9px 4px; text-align:center; cursor:pointer; font-size:11px; font-weight:800; color:#8b92b8; user-select:none; }
  .addr-cell.filled { border-color:#1a2b6b; color:#1a2b6b; background:#eef0f9; }
  .addr-cell.sel    { background:#1a2b6b; color:white; border-color:#1a2b6b; }

  .qty-btn-minus { background:#eef0f9; border:none; border-radius:6px; width:34px; height:34px; cursor:pointer; font-weight:900; font-size:20px; color:#1a2b6b; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .qty-btn-plus  { background:#1a2b6b; border:none; border-radius:6px; width:34px; height:34px; cursor:pointer; font-weight:900; font-size:20px; color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .qty-input { width:56px; background:#f7f8fd; border:2px solid #dde0ee; border-radius:8px; padding:6px 8px; font-size:14px; font-weight:700; color:#1a2b6b; outline:none; text-align:center; font-family:'Nunito',sans-serif; }
  .qty-input:focus { border-color:#1a2b6b; }

  .modal-bg { position:fixed; inset:0; background:rgba(10,15,40,.55); display:flex; align-items:flex-end; justify-content:center; z-index:500; }
  .modal { background:white; border-radius:20px 20px 0 0; padding:24px 20px 36px; width:100%; max-height:90vh; overflow-y:auto; animation:slideUp .25s ease; }
  @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
  .drop-zone { border:2.5px dashed #c5cadf; border-radius:14px; padding:28px 16px; text-align:center; cursor:pointer; }
  .drop-zone.over { border-color:#1a2b6b; background:#eef0f9; }

  .scanner-modal { position:fixed; inset:0; background:black; z-index:1000; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; }
  .scanner-wrap { position:relative; width:100%; max-width:420px; }
  .scanner-wrap video { width:100%; display:block; }
  .scanner-line { position:absolute; left:10%; right:10%; height:3px; background:linear-gradient(90deg,transparent,white,transparent); animation:scanline 2s ease-in-out infinite; }
  @keyframes scanline { 0%,100%{top:15%} 50%{top:80%} }
  .sc { position:absolute; width:30px; height:30px; border-color:white; border-style:solid; }
  .sc-tl { top:8px; left:8px; border-width:3px 0 0 3px; border-radius:3px 0 0 0; }
  .sc-tr { top:8px; right:8px; border-width:3px 3px 0 0; border-radius:0 3px 0 0; }
  .sc-bl { bottom:8px; left:8px; border-width:0 0 3px 3px; border-radius:0 0 0 3px; }
  .sc-br { bottom:8px; right:8px; border-width:0 3px 3px 0; border-radius:0 0 3px 0; }

  .bottom-nav { position:fixed; bottom:0; left:0; right:0; background:white; border-top:1.5px solid #eaecf5; display:flex; z-index:200; padding-bottom:env(safe-area-inset-bottom); }
  .nav-btn { flex:1; padding:10px 8px 12px; display:flex; flex-direction:column; align-items:center; gap:3px; border:none; background:none; cursor:pointer; font-family:'Nunito',sans-serif; font-size:11px; font-weight:700; color:#c5cadf; }
  .nav-btn.active { color:#1a2b6b; }

  .detail-sheet { position:fixed; inset:0; z-index:300; background:rgba(10,15,40,.5); display:flex; flex-direction:column; justify-content:flex-end; }
  .detail-content { background:white; border-radius:20px 20px 0 0; padding:20px 20px 36px; max-height:88vh; overflow-y:auto; animation:slideUp .25s ease; }
  .handle { width:40px; height:4px; background:#dde0ee; border-radius:2px; margin:0 auto 18px; }

  .header { background:linear-gradient(135deg,#1a2b6b,#14205a); padding:0 16px; height:56px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:100; }
  .main-wrap { padding:16px; padding-bottom:84px; }

  /* Loading spinner */
  .spinner { width:36px; height:36px; border:3px solid #eef0f9; border-top:3px solid #1a2b6b; border-radius:50%; animation:spin .8s linear infinite; margin:0 auto; }
  @keyframes spin { to{transform:rotate(360deg)} }
`;

// ── Scanner Caméra ─────────────────────────────────────────────────────────────
function CameraScanner({ onScan, onClose }) {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    const reader = new BrowserMultiFormatReader();
    reader.decodeFromVideoDevice(null, videoRef.current, (result) => {
      if (!active || !result) return;
      active = false; onScan(result.getText());
    }).catch(() => setError("Impossible d'accéder à la caméra."));
    return () => { active = false; try { reader.reset(); } catch {} };
  }, [onScan]);

  return (
    <div className="scanner-modal">
      <div style={{textAlign:"center",padding:"0 20px 24px"}}>
        <div style={{color:"white",fontWeight:900,fontSize:20,marginBottom:6}}>📷 Scanner un code-barres</div>
        <div style={{color:"rgba(255,255,255,.6)",fontSize:14}}>Pointez la caméra vers le code-barres</div>
      </div>
      {error ? (
        <div style={{background:"white",borderRadius:16,padding:24,margin:20,textAlign:"center",width:"calc(100% - 40px)"}}>
          <div style={{color:C.red,fontWeight:700,marginBottom:16}}>{error}</div>
          <button className="btn-main" onClick={onClose}>Fermer</button>
        </div>
      ) : (
        <div className="scanner-wrap">
          <video ref={videoRef} autoPlay playsInline muted/>
          <div className="sc sc-tl"/><div className="sc sc-tr"/>
          <div className="sc sc-bl"/><div className="sc sc-br"/>
          <div className="scanner-line"/>
        </div>
      )}
      <button onClick={onClose} style={{marginTop:28,background:"rgba(255,255,255,.15)",border:"2px solid rgba(255,255,255,.3)",borderRadius:14,padding:"14px 48px",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:16,cursor:"pointer"}}>
        Annuler
      </button>
    </div>
  );
}

// ── Parsers Excel ──────────────────────────────────────────────────────────────
function parseFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => { try { const wb=XLSX.read(e.target.result,{type:"array"}); res(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:""})); } catch(err){rej(err);} };
    r.onerror = rej; r.readAsArrayBuffer(file);
  });
}
function normalizeRow(row) { const n={}; Object.keys(row).forEach(k=>{ const key = k.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]/g,""); n[key]=row[k]; }); return n; }
async function parseProducts(file) {
  const rows=await parseFile(file); const products=[],errors=[];
  rows.forEach((row,i)=>{ const r=normalizeRow(row); const ean=String(r.ean||r.codebarres||r.barcode||"").trim(); const name=String(r.nomduproduit||r.nom||r.designation||r.name||r.libelle||"").trim(); if(!ean||!name){errors.push(`Ligne ${i+2} ignorée`);return;} products.push({ean,name,category:String(r.categorie||r.category||"").trim()||"—",stock:Number(r.stock||r.quantite||0)||0,unit:String(r.unite||r.unit||"pcs").trim()||"pcs"}); });
  return {products,errors};
}
async function parseAddresses(file) {
  const rows=await parseFile(file); const addrMap={},errors=[];
  rows.forEach((row,i)=>{ const r=normalizeRow(row); const addr=String(r.adresse||r.address||r.emplacement||"").trim(); const ean=String(r.eanproduit||r.ean||r.codebarres||"").trim(); const qty=Number(r.quantite||r.qty||r.stock||1)||1; if(!addr||!ean){errors.push(`Ligne ${i+2} ignorée`);return;} if(!addrMap[addr])addrMap[addr]=[]; if(!addrMap[addr].find(p=>p.ean===ean))addrMap[addr].push({ean,qty}); });
  return {addrMap,errors};
}

// ── Modal Import ───────────────────────────────────────────────────────────────
function ImportModal({ type, onClose, onDone }) {
  const [file,setFile]=useState(null); const [preview,setPreview]=useState(null); const [errors,setErrors]=useState([]); const [loading,setLoading]=useState(false); const [mode,setMode]=useState("replace"); const [dragging,setDragging]=useState(false); const inputRef=useRef(); const isProducts=type==="products";
  const process=async f=>{ if(!f)return; setFile(f);setLoading(true);setErrors([]); try{ if(isProducts){const{products:p,errors:e}=await parseProducts(f);setPreview(p);setErrors(e);}else{const{addrMap,errors:e}=await parseAddresses(f);setPreview(addrMap);setErrors(e);} }catch{setErrors(["Erreur de lecture."]);} setLoading(false); };
  const count=isProducts?(preview?.length??0):(preview?Object.keys(preview).length:0);
  return (
    <div className="modal-bg" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div style={{width:40,height:4,background:C.border,borderRadius:2,margin:"0 auto 20px"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:900,fontSize:18,color:C.navy}}>Importer {isProducts?"produits":"adresses"}</div>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:C.greyL}}><Ic d={D.x} size={22} sw={2.5}/></button>
        </div>
        <div style={{background:C.light,borderRadius:12,padding:"10px 14px",marginBottom:16,border:`1.5px solid ${C.border}`}}>
          <div style={{fontWeight:800,fontSize:10,color:C.grey,letterSpacing:".07em",marginBottom:8}}>COLONNES ATTENDUES</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {(isProducts?[["EAN","obl."],["Nom","obl."],["Catégorie","opt."],["Stock","opt."],["Unité","opt."]]:[["Adresse","obl."],["EAN","obl."],["Quantité","opt."]]).map(([col,req])=>(
              <div key={col} style={{background:"white",borderRadius:8,padding:"6px 10px",border:`1.5px solid ${C.border}`,textAlign:"center"}}>
                <div style={{fontWeight:800,fontSize:12,color:C.navy}}>{col}</div>
                <div style={{fontSize:10,color:req==="obl."?C.red:C.green,fontWeight:700}}>{req}</div>
              </div>
            ))}
          </div>
        </div>
        {!file&&(
          <div className={`drop-zone ${dragging?"over":""}`} onClick={()=>inputRef.current.click()} onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);process(e.dataTransfer.files[0])}}>
            <Ic d={D.upload} size={32} sw={1.5} style={{color:C.greyL,marginBottom:10}}/>
            <div style={{fontWeight:800,fontSize:15,color:C.navy,marginBottom:6}}>Glissez votre fichier ici</div>
            <div style={{fontSize:13,color:C.grey}}>ou <span style={{color:C.navy,textDecoration:"underline",fontWeight:700}}>parcourir</span></div>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" style={{display:"none"}} onChange={e=>process(e.target.files[0])}/>
          </div>
        )}
        {loading&&<div style={{textAlign:"center",padding:"20px 0",color:C.grey,fontWeight:700}}>⏳ Lecture du fichier…</div>}
        {errors.length>0&&<div style={{background:"#fdecea",borderRadius:10,padding:"10px 14px",marginTop:12,border:"1.5px solid #fcd4d0"}}>{errors.map((e,i)=><div key={i} style={{fontSize:12,color:C.red,fontWeight:600}}>{e}</div>)}</div>}
        {preview&&!loading&&(
          <div className="anim">
            <div style={{background:"#e6f9ee",borderRadius:10,padding:"10px 14px",marginTop:12,border:"1.5px solid #b8edcc",marginBottom:14}}>
              <span style={{fontWeight:800,fontSize:13,color:"#1a7a3e"}}>✅ {count} {isProducts?"produit":"emplacement"}{count>1?"s":""} prêts à importer</span>
            </div>
            <div style={{marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:11,color:C.grey,letterSpacing:".07em",marginBottom:8}}>MODE D'IMPORT</div>
              <div style={{display:"flex",gap:8}}>
                {[["replace","🔄 Remplacer","Efface l'existant"],["merge","➕ Fusionner","Ajoute sans supprimer"]].map(([id,label,desc])=>(
                  <div key={id} onClick={()=>setMode(id)} style={{flex:1,padding:"10px 12px",borderRadius:12,cursor:"pointer",border:`2px solid ${mode===id?C.navy:C.border}`,background:mode===id?C.light:"white"}}>
                    <div style={{fontWeight:800,fontSize:13,color:C.navy}}>{label}</div>
                    <div style={{fontSize:11,color:C.grey,fontWeight:600,marginTop:2}}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{display:"flex",gap:8}}>
              <button className="btn-main" onClick={()=>onDone(preview,mode)} style={{flex:1}}><Ic d={D.check} size={15} sw={2.5}/>Confirmer</button>
              <button className="btn-outline" onClick={()=>{setFile(null);setPreview(null);setErrors([]);}}>Changer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── APP ────────────────────────────────────────────────────────────────────────
export default function StockApp() {
  const [tab,setTab]=useState("products");
  const [products,setProducts]=useState([]);
  const [addresses,setAddresses]=useState({});
  const [notif,setNotif]=useState(null);
  const [importModal,setImportModal]=useState(null);
  const [scanner,setScanner]=useState(null);
  const [loading,setLoading]=useState(true);

  const notify=(msg,type="success")=>{ setNotif({msg,type}); setTimeout(()=>setNotif(null),3500); };

  // ── Chargement initial depuis Supabase ──────────────────────────────────────
  useEffect(()=>{ loadAll(); },[]);

  const loadAll = async () => {
    setLoading(true);
    try {
      // Charger tous les produits avec pagination (limite Supabase = 1000 par requête)
      let allProds = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data, error } = await sb.from("products").select("*").order("name").range(from, from + PAGE - 1);
        if (error) throw error;
        allProds = [...allProds, ...(data || [])];
        if (!data || data.length < PAGE) break;
        from += PAGE;
      }
      setProducts(allProds);

      // Charger toutes les adresses avec pagination
      let allAddrs = [];
      from = 0;
      while (true) {
        const { data, error } = await sb.from("addresses").select("*").range(from, from + PAGE - 1);
        if (error) throw error;
        allAddrs = [...allAddrs, ...(data || [])];
        if (!data || data.length < PAGE) break;
        from += PAGE;
      }

      // Reconstruire la map d'adresses
      const addrMap = {};
      allAddrs.forEach(({ address, ean, qty }) => {
        if (!addrMap[address]) addrMap[address] = { products: [] };
        addrMap[address].products.push({ ean, qty });
      });
      setAddresses(addrMap);
    } catch(err) {
      notify("Erreur de connexion à la base de données", "error");
    }
    setLoading(false);
  };

  // ── Import produits → Supabase ──────────────────────────────────────────────
  const handleImportProducts = async (data, mode) => {
    setImportModal(null);
    notify("⏳ Import en cours…");
    try {
      if (mode === "replace") {
        await sb.from("products").delete().neq("id", 0);
      }
      // Dédupliquer par EAN (garder le dernier)
      const deduped = Object.values(
        data.reduce((acc, p) => { acc[p.ean] = p; return acc; }, {})
      );
      // Import par lots de 500 pour les gros fichiers
      const BATCH = 500;
      for (let i = 0; i < deduped.length; i += BATCH) {
        const batch = deduped.slice(i, i + BATCH).map(p => ({
          ean: p.ean, name: p.name, category: p.category,
          stock: p.stock, unit: p.unit
        }));
        const { error } = await sb.from("products").upsert(batch, { onConflict: "ean" });
        if (error) throw error;
      }
      await loadAll();
      notify(`✅ ${data.length} produits importés avec succès !`);
    } catch(err) {
      notify("Erreur lors de l'import : " + err.message, "error");
    }
  };

  // ── Import adresses → Supabase ──────────────────────────────────────────────
  const handleImportAddresses = async (addrMap, mode) => {
    setImportModal(null);
    notify("⏳ Import en cours…");
    try {
      if (mode === "replace") {
        await sb.from("addresses").delete().neq("id", 0);
      }
      // Dédupliquer par address+ean
      const rowMap = {};
      Object.entries(addrMap).forEach(([address, prods]) => {
        prods.forEach(({ ean, qty }) => { rowMap[address+"__"+ean] = { address, ean, qty }; });
      });
      const rows = Object.values(rowMap);
      const BATCH = 500;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await sb.from("addresses").upsert(rows.slice(i, i + BATCH), { onConflict: "address,ean" });
        if (error) throw error;
      }
      await loadAll();
      notify(`✅ ${Object.keys(addrMap).length} emplacements importés !`);
    } catch(err) {
      notify("Erreur lors de l'import : " + err.message, "error");
    }
  };

  const usedSlots = Object.keys(addresses).length;
  const openScanner = useCallback(onScan => setScanner({ onScan }), []);
  const handleScan = useCallback(ean => { if(scanner?.onScan) scanner.onScan(ean); setScanner(null); }, [scanner]);

  return (
    <div style={{minHeight:"100vh",background:C.offwhite}}>
      <style>{CSS}</style>

      {notif&&<div className={`notif-box ${notif.type==="success"?"n-ok":"n-err"}`}><Ic d={notif.type==="success"?D.check:D.x} size={16} sw={2.5}/>{notif.msg}</div>}
      {importModal&&<ImportModal type={importModal} onClose={()=>setImportModal(null)} onDone={importModal==="products"?handleImportProducts:handleImportAddresses}/>}
      {scanner&&<CameraScanner onScan={handleScan} onClose={()=>setScanner(null)}/>}

      <header className="header">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{background:"white",borderRadius:8,width:34,height:34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ic d={D.barcode} size={18} sw={2} style={{color:C.navy}}/>
          </div>
          <div>
            <div style={{fontWeight:900,fontSize:18,color:"white",lineHeight:1}}>cultura<span style={{opacity:.4}}>·</span>stock</div>
            <div style={{fontSize:9,color:"rgba(255,255,255,.45)",letterSpacing:".1em",fontWeight:700}}>GESTION D'INVENTAIRE</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{background:"rgba(255,255,255,.12)",borderRadius:20,padding:"5px 12px",fontSize:11,color:"rgba(255,255,255,.7)",fontWeight:700}}>
            {products.length} réf.
          </div>
          <button onClick={loadAll} style={{background:"rgba(255,255,255,.12)",border:"none",borderRadius:10,padding:"7px 10px",color:"white",cursor:"pointer",display:"flex",alignItems:"center"}}>
            <Ic d={D.refresh} size={15} sw={2}/>
          </button>
          <button onClick={()=>setImportModal(tab)} style={{background:"rgba(255,255,255,.15)",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:10,padding:"7px 12px",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5}}>
            <Ic d={D.upload} size={14} sw={2}/> Excel
          </button>
        </div>
      </header>

      <div className="main-wrap">
        {loading ? (
          <div style={{paddingTop:80,textAlign:"center"}}>
            <div className="spinner" style={{marginBottom:20}}/>
            <div style={{color:C.grey,fontWeight:700,fontSize:15}}>Chargement des données…</div>
          </div>
        ) : tab==="products"
          ? <Products products={products} setProducts={setProducts} addresses={addresses} notify={notify} onImport={()=>setImportModal("products")} openScanner={openScanner} sb={sb} loadAll={loadAll}/>
          : <Addresses products={products} addresses={addresses} setAddresses={setAddresses} notify={notify} onImport={()=>setImportModal("addresses")} openScanner={openScanner} sb={sb} loadAll={loadAll}/>
        }
      </div>

      <nav className="bottom-nav">
        {[["products","Produits",D.pkg],["addresses","Adressage",D.map]].map(([id,label,icon])=>(
          <button key={id} className={`nav-btn ${tab===id?"active":""}`} onClick={()=>setTab(id)}>
            <Ic d={icon} size={24} sw={tab===id?2.5:1.8} style={{color:tab===id?C.navy:C.greyL}}/>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── VUE PRODUITS ───────────────────────────────────────────────────────────────
function Products({ products, setProducts, addresses, notify, onImport, openScanner, sb, loadAll }) {
  const [q,setQ]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [form,setForm]=useState({ean:"",name:"",category:"",stock:0,unit:"pcs"});

  const addrMap={};
  Object.entries(addresses).forEach(([addr,d])=>d.products.forEach(({ean})=>{if(!addrMap[ean])addrMap[ean]=[];addrMap[ean].push(addr);}));
  const list=products.filter(p=>p.ean.includes(q)||p.name.toLowerCase().includes(q.toLowerCase())||p.category.toLowerCase().includes(q.toLowerCase()));

  const add = async () => {
    if(!form.ean||!form.name) return notify("EAN et nom requis","error");
    const { error } = await sb.from("products").insert([{ ean:form.ean, name:form.name, category:form.category||"—", stock:Number(form.stock)||0, unit:form.unit||"pcs" }]);
    if(error) return notify("Erreur : " + (error.message.includes("duplicate")?"Cet EAN existe déjà":error.message),"error");
    setForm({ean:"",name:"",category:"",stock:0,unit:"pcs"}); setShowForm(false);
    notify(`"${form.name}" ajouté`); loadAll();
  };

  return (
    <div className="anim">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,color:C.navy}}>Produits</h1>
          <p style={{color:C.grey,fontSize:13,fontWeight:600,marginTop:2}}>{products.length} références</p>
        </div>
        <button className="btn-outline" onClick={()=>setShowForm(v=>!v)}><Ic d={D.plus} size={16} sw={2.5}/> Ajouter</button>
      </div>

      {showForm&&(
        <div className="card anim" style={{padding:16,marginBottom:14,borderColor:C.navy,borderWidth:2}}>
          <div style={{fontWeight:900,fontSize:11,color:C.navy,letterSpacing:".08em",marginBottom:12}}>NOUVEAU PRODUIT</div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:12}}>
            <input className="field" placeholder="EAN *" value={form.ean} onChange={e=>setForm({...form,ean:e.target.value})}/>
            <input className="field" placeholder="Désignation *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 80px 80px",gap:8}}>
              <input className="field" placeholder="Catégorie" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
              <input className="field" type="number" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
              <input className="field" placeholder="Unité" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn-main" onClick={add} style={{flex:1}}><Ic d={D.check} size={15} sw={2.5}/>Ajouter</button>
            <button className="btn-outline" onClick={()=>setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{position:"relative",flex:1}}>
          <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:C.greyL}}><Ic d={D.srch} size={18} sw={2}/></div>
          <input className="field" style={{paddingLeft:44}} placeholder="EAN, nom, catégorie…" value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <button className="btn-scan" onClick={()=>openScanner(ean=>{setQ(ean);notify(`Scanné : ${ean}`)})}>
          <Ic d={D.camera} size={16} sw={2}/>Scan
        </button>
        {q&&<button className="btn-outline" style={{padding:"10px 12px"}} onClick={()=>setQ("")}><Ic d={D.x} size={15} sw={2.5}/></button>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {list.length===0&&(
          <div className="card" style={{padding:"40px 20px",textAlign:"center",color:C.greyL}}>
            <Ic d={D.srch} size={36} sw={1.5}/><br/><br/>
            <span style={{fontWeight:700,fontSize:14}}>{q?"Aucun produit trouvé":"Aucun produit — importez votre catalogue Excel"}</span>
          </div>
        )}
        {list.slice(0,100).map(p=>{
          const addrs=addrMap[p.ean]||[];
          return (
            <div key={p.ean} className="card" style={{padding:"14px 16px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0,paddingRight:8}}>
                  <div style={{fontWeight:800,fontSize:15,color:C.navy,marginBottom:2}}>{p.name}</div>
                  <div style={{fontSize:12,color:C.navyL,fontWeight:700,fontFamily:"monospace"}}>{p.ean}</div>
                </div>
                <span className={`bdg ${p.stock>20?"b-green":"b-red"}`}>{p.stock} {p.unit}</span>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:4}}>
                <span className="bdg b-navy">{p.category}</span>
                <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                  {addrs.length===0?<span style={{color:C.greyL,fontSize:12,fontWeight:600}}>Non adressé</span>:addrs.map(a=><span key={a} className="bdg b-navy">{a}</span>)}
                </div>
              </div>
            </div>
          );
        })}
        {list.length>100&&<div style={{textAlign:"center",padding:"12px",color:C.grey,fontWeight:700,fontSize:13}}>… {list.length-100} produits de plus — affinez la recherche</div>}
      </div>
    </div>
  );
}

// ── VUE ADRESSAGE ──────────────────────────────────────────────────────────────
function Addresses({ products, addresses, setAddresses, notify, onImport, openScanner, sb, loadAll }) {
  const [sel,setSel]=useState(null);
  const [ean,setEan]=useState("");
  const [qty,setQty]=useState(1);
  const [filter,setFilter]=useState("all");

  const keys=Object.keys(addresses).sort();
  const used=keys.length;
  const allKeys=[...new Set([...keys,...Array.from({length:99},(_,i)=>`100-${String(i+1).padStart(2,"0")}`)])].sort();
  const shown=filter==="all"?allKeys:filter==="used"?keys:allKeys.filter(k=>!addresses[k]||addresses[k].products.length===0);
  const selData=sel?(addresses[sel]||{products:[]}):{products:[]};

  const addProd = async () => {
    if(!sel||!ean.trim()) return;
    const prod=products.find(p=>p.ean===ean.trim());
    if(!prod) return notify(`EAN "${ean}" introuvable`,"error");
    if(selData.products.find(p=>p.ean===ean.trim())) return notify("Produit déjà présent","error");
    const { error } = await sb.from("addresses").insert([{ address:sel, ean:ean.trim(), qty:Number(qty)||1 }]);
    if(error) return notify("Erreur : "+error.message,"error");
    setEan(""); setQty(1); notify(`"${prod.name}" ajouté à ${sel}`); loadAll();
  };

  const rmProd = async (addr,e) => {
    await sb.from("addresses").delete().eq("address",addr).eq("ean",e);
    notify("Produit retiré"); loadAll();
  };

  const updateQty = async (addr,eanVal,val) => {
    const q=Math.max(0,Number(val)||0);
    if(q===0) return rmProd(addr,eanVal);
    await sb.from("addresses").update({qty:q}).eq("address",addr).eq("ean",eanVal);
    setAddresses(prev=>({...prev,[addr]:{...prev[addr],products:prev[addr].products.map(p=>p.ean===eanVal?{...p,qty:q}:p)}}));
  };

  return (
    <div className="anim">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,color:C.navy}}>Adressage</h1>
          <p style={{color:C.grey,fontSize:13,fontWeight:600,marginTop:2}}>{used} emplacements occupés</p>
        </div>
        <button className="btn-outline" onClick={onImport} style={{padding:"10px 12px"}}><Ic d={D.upload} size={15} sw={2}/>Excel</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
        <div className="card" style={{padding:"12px 16px",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color:C.navy}}>{used}</div>
          <div style={{fontSize:10,fontWeight:800,color:C.grey,letterSpacing:".07em"}}>OCCUPÉS</div>
        </div>
        <div className="card" style={{padding:"12px 16px",textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:900,color:C.greyL}}>{99-used}</div>
          <div style={{fontSize:10,fontWeight:800,color:C.grey,letterSpacing:".07em"}}>LIBRES</div>
        </div>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:12}}>
        {[["all","Tous"],["used","Occupés"],["free","Libres"]].map(([id,l])=>(
          <button key={id} className={`btn-outline ${filter===id?"active":""}`} onClick={()=>setFilter(id)} style={{flex:1,justifyContent:"center",padding:"9px 4px",fontSize:12}}>{l}</button>
        ))}
      </div>

      <div className="addr-grid">
        {shown.map(key=>{
          const filled=addresses[key]&&addresses[key].products.length>0;
          return (
            <div key={key} className={`addr-cell ${filled?"filled":""} ${sel===key?"sel":""}`} onClick={()=>setSel(key===sel?null:key)}>
              <div>{key}</div>
              {filled&&<div style={{fontSize:9,marginTop:2,opacity:.8}}>{addresses[key].products.length}p</div>}
            </div>
          );
        })}
      </div>

      {sel&&(
        <div className="detail-sheet" onClick={e=>e.target===e.currentTarget&&setSel(null)}>
          <div className="detail-content">
            <div className="handle"/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
              <div>
                <div style={{background:`linear-gradient(135deg,${C.navy},${C.navyL})`,color:"white",fontWeight:900,fontSize:20,borderRadius:10,padding:"4px 14px",display:"inline-block"}}>{sel}</div>
                <div style={{color:C.grey,fontSize:12,fontWeight:700,marginTop:6}}>
                  {selData.products.length} produit{selData.products.length!==1?"s":""} · {selData.products.reduce((s,p)=>s+p.qty,0)} unités
                </div>
              </div>
              <button onClick={()=>setSel(null)} style={{background:"none",border:"none",cursor:"pointer",color:C.greyL}}><Ic d={D.x} size={22} sw={2.5}/></button>
            </div>

            <div style={{marginBottom:14}}>
              {selData.products.length===0?(
                <div style={{textAlign:"center",padding:"20px",color:C.greyL,fontWeight:700,fontSize:13,border:`2px dashed ${C.border}`,borderRadius:10}}>Emplacement vide</div>
              ):selData.products.map(({ean:e,qty:q})=>{
                const prod=products.find(p=>p.ean===e);
                return (
                  <div key={e} style={{padding:"12px",marginBottom:8,background:C.light,borderRadius:12,border:`1.5px solid ${C.border}`}}>
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                      <div style={{flex:1,minWidth:0,paddingRight:8}}>
                        <div style={{fontSize:15,fontWeight:800,color:C.navy}}>{prod?.name||"Inconnu"}</div>
                        <div style={{fontSize:11,color:C.navyL,fontWeight:700,marginTop:2,fontFamily:"monospace"}}>{e}</div>
                      </div>
                      <button className="btn-danger" onClick={()=>rmProd(sel,e)}><Ic d={D.trash} size={15} sw={2}/></button>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:11,fontWeight:800,color:C.grey}}>QTÉ</span>
                      <button className="qty-btn-minus" onClick={()=>updateQty(sel,e,q-1)}>−</button>
                      <input className="qty-input" value={q} type="number" min="1" onChange={ev=>updateQty(sel,e,ev.target.value)} onBlur={ev=>{if(!ev.target.value)updateQty(sel,e,1);}}/>
                      <button className="qty-btn-plus" onClick={()=>updateQty(sel,e,q+1)}>+</button>
                      <span style={{fontSize:12,color:C.grey,fontWeight:600}}>{prod?.unit||"pcs"}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{borderTop:`1.5px solid ${C.border}`,paddingTop:14}}>
              <p style={{fontSize:11,fontWeight:900,color:C.grey,letterSpacing:".08em",marginBottom:10}}>AJOUTER UN PRODUIT</p>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <input className="field" placeholder="EAN…" value={ean} onChange={ev=>setEan(ev.target.value)} onKeyDown={ev=>ev.key==="Enter"&&addProd()} style={{flex:1}}/>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <span style={{fontSize:11,fontWeight:800,color:C.grey}}>Qté</span>
                  <input className="qty-input" type="number" min="1" value={qty} onChange={ev=>setQty(ev.target.value)}/>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn-main" style={{flex:1}} onClick={addProd}><Ic d={D.plus} size={15} sw={2.5}/>Ajouter</button>
                <button className="btn-scan" onClick={()=>openScanner(scanned=>{setEan(scanned);notify(`Scanné : ${scanned}`);})}><Ic d={D.camera} size={15} sw={2}/>Scan</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
