"use client";

import { useEffect } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet.heat";

import { MapLocation } from "@/types";

const RISK_INTENSITY: Record<string, number> = {
  Green: 0.2,
  "Green-Low": 0.35,
  Yellow: 0.55,
  Orange: 0.75,
  Red: 1,
};

type Props = {
  locations: MapLocation[];
  enabled: boolean;
};

export function MapHeatmapLayer({ locations, enabled }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || locations.length === 0) {
      return;
    }

    const points: L.HeatLatLngTuple[] = locations.map((location) => [
      location.latitude,
      location.longitude,
      RISK_INTENSITY[location.result] ?? 0.4,
    ]);

    const heatLayer = L.heatLayer(points, {
      radius: 22,
      blur: 18,
      maxZoom: 14,
      minOpacity: 0.35,
      gradient: {
        0.2: "#22c55e",
        0.4: "#86efac",
        0.55: "#eab308",
        0.75: "#f97316",
        1: "#ef4444",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [enabled, locations, map]);

  return null;
}
