import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Imports for Leaflet icons (Vite needs this since it might not bundle assets correctly for Leaflet default)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Setup default icon
const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapCanvasProps {
  markers?: Array<{
    id: string;
    lat: number;
    lng: number;
    title?: string;
    description?: React.ReactNode;
  }>;
  geofences?: Array<{
    id: string;
    lat: number;
    lng: number;
    radius: number;
    name: string;
  }>;
  onMapClick?: (lat: number, lng: number) => void;
  onRemoveGeofence?: (id: string) => void;
  path?: Array<[number, number]>;
  center?: [number, number];
  zoom?: number;
  className?: string;
}

// Click Handler Component
const MapEvents = ({ onClick }: { onClick?: (lat: number, lng: number) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (!onClick) return;
    map.on('click', (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    });
    return () => {
      map.off('click');
    };
  }, [map, onClick]);
  return null;
};

const MapController = ({ center }: { center?: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const MapCanvas: React.FC<MapCanvasProps> = ({ 
  markers = [], 
  geofences = [],
  onMapClick,
  onRemoveGeofence,
  path = [], 
  center = [20.5937, 78.9629], // Default India center
  zoom = 5,
  className = "h-full w-full rounded-xl"
}) => {
  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        className="h-full w-full rounded-xl z-0"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((marker) => (
          <Marker key={marker.id} position={[marker.lat, marker.lng]}>
             <Popup>
               <div className="font-semibold">{marker.title}</div>
               <div className="text-sm">{marker.description}</div>
             </Popup>
          </Marker>
        ))}

        {path.length > 0 && (
          <Polyline 
            positions={path} 
            color="#3b82f6" 
            weight={4}
            opacity={0.7}
          />
        )}
        
        {geofences.map((fence) => (
           <React.Fragment key={fence.id}>
             <Circle 
               center={[fence.lat, fence.lng]}
               radius={fence.radius}
               pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.1 }}
             />
             <Marker position={[fence.lat, fence.lng]} icon={
               L.icon({
                 iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                 shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                 iconSize: [25, 41],
                 iconAnchor: [12, 41],
                 popupAnchor: [1, -34],
                 shadowSize: [41, 41]
               })
             }>
                <Popup>
                  <div className="font-bold text-red-600">{fence.name}</div>
                  <div className="text-xs mb-2">Geofence Radius: {fence.radius}m</div>
                  {onRemoveGeofence && (
                    <button 
                      onClick={() => onRemoveGeofence(fence.id)}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200 hover:bg-red-200 w-full"
                    >
                      Remove
                    </button>
                  )}
                </Popup>
             </Marker>
           </React.Fragment>
        ))}

        <MapController center={center} />
        <MapEvents onClick={onMapClick} />
      </MapContainer>
    </div>
  );
};

export default MapCanvas;
