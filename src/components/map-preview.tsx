import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

type MapPreviewProps = {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
};

const DEFAULT_ZOOM = 16;

export function MapPreview({ latitude, longitude, label = "Property map" }: MapPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.L));

  useEffect(() => {
    if (window.L) {
      setScriptReady(true);
      return;
    }

    const interval = window.setInterval(() => {
      if (window.L) {
        setScriptReady(true);
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || mapRef.current || latitude == null || longitude == null) return;

    const L = window.L;
    const coords: [number, number] = [latitude, longitude];

    mapRef.current = L.map(containerRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
      attributionControl: true
    }).setView(coords, DEFAULT_ZOOM);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapRef.current);

    markerRef.current = L.marker(coords).addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, scriptReady]);

  useEffect(() => {
    if (!mapRef.current || latitude == null || longitude == null) return;

    const coords: [number, number] = [latitude, longitude];
    mapRef.current.setView(coords, DEFAULT_ZOOM);

    if (!markerRef.current) {
      markerRef.current = window.L.marker(coords).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(coords);
    }
  }, [latitude, longitude]);

  if (latitude == null || longitude == null) {
    return null;
  }

  return (
    <div className="map-preview">
      <div className="map-preview-header">
        <strong>{label}</strong>
        <span>
          {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </span>
      </div>
      <div className="map-picker-shell">
        {scriptReady ? (
          <div ref={containerRef} className="map-preview-canvas" />
        ) : (
          <div className="map-picker-fallback">Loading map…</div>
        )}
      </div>
    </div>
  );
}
