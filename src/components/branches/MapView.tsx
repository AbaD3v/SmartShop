"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import type { Branch } from "@/lib/types";

const icon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function FlyTo({
  branches,
  selectedId,
}: {
  branches: Branch[];
  selectedId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedId) return;
    const branch = branches.find((b) => b.id === selectedId);
    if (!branch) return;

    const lat = branch.latitude ?? (branch as any).lat;
const lng = branch.longitude ?? (branch as any).lng;

if (typeof lat !== "number" || typeof lng !== "number") return;

const position: LatLngExpression = [lat, lng];

    map.flyTo(position, 14, { duration: 0.6 });
  }, [branches, selectedId, map]);

  return null;
}

interface Props {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function MapView({
  branches,
  selectedId,
  onSelect,
}: Props) {
  const center: LatLngExpression = [51.128, 71.43]; // центр Астаны

  return (
    <div className="h-[460px] w-full">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <FlyTo branches={branches} selectedId={selectedId} />

        {branches.map((branch) => (
          <Marker
            key={branch.id}
            position={[
  branch.latitude ?? (branch as any).lat,
  branch.longitude ?? (branch as any).lng,
]}
            icon={icon}
            eventHandlers={{
              click: () => onSelect(branch.id),
            }}
          >
            <Popup>
              <div>
                <div className="font-medium">{branch.name}</div>
                <div className="text-sm opacity-70">
                  {branch.address}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}