import { useState, useEffect, useRef } from "react";

export default function Carte({ token, onContact }) {
  const [joueurs, setJoueurs] = useState([]);
  const [sports, setSports] = useState([]);
  const [filtreSport, setFiltreSport] = useState("");
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  async function fetchSports() {
    const res = await fetch("/api/profil/sports", { headers });
    const data = await res.json();
    setSports(data);
  }

  async function fetchJoueurs(sport) {
    setLoading(true);
    let url = "/api/joueurs?";
    if (sport) url += `sport=${sport}&`;
    const res = await fetch(url, { headers });
    const data = await res.json();
    const avecCoords = (Array.isArray(data) ? data : []).filter(j => j.ville);
    setJoueurs(avecCoords);
    setLoading(false);
    return avecCoords;
  }

  async function geocodeVille(ville) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(ville)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}
    return null;
  }

  async function initMap(joueursData) {
    if (!mapRef.current) return;

    // Import dynamique Leaflet
    const L = await import("leaflet");
    await import("leaflet/dist/leaflet.css");

    // Fix icônes Leaflet
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });

    // Crée la carte si pas encore créée
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView([46.603354, 1.888334], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapInstanceRef.current);
    }

    // Supprime anciens marqueurs
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Géocode et place les marqueurs
    for (const joueur of joueursData) {
      const coords = await geocodeVille(joueur.ville);
      if (!coords) continue;

      // Légère variation pour éviter superposition
      const lat = coords.lat + (Math.random() - 0.5) * 0.02;
      const lng = coords.lng + (Math.random() - 0.5) * 0.02;

      const niveauColors = {
        debutant: "#00E676",
        intermediaire: "#0057FF",
        avance: "#FFB300",
        expert: "#FF3D57",
      };
      const color = niveauColors[joueur.niveau] || "#0057FF";

      const icon = L.divIcon({
        className: "",
        html: `
          <div style="
            background: ${color};
            width: 40px; height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
          ">
            <span style="transform: rotate(45deg); font-size: 16px;">
              ${joueur.icones?.[0] || "🏃"}
            </span>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -45],
      });

      const sportsStr = joueur.icones?.map((ic, i) => `${ic} ${joueur.sports[i]}`).join(", ") || "";

      const popup = L.popup({ maxWidth: 250 }).setContent(`
        <div style="font-family: 'Barlow', sans-serif; padding: 4px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
            <div style="
              width:40px; height:40px; border-radius:50%;
              background:linear-gradient(135deg,#0057FF,#00E5FF);
              display:flex; align-items:center; justify-content:center;
              color:white; font-weight:900; font-size:14px;
            ">${joueur.prenom?.[0]?.toUpperCase()}${joueur.nom?.[0]?.toUpperCase()}</div>
            <div>
              <div style="font-weight:700; font-size:15px;">${joueur.prenom} ${joueur.nom}</div>
              <div style="color:#666; font-size:12px;">📍 ${joueur.ville}</div>
            </div>
          </div>
          <div style="
            display:inline-block; background:${color}22;
            color:${color}; padding:2px 8px; border-radius:20px;
            font-size:11px; font-weight:700; margin-bottom:8px;
          ">${joueur.niveau}</div>
          <div style="font-size:12px; color:#555; margin-bottom:10px;">${sportsStr}</div>
          <button onclick="window.__contactJoueur(${JSON.stringify(joueur).replace(/"/g, '&quot;')})"
            style="
              width:100%; padding:8px; background:linear-gradient(135deg,#0057FF,#0080ff);
              color:white; border:none; border-radius:8px;
              font-weight:700; cursor:pointer; font-size:13px;
            ">💬 Contacter</button>
        </div>
      `);

      const marker = L.marker([lat, lng], { icon }).bindPopup(popup);
      marker.addTo(mapInstanceRef.current);
      markersRef.current.push(marker);
    }
  }

  useEffect(() => {
    // Expose fonction globale pour le bouton dans le popup
    window.__contactJoueur = (joueur) => {
      if (onContact) onContact(joueur);
    };

    fetchSports();
    fetchJoueurs("").then(data => initMap(data));

    return () => {
      delete window.__contactJoueur;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  async function handleFilterChange(sportId) {
    setFiltreSport(sportId);
    const data = await fetchJoueurs(sportId);
    await initMap(data);
  }

  return (
    <div style={s.container} className="fade-in">
      <div style={s.pageHeader}>
        <div>
          <h1 style={s.pageTitle}>Carte des joueurs</h1>
          <p style={s.pageDesc}>Trouve des sportifs près de chez toi</p>
        </div>
        <div style={s.stats}>
          <span style={s.statNum}>{joueurs.length}</span>
          <span style={s.statLabel}>joueurs localisés</span>
        </div>
      </div>

      {/* Filtres */}
      <div style={s.filters}>
        <div style={s.filterGroup}>
          <label style={s.filterLabel}>🏅 Filtrer par sport</label>
          <select style={s.filterInput} value={filtreSport}
            onChange={e => handleFilterChange(e.target.value)}>
            <option value="">Tous les sports</option>
            {sports.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.icone} {sp.nom}</option>
            ))}
          </select>
        </div>

        <div style={s.legend}>
          {[
            { label: "Débutant", color: "#00E676" },
            { label: "Intermédiaire", color: "#0057FF" },
            { label: "Avancé", color: "#FFB300" },
            { label: "Expert", color: "#FF3D57" },
          ].map(n => (
            <div key={n.label} style={s.legendItem}>
              <div style={{...s.legendDot, background: n.color}}/>
              <span style={s.legendLabel}>{n.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Carte */}
      {loading && (
        <div style={s.loadingOverlay}>
          <div style={s.spinner}/>
          <p style={{color: "var(--text2)"}}>Chargement de la carte...</p>
        </div>
      )}

      <div style={s.mapWrapper}>
        <div ref={mapRef} style={s.map}/>
      </div>
    </div>
  );
}

const s = {
  container: { maxWidth: "1000px", margin: "0 auto" },
  pageHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "1.5rem",
  },
  pageTitle: {
    fontFamily: "var(--font-display)", fontSize: "2.5rem",
    fontWeight: "900", color: "white", marginBottom: "0.25rem",
  },
  pageDesc: { color: "var(--text2)", fontSize: "0.95rem" },
  stats: { textAlign: "right" },
  statNum: {
    display: "block", fontFamily: "var(--font-display)",
    fontSize: "2.5rem", fontWeight: "900", color: "var(--cyan)",
  },
  statLabel: { color: "var(--text2)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px" },
  filters: {
    display: "flex", gap: "1rem", alignItems: "center",
    background: "var(--dark3)", borderRadius: "16px", padding: "1.25rem",
    border: "1px solid rgba(255,255,255,0.05)", marginBottom: "1.5rem",
    flexWrap: "wrap",
  },
  filterGroup: { display: "flex", flexDirection: "column", gap: "0.4rem", minWidth: "200px" },
  filterLabel: {
    color: "var(--text2)", fontSize: "0.75rem",
    fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px",
  },
  filterInput: {
    padding: "0.65rem 1rem", background: "var(--dark4)",
    border: "2px solid transparent", borderRadius: "10px",
    color: "white", fontSize: "0.9rem", outline: "none",
  },
  legend: { display: "flex", gap: "1rem", flexWrap: "wrap", marginLeft: "auto" },
  legendItem: { display: "flex", alignItems: "center", gap: "0.4rem" },
  legendDot: { width: "12px", height: "12px", borderRadius: "50%" },
  legendLabel: { color: "var(--text2)", fontSize: "0.8rem" },
  loadingOverlay: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "1rem", padding: "3rem 0",
  },
  spinner: {
    width: "40px", height: "40px", borderRadius: "50%",
    border: "3px solid var(--dark3)", borderTopColor: "var(--blue)",
  },
  mapWrapper: {
    borderRadius: "20px", overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.05)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    height: "550px",
  },
  map: { width: "100%", height: "100%" },
};
