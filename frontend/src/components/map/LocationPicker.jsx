import { useCallback, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import './LocationPicker.css';

// Leaflet's default marker images don't resolve under bundlers — wire them up explicitly.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const INDIA_CENTER = [20.5937, 78.9629];
const round6 = (n) => Math.round(n * 1e6) / 1e6;

/** Captures map clicks and renders a draggable marker at the current position. */
function PickMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange(round6(e.latlng.lat), round6(e.latlng.lng));
    },
  });
  if (!position) return null;
  return (
    <Marker
      position={position}
      draggable
      eventHandlers={{
        dragend(e) {
          const { lat, lng } = e.target.getLatLng();
          onChange(round6(lat), round6(lng));
        },
      }}
    />
  );
}

/** Imperatively recenters the map when asked (after search / geolocation). */
function Recenter({ center, zoom }) {
  const map = useMap();
  if (center) map.setView(center, zoom ?? map.getZoom());
  return null;
}

/**
 * Controlled map location picker. `lat`/`lng` are numbers (or null); `onChange(lat, lng)` fires
 * when the user clicks the map, drags the pin, uses their location, or picks a search result.
 */
export default function LocationPicker({ lat, lng, onChange }) {
  const hasValue = typeof lat === 'number' && typeof lng === 'number';
  const position = hasValue ? [lat, lng] : null;
  const [flyTo, setFlyTo] = useState(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [status, setStatus] = useState('');
  const abortRef = useRef(null);

  const initialCenter = useMemo(() => (hasValue ? [lat, lng] : INDIA_CENTER), []); // eslint-disable-line react-hooks/exhaustive-deps

  const set = useCallback(
    (nlat, nlng, recenter = false, zoom) => {
      onChange(nlat, nlng);
      if (recenter) setFlyTo({ center: [nlat, nlng], zoom });
    },
    [onChange],
  );

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not available in this browser.');
      return;
    }
    setStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set(round6(pos.coords.latitude), round6(pos.coords.longitude), true, 15);
        setStatus('');
      },
      () => setStatus('Could not get your location — pick it on the map instead.'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, [set]);

  const search = useCallback(async () => {
    const q = query.trim();
    if (!q) return;
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    setStatus('');
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
      const data = await res.json();
      if (data && data.length) {
        set(round6(parseFloat(data[0].lat)), round6(parseFloat(data[0].lon)), true, 15);
      } else {
        setStatus('No match found for that address.');
      }
    } catch (err) {
      if (err.name !== 'AbortError') setStatus('Search failed — try again or pick on the map.');
    } finally {
      setSearching(false);
    }
  }, [query, set]);

  return (
    <div className="location-picker">
      <div className="location-picker__toolbar">
        <input
          type="text"
          className="form-control"
          placeholder="Search an address or landmark…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
        />
        <button type="button" className="location-picker__btn" onClick={search} disabled={searching}>
          {searching ? 'Searching…' : 'Search'}
        </button>
        <button type="button" className="location-picker__btn location-picker__btn--ghost" onClick={useMyLocation}>
          Use my location
        </button>
      </div>

      <MapContainer center={initialCenter} zoom={hasValue ? 15 : 5} className="location-picker__map" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <PickMarker position={position} onChange={(a, b) => set(a, b)} />
        {flyTo && <Recenter center={flyTo.center} zoom={flyTo.zoom} />}
      </MapContainer>

      <div className="location-picker__footer">
        {hasValue ? (
          <span className="location-picker__coords">
            📍 {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        ) : (
          <span className="location-picker__hint">Click the map, drag the pin, search, or use your location.</span>
        )}
        {status && <span className="location-picker__status">{status}</span>}
      </div>
    </div>
  );
}
