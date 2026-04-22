"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
}

export default function LocationPicker({ value, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState(value);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    // Guard against StrictMode double-mount: if Leaflet already attached to the DOM node, bail
    if ((mapRef.current as any)._leaflet_id) return;

    let isMounted = true;

    // Dynamically import Leaflet (SSR safe)
    import("leaflet").then((L) => {
      if (!isMounted || !mapRef.current || (mapRef.current as any)._leaflet_id) return;
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const center: [number, number] = value
        ? [value.lat, value.lng]
        : [12.854178, 80.238343]; // Default: AMET University, Chennai

      const map = L.map(mapRef.current!, { zoomControl: true }).setView(center, 17);
      leafletMap.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      if (value) {
        markerRef.current = L.marker([value.lat, value.lng], { draggable: true }).addTo(map);
        markerRef.current.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          const c = { lat: +pos.lat.toFixed(6), lng: +pos.lng.toFixed(6) };
          setCoords(c);
          onChange(c);
        });
      }

      map.on("click", (e: any) => {
        const c = { lat: +e.latlng.lat.toFixed(6), lng: +e.latlng.lng.toFixed(6) };
        if (markerRef.current) {
          markerRef.current.setLatLng([c.lat, c.lng]);
        } else {
          markerRef.current = L.marker([c.lat, c.lng], { draggable: true }).addTo(map);
          markerRef.current.on("dragend", (ev: any) => {
            const pos = ev.target.getLatLng();
            const nc = { lat: +pos.lat.toFixed(6), lng: +pos.lng.toFixed(6) };
            setCoords(nc);
            onChange(nc);
          });
        }
        setCoords(c);
        onChange(c);
      });
    });

    return () => {
      isMounted = false;
      leafletMap.current?.remove();
      leafletMap.current = null;
      markerRef.current = null;
    };
  }, []);

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: +pos.coords.latitude.toFixed(6), lng: +pos.coords.longitude.toFixed(6) };
        setLocating(false);
        setCoords(c);
        onChange(c);
        if (leafletMap.current) {
          leafletMap.current.setView([c.lat, c.lng], 18);
          import("leaflet").then((L) => {
            if (markerRef.current) {
              markerRef.current.setLatLng([c.lat, c.lng]);
            } else {
              markerRef.current = L.marker([c.lat, c.lng], { draggable: true }).addTo(leafletMap.current);
            }
          });
        }
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <div className="space-y-2">
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Click on the map to pin a location</p>
        <button type="button" onClick={useMyLocation} disabled={locating}
          className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          {locating ? "Locating..." : "Use my location"}
        </button>
      </div>

      <div ref={mapRef} style={{ height: "280px", borderRadius: "12px", overflow: "hidden", border: "1px solid #e5e7eb" }} />

      {coords && (
        <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 flex-shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span className="text-xs font-mono text-gray-600">{coords.lat}, {coords.lng}</span>
          <button type="button" onClick={() => { setCoords(null); markerRef.current?.remove(); markerRef.current = null; onChange({ lat: 0, lng: 0 }); }}
            className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-sm leading-none">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
