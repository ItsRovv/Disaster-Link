import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Camera, Send, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { analyzeReport } from '../../lib/ai';
import { DISASTER_TYPES, MUNICIPALITIES, MUNICIPALITY_COORDINATES, BARANGAY_COORDINATES } from '../../data/mockData';

function MapPanner({ coords }) {
  const map = useMap();
  useEffect(() => { map.panTo(coords); }, [coords, map]);
  return null;
}

function ClickToPlace({ onPlace }) {
  useMapEvents({ click(e) { onPlace([e.latlng.lat, e.latlng.lng]); } });
  return null;
}

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:20px;height:20px;background:#dc2626;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5);cursor:grab;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function findLocalBarangay(municipality, barangay) {
  const mData = BARANGAY_COORDINATES[municipality];
  if (!mData) return null;
  const lower = barangay.toLowerCase().trim();
  const exactKey = Object.keys(mData).find(k => k.toLowerCase() === lower);
  if (exactKey) return mData[exactKey];
  const partialKey = Object.keys(mData).find(
    k => k.toLowerCase().includes(lower) || lower.includes(k.toLowerCase())
  );
  return partialKey ? mData[partialKey] : null;
}

function coordsAreClose([lat1, lng1], [lat2, lng2], threshold = 0.15) {
  return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
}

function findNearestBarangay(municipality, lat, lng) {
  const mData = BARANGAY_COORDINATES[municipality];
  if (!mData) return '';
  let nearest = '';
  let minDist = Infinity;
  for (const [name, [bLat, bLng]] of Object.entries(mData)) {
    const dist = (lat - bLat) ** 2 + (lng - bLng) ** 2;
    if (dist < minDist) { minDist = dist; nearest = name; }
  }
  return nearest;
}

export default function ReportModal({ onClose }) {
  const { state, dispatch } = useApp();
  const { currentUser } = state;

  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: 'flood',
    title: '',
    description: '',
    municipality: currentUser?.municipality || '',
    barangay: '',
    street: '',
    location: '',
    priority: '',
    coordinates: MUNICIPALITY_COORDINATES[currentUser?.municipality] || [12.85, 123.98],
  });
  const [errors, setErrors] = useState({});
  const [locating, setLocating] = useState(false);
  const [geocoded, setGeocoded] = useState(false);
  const [pinAddress, setPinAddress] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const geocodeTimer = useRef(null);
  const isReversingRef = useRef(false);

  const update = (field, value) => {
    if (field === 'municipality') {
      const base = MUNICIPALITY_COORDINATES[value];
      setForm(prev => ({
        ...prev,
        municipality: value,
        barangay: '',
        street: '',
        coordinates: base ? [...base] : prev.coordinates,
      }));
      setGeocoded(false);
      setPinAddress('');
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
      if (field === 'barangay' || field === 'street') setGeocoded(false);
    }
    setErrors(prev => ({ ...prev, [field]: undefined }));
    if (field === 'type') { setAiSuggestion(null); setAiError(''); }
  };

  useEffect(() => {
    if (isReversingRef.current) return;
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    const barangay = form.barangay.trim();
    const street = form.street.trim();
    const municipality = form.municipality;
    if (!barangay || !municipality) return;

    geocodeTimer.current = setTimeout(async () => {
      setLocating(true);
      const localCoords = findLocalBarangay(municipality, barangay);

      /* ── Local DB is the authoritative source — use it whenever available ── */
      if (localCoords) {
        setForm(prev => ({ ...prev, coordinates: [...localCoords] }));
        setGeocoded(true);
        setLocating(false);
        const label = [street, barangay, municipality].filter(Boolean).join(', ');
        setPinAddress(label);
        return;
      }

      /* ── Barangay not in local DB — fall back to Nominatim ── */
      const queries = [
        `${barangay}, ${municipality}, Sorsogon, Philippines`,
        `Barangay ${barangay}, ${municipality}, Sorsogon, Philippines`,
      ];
      const munCoords = MUNICIPALITY_COORDINATES[municipality];

      try {
        let found = null;
        for (const q of queries) {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=ph`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data.length > 0) {
            const candidate = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            /* Accept only if within ~15 km of the municipality center */
            if (!munCoords || coordsAreClose(candidate, munCoords, 0.15)) {
              found = data[0];
              break;
            }
          }
        }
        if (found) {
          setForm(prev => ({
            ...prev,
            coordinates: [parseFloat(found.lat), parseFloat(found.lon)],
          }));
          setGeocoded(true);
        } else {
          if (munCoords) setForm(prev => ({ ...prev, coordinates: [...munCoords] }));
          setGeocoded(false);
        }
      } catch {
        if (munCoords) setForm(prev => ({ ...prev, coordinates: [...munCoords] }));
        setGeocoded(false);
      } finally {
        setLocating(false);
      }
    }, 700);

    return () => clearTimeout(geocodeTimer.current);
  }, [form.barangay, form.street, form.municipality]);

  const validate = () => {
    const errs = {};
    if (!form.title.trim())       errs.title       = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.municipality)       errs.municipality = 'Please select a municipality';
    if (!form.barangay.trim())    errs.barangay    = 'Barangay is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const reverseGeocode = async (lat, lng) => {
    isReversingRef.current = true;
    setLocating(true);
    setForm(prev => ({ ...prev, coordinates: [lat, lng] }));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const nearestBarangay = findNearestBarangay(form.municipality, lat, lng);
      if (data?.address) {
        const addr = data.address;
        const street = addr.road || addr.pedestrian || addr.footway || addr.path || '';
        const city = addr.city || addr.town || addr.municipality || form.municipality;
        setForm(prev => ({
          ...prev,
          coordinates: [lat, lng],
          ...(street          ? { street }          : {}),
          ...(nearestBarangay ? { barangay: nearestBarangay } : {}),
        }));
        setErrors(prev => ({ ...prev, barangay: undefined }));
        const label = [street, nearestBarangay, city].filter(Boolean).join(', ');
        setPinAddress(label);
      } else if (nearestBarangay) {
        setForm(prev => ({ ...prev, coordinates: [lat, lng], barangay: nearestBarangay }));
        setPinAddress([nearestBarangay, form.municipality].filter(Boolean).join(', '));
      }
    } catch { /* ignore */ } finally {
      setLocating(false);
      setGeocoded(true);
      setTimeout(() => { isReversingRef.current = false; }, 200);
    }
  };

  const handleAiAnalyze = async () => {
    if (!form.title.trim() || !form.description.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError('');
    setAiSuggestion(null);
    try {
      const result = await analyzeReport(form.type, form.title, form.description);
      setAiSuggestion(result);
    } catch (err) {
      setAiError(
        err.message.includes('not configured')
          ? '⚠️ AI features require a Gemini API key in .env (VITE_GEMINI_API_KEY).'
          : `Analysis failed: ${err.message}`
      );
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiSuggestion = () => {
    if (!aiSuggestion) return;
    setForm(prev => ({
      ...prev,
      ...(aiSuggestion.suggestedTitle ? { title: aiSuggestion.suggestedTitle } : {}),
      ...(aiSuggestion.suggestedPriority ? { priority: aiSuggestion.suggestedPriority } : {}),
    }));
    setAiSuggestion(null);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    setSubmitting(true);
    setTimeout(() => {
      dispatch({
        type: 'ADD_REPORT',
        payload: {
          ...form,
          location: [form.street.trim(), form.barangay, form.municipality].filter(Boolean).join(', '),
          reportedBy: currentUser?.name || 'Anonymous',
          reporterRole: currentUser?.role || 'resident',
        },
      });
      setSubmitting(false);
      setStep(2);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg 3xl:max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col slide-up">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-red-50 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Report an Incident</h2>
              <p className="text-[11px] text-gray-400">Your report will be visible to all users</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Form */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            {/* Rate limit notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>Reports are submitted as <strong>Unverified</strong> and will be reviewed by your Barangay or LGU before being confirmed.</span>
            </div>

            {/* Disaster type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">Incident Type *</label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {Object.values(DISASTER_TYPES).filter(dt => dt.id !== 'earthquake').map(dt => (
                  <button
                    key={dt.id}
                    onClick={() => update('type', dt.id)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                      form.type === dt.id ? 'shadow-md' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                    style={
                      form.type === dt.id
                        ? { borderColor: dt.color, backgroundColor: dt.lightColor, color: dt.textColor }
                        : {}
                    }
                  >
                    <span className="text-xl">{dt.icon}</span>
                    <span className="text-center leading-tight">{dt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Report Title *</label>
              <input
                type="text"
                placeholder="Brief title describing the incident..."
                value={form.title}
                onChange={e => update('title', e.target.value)}
                maxLength={100}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                  errors.title ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Description *</label>
              <textarea
                placeholder="Describe the situation in detail. Include water level, number of people affected, road conditions, or anything important for responders..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none ${
                  errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200'
                }`}
              />
              {errors.description && <p className="text-xs text-red-500 mt-0.5">{errors.description}</p>}
            </div>

            {/* AI Analysis */}
            <div>
              <div className="flex items-center justify-between">
                {form.priority && (
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full text-white ${
                    form.priority === 'critical' ? 'bg-red-600' :
                    form.priority === 'high' ? 'bg-orange-500' :
                    form.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    <Sparkles className="w-2.5 h-2.5" />
                    AI Priority: {form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}
                    <button
                      onClick={() => setForm(p => ({ ...p, priority: '' }))}
                      className="ml-1 hover:opacity-70 text-sm leading-none"
                    >×</button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAiAnalyze}
                  disabled={!form.title.trim() || !form.description.trim() || aiLoading}
                  className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors border border-indigo-100"
                >
                  {aiLoading ? (
                    <span className="inline-block w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {aiLoading ? 'Analyzing…' : 'Analyze with AI'}
                </button>
              </div>

              {aiError && (
                <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {aiError}
                </p>
              )}

              {aiSuggestion && (
                <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <p className="text-xs font-bold text-indigo-800">AI Analysis</p>
                  </div>
                  <p className="text-xs text-gray-700 leading-relaxed">{aiSuggestion.analysis}</p>
                  {aiSuggestion.keyInfo && (
                    <div className="bg-white border border-indigo-100 rounded-lg px-2.5 py-2">
                      <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider mb-0.5">Key Info for Responders</p>
                      <p className="text-xs text-gray-800">{aiSuggestion.keyInfo}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <div>
                      <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">Suggested Title</p>
                      <p className="text-xs text-gray-900 font-medium leading-snug">{aiSuggestion.suggestedTitle}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider mb-1">Suggested Priority</p>
                      <span className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-full text-white ${
                        aiSuggestion.suggestedPriority === 'critical' ? 'bg-red-600' :
                        aiSuggestion.suggestedPriority === 'high' ? 'bg-orange-500' :
                        aiSuggestion.suggestedPriority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}>
                        {aiSuggestion.suggestedPriority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-indigo-100">
                    <button
                      onClick={applyAiSuggestion}
                      className="flex-1 text-xs font-semibold bg-indigo-700 hover:bg-indigo-800 text-white py-2 rounded-lg transition-colors"
                    >
                      Apply Suggestions
                    </button>
                    <button
                      onClick={() => { setAiSuggestion(null); setAiError(''); }}
                      className="px-4 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Municipality *</label>
                <select
                  value={form.municipality}
                  onChange={e => update('municipality', e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                    errors.municipality ? 'border-red-400 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <option value="">Select...</option>
                  {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.municipality && <p className="text-xs text-red-500 mt-0.5">{errors.municipality}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Barangay *</label>
                {BARANGAY_COORDINATES[form.municipality] ? (
                  <select
                    value={form.barangay}
                    onChange={e => update('barangay', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      errors.barangay ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <option value="">Select barangay...</option>
                    {Object.keys(BARANGAY_COORDINATES[form.municipality])
                      .sort()
                      .map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Barangay name..."
                    value={form.barangay}
                    onChange={e => update('barangay', e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300 ${
                      errors.barangay ? 'border-red-400 bg-red-50' : 'border-gray-200'
                    }`}
                  />
                )}
                {errors.barangay && <p className="text-xs text-red-500 mt-0.5">{errors.barangay}</p>}
              </div>
            </div>

            {/* Street */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Street / Purok <span className="font-normal text-gray-400">(Optional)</span></label>
              <input
                type="text"
                placeholder="e.g. Rizal St., Purok 3..."
                value={form.street}
                onChange={e => update('street', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Pin Location Mini-Map */}
            {form.municipality && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Pin Exact Location
                  <span className="ml-1 font-normal text-gray-400">(drag pin or tap map to adjust)</span>
                </label>
                <div
                  className="rounded-xl overflow-hidden border border-gray-200 shadow-sm"
                  style={{ height: '170px', zIndex: 0 }}
                >
                  <MapContainer
                    center={form.coordinates}
                    zoom={15}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <MapPanner coords={form.coordinates} />
                    <ClickToPlace
                      onPlace={([lat, lng]) => reverseGeocode(lat, lng)}
                    />
                    <Marker
                      position={form.coordinates}
                      icon={pinIcon}
                      draggable={true}
                      eventHandlers={{
                        dragend(e) {
                          const { lat, lng } = e.target.getLatLng();
                          reverseGeocode(lat, lng);
                        },
                      }}
                    />
                  </MapContainer>
                </div>
                <div className="mt-1 space-y-0.5">
                  <p className="text-[10px] text-gray-400">
                    📍 {form.coordinates[0].toFixed(5)}, {form.coordinates[1].toFixed(5)}
                    {locating && <span className="ml-2 text-blue-500">Locating…</span>}
                  </p>
                  {!locating && pinAddress && (
                    <p className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                      {pinAddress}
                    </p>
                  )}
                  {!locating && !pinAddress && geocoded && (
                    <p className="text-[10px] text-green-600">✓ Location set</p>
                  )}
                </div>
              </div>
            )}

            {/* Photo upload placeholder */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Photo (Optional)</label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-indigo-300 transition-colors cursor-pointer">
                <Camera className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                <p className="text-xs text-gray-400">Click to attach a photo of the incident</p>
                <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG — max 5 MB</p>
              </div>
            </div>

          </div>
        )}

        {/* Step 2: Success */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 text-center gap-3">
            <div className="flex items-center justify-center w-16 h-16 bg-green-50 rounded-full">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Report Submitted!</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              Your incident report has been received and is now visible to the community as <strong className="text-red-600">Unverified</strong>. Your Barangay or LGU will review and verify it shortly.
            </p>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 text-xs text-gray-600 mt-2 max-w-xs text-left w-full">
              <p className="font-semibold text-gray-700 mb-1">What happens next?</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Report is visible on community feed & map</li>
                <li>LGU/Barangay reviews your report</li>
                <li>Status changes to Verified or False Alarm</li>
                <li>Response teams are dispatched as needed</li>
              </ol>
            </div>
            <button
              onClick={onClose}
              className="mt-4 bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-indigo-800 transition-colors text-sm"
            >
              Done
            </button>
          </div>
        )}

        {/* Footer actions */}
        {step === 1 && (
          <div className="px-5 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white transition-colors"
            >
              {submitting ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
