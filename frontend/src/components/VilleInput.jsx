import { useState, useRef, useEffect } from "react";

export default function VilleInput({ value, onChange, placeholder = "Ex: Paris", style = {} }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchVilles(query) {
    if (query.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,codesPostaux&boost=population&limit=6`
      );
      const data = await res.json();
      setSuggestions(data.map(v => ({
        nom: v.nom,
        cp: v.codesPostaux?.[0] || "",
      })));
      setShowSuggestions(true);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }

  function handleChange(e) {
    const val = e.target.value;
    onChange(val);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fetchVilles(val), 250);
  }

  function selectVille(ville) {
    onChange(ville.nom);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <input
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        autoComplete="off"
      />
      {loading && (
        <div style={s.loader}>⏳</div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div style={s.dropdown}>
          {suggestions.map((ville, i) => (
            <div key={i} style={s.item} onMouseDown={() => selectVille(ville)}>
              <span style={s.itemNom}>{ville.nom}</span>
              <span style={s.itemCp}>{ville.cp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  loader: {
    position: "absolute", right: "0.75rem", top: "50%",
    transform: "translateY(-50%)", fontSize: "0.8rem",
  },
  dropdown: {
    position: "absolute", top: "100%", left: 0, right: 0, zIndex: 1000,
    background: "#1c2540", border: "1px solid rgba(0,87,255,0.3)",
    borderRadius: "10px", marginTop: "4px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)", overflow: "hidden",
  },
  item: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.75rem 1rem", cursor: "pointer",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    transition: "background 0.15s",
  },
  itemNom: { color: "white", fontWeight: "600", fontSize: "0.9rem" },
  itemCp: { color: "var(--text2)", fontSize: "0.8rem" },
};
