import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

type MapPickerProps = {
  latitude?: number;
  longitude?: number;
  onChange: (coords: {
    latitude: number;
    longitude: number;
    locationText?: string;
    exactAddress?: string;
    googleMapsUrl?: string;
  }) => void;
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629];
const DEFAULT_ZOOM = 5;
const SELECTED_ZOOM = 16;

export function MapPicker({ latitude, longitude, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.L));
  const [statusLabel, setStatusLabel] = useState("Click on the map to pin the exact property location. This helps accepted applicants navigate accurately.");

  async function reverseGeocode(nextLatitude: number, nextLongitude: number) {
    try {
      setStatusLabel("Looking up address from the selected pin...");

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextLatitude}&lon=${nextLongitude}`
      );

      if (!response.ok) {
        throw new Error("Unable to resolve address");
      }

      const payload = (await response.json()) as {
        display_name?: string;
        address?: Record<string, string | undefined>;
      };

      const address = payload.address ?? {};
      const locationParts = [
        address.suburb,
        address.neighbourhood,
        address.city || address.town || address.village,
        address.state
      ].filter(Boolean);

      onChange({
        latitude: nextLatitude,
        longitude: nextLongitude,
        locationText: locationParts.slice(-2).join(", ") || payload.display_name,
        exactAddress: payload.display_name,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${nextLatitude},${nextLongitude}`
      });

      setStatusLabel("Pin saved and location details auto-filled from the map.");
    } catch {
      onChange({
        latitude: nextLatitude,
        longitude: nextLongitude,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${nextLatitude},${nextLongitude}`
      });
      setStatusLabel("Pin saved. Address lookup was unavailable, so only coordinates were stored.");
    }
  }

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
    if (!scriptReady || !containerRef.current || mapRef.current) return;

    const L = window.L;
    const initialCenter =
      latitude !== undefined && longitude !== undefined ? [latitude, longitude] : DEFAULT_CENTER;
    const initialZoom =
      latitude !== undefined && longitude !== undefined ? SELECTED_ZOOM : DEFAULT_ZOOM;

    mapRef.current = L.map(containerRef.current).setView(initialCenter, initialZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors"
    }).addTo(mapRef.current);

    mapRef.current.on("click", (event: any) => {
      const nextLatitude = Number(event.latlng.lat.toFixed(6));
      const nextLongitude = Number(event.latlng.lng.toFixed(6));

      if (!markerRef.current) {
        markerRef.current = L.marker([nextLatitude, nextLongitude]).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng([nextLatitude, nextLongitude]);
      }

      void reverseGeocode(nextLatitude, nextLongitude);
    });

    if (latitude !== undefined && longitude !== undefined) {
      markerRef.current = L.marker([latitude, longitude]).addTo(mapRef.current);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [latitude, longitude, onChange, scriptReady]);

  useEffect(() => {
    if (!mapRef.current || latitude === undefined || longitude === undefined) return;

    const nextCoords: [number, number] = [latitude, longitude];
    mapRef.current.setView(nextCoords, SELECTED_ZOOM);

    if (!markerRef.current) {
      markerRef.current = window.L.marker(nextCoords).addTo(mapRef.current);
    } else {
      markerRef.current.setLatLng(nextCoords);
    }
  }, [latitude, longitude]);

  return (
    <div className="map-picker">
      <div className="map-picker-shell">
        {scriptReady ? (
          <div ref={containerRef} className="map-picker-canvas" />
        ) : (
          <div className="map-picker-fallback">Loading map…</div>
        )}
      </div>
      <p className="map-picker-copy">
        {statusLabel}
      </p>
      <div className="map-picker-coordinates">
        <span>Latitude: {latitude !== undefined ? latitude.toFixed(6) : "Not selected"}</span>
        <span>Longitude: {longitude !== undefined ? longitude.toFixed(6) : "Not selected"}</span>
      </div>
    </div>
  );
}
