"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

/** Leaflet must invalidateSize after container shows from display:none / expand */
function MapInvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const t1 = window.setTimeout(() => map.invalidateSize(), 50);
    const t2 = window.setTimeout(() => map.invalidateSize(), 250);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map]);

  return null;
}

export function toMapCoord(value: unknown): number | null {
  if (value == null || value === "") return null;
  if (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as { toNumber: () => number }).toNumber === "function"
  ) {
    const n = (value as { toNumber: () => number }).toNumber();

    return Number.isFinite(n) ? n : null;
  }
  const n = Number(value);

  return Number.isFinite(n) ? n : null;
}

type CaseLocationMapProps = {
  lat: number;
  lng: number;
  label?: string;
  mapKey?: string;
  className?: string;
  height?: number | string;
  invalidateOnMount?: boolean;
};

export function CaseLocationMap({
  lat,
  lng,
  label = "ตำแหน่งที่ประเมิน",
  mapKey,
  className,
  height = "100%",
  invalidateOnMount = false,
}: CaseLocationMapProps) {
  return (
    <div
      className={className}
      style={{ height: typeof height === "number" ? `${height}px` : height }}
    >
      <MapContainer
        key={mapKey ?? `map-${lat}-${lng}`}
        center={[lat, lng]}
        doubleClickZoom={false}
        dragging={false}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        zoom={17}
        zoomControl={false}
      >
        {invalidateOnMount ? <MapInvalidateSize /> : null}
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker draggable={false} position={[lat, lng]}>
          <Popup>{label}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
