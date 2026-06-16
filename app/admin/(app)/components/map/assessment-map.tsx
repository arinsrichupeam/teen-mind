"use client";

import { useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, TileLayer } from "react-leaflet";
import { Chip, Spinner } from "@heroui/react";
import useSWR from "swr";

import { MapFilterBar, MAP_LEGEND_ITEMS } from "./map-filter-bar";
import { MapHeatmapLayer } from "./map-heatmap-layer";
import { MapMarkerLayer } from "./map-marker-layer";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "leaflet-defaulticon-compatibility";

import { getAssessmentResultColor } from "@/lib/assessment-result-colors";
import {
  MapFilterState,
  MapLocationsResponse,
  MapRiskSummary,
  MapViewMode,
} from "@/types";

const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];
const THAILAND_BOUNDS = L.latLngBounds([5.61, 97.34], [20.47, 105.64]);
const DEFAULT_ZOOM = 11;
const MIN_ZOOM = 5;

const EMPTY_SUMMARY: MapRiskSummary = {
  Green: 0,
  "Green-Low": 0,
  Yellow: 0,
  Orange: 0,
  Red: 0,
};

const initialFilters: MapFilterState = {
  dateFrom: "",
  dateTo: "",
  school: "",
  results: [],
};

function buildMapQuery(filters: MapFilterState) {
  const params = new URLSearchParams();

  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.school) params.set("school", filters.school);
  if (filters.results.length > 0) {
    params.set("result", filters.results.join(","));
  }

  const query = params.toString();

  return query ? `?${query}` : "";
}

const fetcher = async (url: string): Promise<MapLocationsResponse> => {
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    throw new Error(
      res.status === 401 ? "Unauthorized" : "Failed to fetch map data"
    );
  }

  return res.json();
};

export function AssessmentMap() {
  const [filters, setFilters] = useState<MapFilterState>(initialFilters);
  const [viewMode, setViewMode] = useState<MapViewMode>("markers");

  const query = useMemo(() => buildMapQuery(filters), [filters]);
  const { data, error, isLoading, isValidating } = useSWR<MapLocationsResponse>(
    `/api/dashboard/map-locations${query}`,
    fetcher,
    { keepPreviousData: true }
  );

  const locations = data?.locations ?? [];
  const summary = data?.summary ?? EMPTY_SUMMARY;
  const showLoadingOverlay = isLoading || isValidating;

  return (
    <div className="flex flex-col gap-4">
      <MapFilterBar
        filters={filters}
        viewMode={viewMode}
        onFiltersChange={setFilters}
        onViewModeChange={setViewMode}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-default-600">
          แสดงตำแหน่งแบบประเมินที่มีพิกัดทั้งหมด{" "}
          <span className="font-semibold text-foreground">
            {locations.length.toLocaleString("th-TH")}
          </span>{" "}
          จุด
        </p>
        <div className="flex flex-wrap gap-2">
          {MAP_LEGEND_ITEMS.map(({ key, label }) => (
            <Chip
              key={key}
              className="text-xs"
              size="sm"
              style={{
                backgroundColor: `${getAssessmentResultColor(key)}22`,
                color: getAssessmentResultColor(key),
                borderColor: getAssessmentResultColor(key),
              }}
              variant="bordered"
            >
              {label} (
              {summary[key as keyof MapRiskSummary].toLocaleString("th-TH")})
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger">
          ไม่สามารถโหลดข้อมูลแผนที่ได้
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-xl border border-default-200 bg-white shadow-sm">
        {showLoadingOverlay ? (
          <div className="absolute inset-0 z-[500] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
            <Spinner label="กำลังโหลดข้อมูล..." size="lg" />
          </div>
        ) : null}

        <MapContainer
          center={BANGKOK_CENTER}
          className="z-0 h-[calc(90vh-18rem)] min-h-[480px] w-full"
          maxBounds={THAILAND_BOUNDS}
          maxBoundsViscosity={1}
          minZoom={MIN_ZOOM}
          preferCanvas={true}
          scrollWheelZoom={true}
          zoom={DEFAULT_ZOOM}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {viewMode === "markers" ? (
            <MapMarkerLayer locations={locations} />
          ) : (
            <MapHeatmapLayer enabled={true} locations={locations} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
