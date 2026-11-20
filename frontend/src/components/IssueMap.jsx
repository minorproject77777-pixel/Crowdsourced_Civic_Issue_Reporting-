import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';

const DEFAULT_CENTER = [21.2514, 81.6296];

const MARKER_COLORS = {
  CRITICAL: '#C4453D',
  HIGH: '#E8A23D',
  MEDIUM: '#EAD25D',
  LOW: '#3F7A5C',
};
const RESOLVED_COLOR = '#9AA1AC';

export default function IssueMap({ issues = [], height = '480px', center }) {
  const mapCenter = center || DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-lg border border-ink-100" style={{ height }}>
      <MapContainer center={mapCenter} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {issues
          .filter((i) => i.location?.coordinates?.length === 2)
          .map((issue) => {
            const [lng, lat] = issue.location.coordinates;
            const color = issue.status === 'RESOLVED' ? RESOLVED_COLOR : MARKER_COLORS[issue.priority] || '#5B6472';
            return (
              <CircleMarker
                key={issue._id}
                center={[lat, lng]}
                radius={8}
                pathOptions={{ color, fillColor: color, fillOpacity: 0.85, weight: 1.5 }}
              >
                <Popup>
                  <div className="min-w-[180px] text-sm">
                    <p className="font-semibold text-ink-800">{issue.title}</p>
                    <p className="mt-0.5 text-xs text-slate">
                      {issue.issueId} · {issue.category}
                    </p>
                    <p className="mt-0.5 text-xs text-slate">{issue.status.replace('_', ' ')}</p>
                    <Link
                      to={`/issues/${issue.issueId}`}
                      className="mt-2 inline-block text-xs font-semibold text-marigold-dark hover:underline"
                    >
                      View details →
                    </Link>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
      </MapContainer>
    </div>
  );
}
