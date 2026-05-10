import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, ZoomControl, useMap } from 'react-leaflet';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle, XCircle, Clock, MapPin, User, ThumbsUp, Filter, X, Layers } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DISASTER_TYPES, STATUSES, MUNICIPALITIES } from '../../data/mockData';

const SORSOGON_CENTER = [12.85, 123.98];
const SORSOGON_ZOOM = 10;

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, SORSOGON_ZOOM);
  }, [center, map]);
  return null;
}

function StatusBadge({ status }) {
  const s = STATUSES[status];
  if (!s) return null;
  const icon = status === 'verified'
    ? <CheckCircle className="w-3 h-3" />
    : status === 'false_alarm'
      ? <XCircle className="w-3 h-3" />
      : <Clock className="w-3 h-3" />;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${s.tailwind.bg} ${s.tailwind.text} ${s.tailwind.border}`}>
      {icon} {s.label}
    </span>
  );
}

export default function DisasterMap() {
  const { filteredReports, state, dispatch } = useApp();
  const { activeFilters } = state;
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [mapStyle, setMapStyle] = useState('street');

  const tileUrls = {
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  };

  const tileAttribs = {
    street: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    topo: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  };

  const toggleTypeFilter = (typeId) => {
    const curr = activeFilters.types;
    const next = curr.includes(typeId) ? curr.filter(t => t !== typeId) : [...curr, typeId];
    dispatch({ type: 'SET_FILTER', payload: { types: next } });
  };

  const toggleStatusFilter = (statusId) => {
    const curr = activeFilters.statuses;
    const next = curr.includes(statusId) ? curr.filter(s => s !== statusId) : [...curr, statusId];
    dispatch({ type: 'SET_FILTER', payload: { statuses: next } });
  };

  const hasActiveFilters =
    activeFilters.types.length > 0 ||
    activeFilters.statuses.length > 0 ||
    activeFilters.municipality;

  return (
    <div className="relative h-full w-full">
      {/* Map */}
      <MapContainer
        center={SORSOGON_CENTER}
        zoom={SORSOGON_ZOOM}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer url={tileUrls[mapStyle]} attribution={tileAttribs[mapStyle]} />
        <ZoomControl position="bottomright" />

        {filteredReports.map(report => {
          const dt = DISASTER_TYPES[report.type];
          if (!dt) return null;
          const isVerified = report.status === 'verified';
          const isFalseAlarm = report.status === 'false_alarm';

          return (
            <CircleMarker
              key={report.id}
              center={report.coordinates}
              radius={isVerified ? 14 : 10}
              pathOptions={{
                color: isFalseAlarm ? '#9ca3af' : dt.color,
                fillColor: isFalseAlarm ? '#d1d5db' : dt.color,
                fillOpacity: isFalseAlarm ? 0.3 : isVerified ? 0.85 : 0.5,
                weight: isVerified ? 3 : 1.5,
                dashArray: report.status === 'unverified' ? '5, 3' : undefined,
              }}
            >
              <Popup className="custom-map-popup" maxWidth={300}>
                <div className="text-sm">
                  {/* Header band */}
                  <div
                    className="pl-3 pr-9 py-2 rounded-t-lg flex items-center justify-between gap-2"
                    style={{ backgroundColor: dt.lightColor }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{dt.icon}</span>
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: dt.textColor }}
                      >
                        {dt.label}
                      </span>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>

                  {/* Body */}
                  <div className="px-3 py-2.5 bg-white rounded-b-lg">
                    <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">
                      {report.title}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-3">
                      {report.description}
                    </p>

                    <div className="flex flex-col gap-1 text-[11px] text-gray-500 border-t border-gray-100 pt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {report.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        {report.reportedBy}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {formatDistanceToNow(new Date(report.timestamp), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3 flex-shrink-0" />
                        {report.upvotes} upvotes
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Filter toggle button */}
      <button
        onClick={() => setShowFilterPanel(v => !v)}
        className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold shadow-md transition-colors ${
          showFilterPanel || hasActiveFilters
            ? 'bg-indigo-700 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {hasActiveFilters && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-indigo-700 text-[10px] font-bold">
            {activeFilters.types.length + activeFilters.statuses.length + (activeFilters.municipality ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Map style toggle */}
      <div className="absolute top-3 right-3 z-10 flex bg-white shadow-md rounded-lg overflow-hidden">
        {(['street', 'satellite', 'topo']).map(style => (
          <button
            key={style}
            onClick={() => setMapStyle(style)}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-2 text-xs font-medium capitalize transition-colors ${
              mapStyle === style ? 'bg-indigo-700 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">{style}</span>
          </button>
        ))}
      </div>

      {/* Filter panel */}
      {showFilterPanel && (
        <div className="absolute top-14 left-3 z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold text-gray-900">Filter Map</p>
            <button onClick={() => setShowFilterPanel(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Disaster types */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Hazard Type</p>
            <div className="flex flex-wrap gap-1.5">
              {Object.values(DISASTER_TYPES).map(dt => (
                <button
                  key={dt.id}
                  onClick={() => toggleTypeFilter(dt.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeFilters.types.includes(dt.id)
                      ? 'border-transparent text-white shadow-sm'
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                  style={
                    activeFilters.types.includes(dt.id)
                      ? { backgroundColor: dt.color }
                      : {}
                  }
                >
                  {dt.icon} {dt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status filter */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</p>
            <div className="flex gap-1.5 flex-wrap">
              {Object.values(STATUSES).map(s => (
                <button
                  key={s.id}
                  onClick={() => toggleStatusFilter(s.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeFilters.statuses.includes(s.id)
                      ? `${s.tailwind.bg} ${s.tailwind.text} ${s.tailwind.border}`
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Municipality filter */}
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Municipality</p>
            <select
              value={activeFilters.municipality}
              onChange={e => dispatch({ type: 'SET_FILTER', payload: { municipality: e.target.value } })}
              className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            >
              <option value="">All Municipalities</option>
              {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => dispatch({ type: 'CLEAR_FILTERS' })}
              className="w-full text-xs text-red-600 font-medium hover:bg-red-50 py-1.5 rounded-lg transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-10 left-3 z-10 bg-white/95 backdrop-blur rounded-xl shadow-md border border-gray-200 p-3 max-w-[180px]">
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Legend</p>
        <div className="space-y-1.5">
          {Object.values(DISASTER_TYPES).map(dt => (
            <div key={dt.id} className="flex items-center gap-2">
              <span
                className="flex-shrink-0 w-3 h-3 rounded-full border-2"
                style={{ backgroundColor: dt.color, borderColor: dt.color }}
              />
              <span className="text-[11px] text-gray-700">{dt.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 pt-1.5 mt-1">
            <div className="flex items-center gap-2">
              <span className="flex-shrink-0 w-3 h-3 rounded-full border-2 border-dashed border-gray-400 bg-gray-200" />
              <span className="text-[11px] text-gray-500">Unverified</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 border-blue-600 bg-blue-500" />
              <span className="text-[11px] text-gray-500">Verified (larger)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active report count badge */}
      <div className="absolute bottom-10 right-3 z-10 bg-indigo-700 text-white rounded-xl shadow-md px-3 py-2">
        <p className="text-[10px] font-medium opacity-80">Showing</p>
        <p className="text-xl font-bold leading-none">{filteredReports.length}</p>
        <p className="text-[10px] font-medium opacity-80">incident{filteredReports.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
