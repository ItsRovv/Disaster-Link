import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { CRITICAL_DISASTER_TYPES, HIGH_DISASTER_TYPES } from '../data/mockData';

const LIVE_INCIDENTS = [
  {
    type: 'flood',
    title: 'Rising water level along Castilla River',
    description: 'Residents reported water levels rising rapidly near the riverbank. Several families are already wading through knee-deep water. Barangay captain is requesting rescue boats and sandbags immediately.',
    location: 'Cogon, Castilla',
    municipality: 'Castilla',
    barangay: 'Cogon',
    coordinates: [12.9550, 124.0333],
    reportedBy: 'Barangay Captain Cruz',
    reporterRole: 'barangay',
  },
  {
    type: 'rescue',
    title: 'Elderly resident stranded on rooftop — Gubat',
    description: 'A 78-year-old man is stranded on his rooftop after floodwaters rose to over 4 feet inside his home. He is in stable condition but cannot safely descend on his own. Requesting immediate boat rescue team.',
    location: 'Ariman, Gubat',
    municipality: 'Gubat',
    barangay: 'Ariman',
    coordinates: [12.9056, 124.1189],
    reportedBy: 'Juan Dela Cruz',
    reporterRole: 'resident',
  },
  {
    type: 'landslide',
    title: 'Debris blocking access road near Bulusan Volcano Park',
    description: 'A rockslide partially blocked the access road near Bulusan Volcano Natural Park following 14 hours of heavy rainfall. No casualties reported, but the road is impassable for vehicles wider than 2 meters. DPWH notified.',
    location: 'Gatbo, Bulusan',
    municipality: 'Bulusan',
    barangay: 'Gatbo',
    coordinates: [12.7483, 124.1239],
    reportedBy: 'Maria Reyes',
    reporterRole: 'resident',
  },
  {
    type: 'fire',
    title: 'Grass fire spreading toward residential zone, Donsol',
    description: 'A fast-spreading grass fire is encroaching toward residential homes in Gogon Karakan. Strong winds are fanning the flames rapidly. BFP units are en route. Residents in adjacent houses are advised to prepare for evacuation.',
    location: 'Gogon Karakan, Donsol',
    municipality: 'Donsol',
    barangay: 'Gogon Karakan',
    coordinates: [12.9283, 123.5800],
    reportedBy: 'BFP Donsol Station',
    reporterRole: 'agency',
  },
  {
    type: 'flood',
    title: 'Storm surge advisory — Prieto Diaz coastal barangays',
    description: 'PAGASA storm surge advisory issued for coastal barangays of Prieto Diaz. Waves are exceeding 2.5 meters above normal sea level. Pre-emptive evacuation strongly recommended for all residents within 100 meters of the shoreline.',
    location: 'Gahoy, Prieto Diaz',
    municipality: 'Prieto Diaz',
    barangay: 'Gahoy',
    coordinates: [13.0533, 124.2117],
    reportedBy: 'MDRRMO Prieto Diaz',
    reporterRole: 'lgu',
  },
  {
    type: 'earthquake',
    title: 'Magnitude 3.8 tremor felt in Irosin area',
    description: 'A magnitude 3.8 earthquake was recorded 8 km northeast of Irosin at a depth of 10 km. Residents reported mild shaking lasting approximately 5 seconds. PHIVOLCS is monitoring for possible aftershocks. No structural damage reported so far.',
    location: 'Poblacion, Irosin',
    municipality: 'Irosin',
    barangay: 'Poblacion',
    coordinates: [12.7042, 124.0297],
    reportedBy: 'PHIVOLCS Monitoring Network',
    reporterRole: 'agency',
  },
  {
    type: 'typhoon',
    title: 'Strong winds reported — Magallanes coastal area',
    description: 'Sustained winds of 80 km/h with gusts up to 100 km/h reported along the Magallanes coastline. Several fishing boats have not yet returned to port. Residents in low-lying coastal barangays advised to seek shelter immediately.',
    location: 'Bonga, Magallanes',
    municipality: 'Magallanes',
    barangay: 'Bonga',
    coordinates: [12.8167, 123.8617],
    reportedBy: 'LGU Magallanes',
    reporterRole: 'lgu',
  },
];

function deriveP(type) {
  return CRITICAL_DISASTER_TYPES.has(type) ? 'critical'
    : HIGH_DISASTER_TYPES.has(type) ? 'high'
    : 'medium';
}

export function useLiveSimulation() {
  const { dispatch } = useApp();
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const scheduleNext = () => {
      const delay = 35000 + Math.random() * 25000;
      timerRef.current = setTimeout(() => {
        const idx = indexRef.current % LIVE_INCIDENTS.length;
        const template = LIVE_INCIDENTS[idx];
        indexRef.current++;

        dispatch({ type: 'ADD_REPORT', payload: template });
        dispatch({
          type: 'ADD_TOAST',
          payload: {
            id: Date.now(),
            type: template.type,
            title: template.title,
            location: template.location,
            priority: deriveP(template.type),
          },
        });

        scheduleNext();
      }, delay);
    };

    scheduleNext();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [dispatch]);
}
