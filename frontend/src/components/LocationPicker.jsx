import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';

// Default Leaflet marker icons don't resolve correctly under Vite bundling — point them at the CDN copies.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const DEFAULT_CENTER = [21.2514, 81.6296]; // Raipur, Chhattisgarh — sensible default map center

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterButton({ onLocate }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => onLocate(map)}
      className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-md hover:bg-ink-50"
    >
      <LocateFixed size={14} /> Use my location
    </button>
  );
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [position, setPosition] = useState(
    latitude && longitude ? [latitude, longitude] : DEFAULT_CENTER
  );

  function handlePick(lat, lng) {
    setPosition([lat, lng]);
    onChange(lat, lng);
  }

  function handleLocate(map) {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setPosition([lat, lng]);
        onChange(lat, lng);
        map.setView([lat, lng], 16);
      },
      () => {
        // silently ignore — user can still click the map manually
      }
    );
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-md border border-ink-100">
      <MapContainer center={position} zoom={14} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={markerIcon} />
        <ClickHandler onPick={handlePick} />
        <RecenterButton onLocate={handleLocate} />
      </MapContainer>
    </div>
  );
}
