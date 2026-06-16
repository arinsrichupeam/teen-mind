"use client";

import { CircleMarker } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";

import { buildPopupHtml } from "./map-popup-content";

import { getAssessmentResultColor } from "@/lib/assessment-result-colors";
import { MapLocation } from "@/types";

import "react-leaflet-cluster/dist/assets/MarkerCluster.css";
import "react-leaflet-cluster/dist/assets/MarkerCluster.Default.css";

type Props = {
  locations: MapLocation[];
};

export function MapMarkerLayer({ locations }: Props) {
  return (
    <MarkerClusterGroup
      chunkedLoading
      spiderfyOnMaxZoom
      maxClusterRadius={50}
      showCoverageOnHover={false}
    >
      {locations.map((location) => (
        <CircleMarker
          key={location.id}
          center={[location.latitude, location.longitude]}
          eventHandlers={{
            click: (event) => {
              const layer = event.target;

              layer.bindPopup(buildPopupHtml(location)).openPopup();
            },
          }}
          pathOptions={{
            color: getAssessmentResultColor(location.result),
            fillColor: getAssessmentResultColor(location.result),
            fillOpacity: 0.65,
            weight: 2,
          }}
          radius={6}
        />
      ))}
    </MarkerClusterGroup>
  );
}
