// src/components/branches/MapView.tsx
"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import type { Branch } from "@/lib/types";

function getCoords(branch: any): { lat: number; lng: number } | null {
  const latRaw =
    typeof branch?.latitude === "number"
      ? branch.latitude
      : typeof branch?.lat === "number"
        ? branch.lat
        : typeof branch?.latitude === "string"
          ? Number(branch.latitude)
          : typeof branch?.lat === "string"
            ? Number(branch.lat)
            : null;

  const lngRaw =
    typeof branch?.longitude === "number"
      ? branch.longitude
      : typeof branch?.lng === "number"
        ? branch.lng
        : typeof branch?.longitude === "string"
          ? Number(branch.longitude)
          : typeof branch?.lng === "string"
            ? Number(branch.lng)
            : null;

  const lat = Number(latRaw);
  const lng = Number(lngRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function InvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const t1 = window.setTimeout(() => map.invalidateSize(), 0);
    const t2 = window.setTimeout(() => map.invalidateSize(), 180);

    const onResize = () => map.invalidateSize();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);

  return null;
}

function FlyTo({ branches, selectedId }: { branches: Branch[]; selectedId: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const branch = branches.find((b) => b.id === selectedId);
    if (!branch) return;

    const coords = getCoords(branch as any);
    if (!coords) return;

    const position: LatLngExpression = [coords.lat, coords.lng];
    map.flyTo(position, 14, { duration: 0.55 });
  }, [branches, selectedId, map]);

  return null;
}

type BrandKey =
  | "sulpak"
  | "technodom"
  | "mechta"
  | "belyy_veter"
  | "alser"
  | "sony"
  | "default";

function detectBrand(name: string): BrandKey {
  const n = (name || "").toLowerCase();
  if (n.includes("sulpak")) return "sulpak";
  if (n.includes("technodom")) return "technodom";
  if (n.includes("mechta")) return "mechta";
  if (n.includes("белый ветер") || n.includes("belyy")) return "belyy_veter";
  if (n.includes("alser")) return "alser";
  if (n.includes("sony")) return "sony";
  return "default";
}

function brandBadge(brand: BrandKey): { label: string; logoSvg: string } {
  // Минималистичные “лого” в SVG (без внешних файлов)
  // Если хочешь реальные лого — заменим на /public/brands/*.svg (Image / img)
  switch (brand) {
    case "sulpak":
      return {
        label: "Sulpak",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 7.5c0-1.66 1.79-3 4-3h2c2.21 0 4 1.34 4 3S15.21 10.5 13 10.5h-2c-2.21 0-4 1.34-4 3s1.79 3 4 3h2c2.21 0 4-1.34 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>`,
      };
    case "technodom":
      return {
        label: "Technodom",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M6 7h12M9 7v10a3 3 0 0 0 6 0V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>`,
      };
    case "mechta":
      return {
        label: "Mechta",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 16V8l5 4 5-4v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
           </svg>`,
      };
    case "belyy_veter":
      return {
        label: "BV",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 14c2.5-3.5 7.5-3.5 10 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
             <path d="M8 10c2-2.5 6-2.5 8 0" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".9"/>
           </svg>`,
      };
    case "alser":
      return {
        label: "ALSER",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 17l5-10 5 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
             <path d="M9.5 13h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>`,
      };
    case "sony":
      return {
        label: "Sony",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 9c1-1 2.5-1 3.5 0s2.5 1 3.5 0 2.5-1 3.5 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
             <path d="M7 15c1 1 2.5 1 3.5 0s2.5-1 3.5 0 2.5 1 3.5 0" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>`,
      };
    default:
      return {
        label: "Shop",
        logoSvg:
          `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
             <path d="M7 10h10v9H7z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
             <path d="M9 10V8a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
           </svg>`,
      };
  }
}

function makeLogoMarkerIcon(brand: BrandKey, active: boolean) {
  const { label, logoSvg } = brandBadge(brand);

  const border = active ? "rgba(15, 23, 42, 0.9)" : "rgba(209, 213, 219, 0.9)";
  const ring = active ? "0 10px 24px rgba(0,0,0,0.18)" : "0 10px 24px rgba(0,0,0,0.12)";
  const subtle = active ? "rgba(15, 23, 42, 0.06)" : "rgba(0,0,0,0.04)";

  const html = `
  <div style="
    position: relative;
    width: 46px; height: 46px;
    display:flex; align-items:center; justify-content:center;
  ">
    <div style="
      width: 44px; height: 44px;
      border-radius: 999px;
      background: linear-gradient(180deg, #ffffff, #f8fafc);
      border: 1px solid ${border};
      box-shadow: ${ring};
      display:flex; align-items:center; justify-content:center;
      color: #0f172a;
    ">
      <div style="
        width: 32px; height: 32px;
        border-radius: 999px;
        background: ${subtle};
        display:flex; align-items:center; justify-content:center;
      ">
        ${logoSvg}
      </div>
    </div>

    <div style="
      position:absolute;
      bottom:-11px;
      left:50%;
      transform: translateX(-50%);
      padding: 2px 8px;
      font-size: 10px;
      line-height: 14px;
      border-radius: 999px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(229,231,235,0.9);
      box-shadow: 0 6px 18px rgba(0,0,0,0.08);
      color: rgba(55,65,81,0.95);
      white-space: nowrap;
      backdrop-filter: blur(8px);
    ">
      ${label}
    </div>
  </div>`;

  return L.divIcon({
    className: "ss-logo-marker",
    html,
    iconSize: [46, 58],
    iconAnchor: [23, 46],
    popupAnchor: [0, -40],
  });
}

interface Props {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({ branches, selectedId, onSelect }: Props) {
  const fallbackCenter: LatLngExpression = [51.128, 71.43];

  const initialCenter = useMemo<LatLngExpression>(() => {
    const first = branches.find((b) => !!getCoords(b as any));
    const coords = first ? getCoords(first as any) : null;
    return coords ? ([coords.lat, coords.lng] as LatLngExpression) : fallbackCenter;
  }, [branches]);

  const markers = useMemo(() => {
    return branches
      .map((b) => {
        const coords = getCoords(b as any);
        if (!coords) return null;
        const brand = detectBrand((b as any)?.name || "");
        return { branch: b, coords, brand };
      })
      .filter(Boolean) as { branch: Branch; coords: { lat: number; lng: number }; brand: BrandKey }[];
  }, [branches]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={initialCenter}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <InvalidateSize />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FlyTo branches={branches} selectedId={selectedId} />

        {markers.map(({ branch, coords, brand }) => {
          const isActive = branch.id === selectedId;

          return (
            <Marker
              key={branch.id}
              position={[coords.lat, coords.lng]}
              icon={makeLogoMarkerIcon(brand, isActive)}
              eventHandlers={{ click: () => onSelect(branch.id) }}
            >
              <Popup>
                <div style={{ minWidth: 240 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{branch.name}</div>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>{branch.address}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}