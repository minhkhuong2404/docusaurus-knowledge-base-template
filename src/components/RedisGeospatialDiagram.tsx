import React, { useState } from 'react';

export default function RedisGeospatialDiagram(): React.JSX.Element {
  const [radius, setRadius] = useState<number>(5);
  const [selectedDriver, setSelectedDriver] = useState<string>('driver:john');

  const drivers = [
    { id: 'driver:john', name: 'John (Taxi)', dist: 0.27, inRadius: true, coords: '-122.4194, 37.7749' },
    { id: 'driver:jane', name: 'Jane (SUV)', dist: 2.1, inRadius: true, coords: '-122.4221, 37.7739' },
    { id: 'driver:mike', name: 'Mike (Sedan)', dist: 4.8, inRadius: true, coords: '-122.4089, 37.7853' },
    { id: 'driver:carlos', name: 'Carlos (Van)', dist: 12.5, inRadius: false, coords: '-118.2437, 34.0522' },
  ];

  return (
    <div className="interactive-diagram-container" style={{ fontFamily: 'var(--ifm-font-family-base)' }}>
      {/* Header */}
      <div className="interactive-diagram-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="10" r="3"/>
          <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/>
        </svg>
        <span style={{ color: 'var(--ifm-color-content)', fontWeight: 700 }}>
          Redis Geospatial (GEO) Radius Search Simulator (`GEOSEARCH`)
        </span>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Radius Slider Control */}
        <div style={{ backgroundColor: '#0c0e17', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ifm-color-content-secondary)' }}>
              GEOSEARCH Radius Filter
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#fbbf24' }}>
              {radius} km Radius
            </div>
          </div>
          <input
            type="range"
            min="1"
            max="15"
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            style={{ width: '50%', cursor: 'pointer' }}
          />
        </div>

        {/* Drivers List */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {drivers.map((d) => {
            const matches = d.dist <= radius;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDriver(d.id)}
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: matches ? '1px solid #34d399' : '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: matches ? 'rgba(52, 211, 153, 0.1)' : '#0c0e17',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '13px', color: matches ? '#fff' : 'var(--ifm-color-content-secondary)' }}>{d.name}</span>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: matches ? '#34d399' : '#f87171' }}>
                    {matches ? '✅ WITHIN RADIUS' : '❌ OUT OF BOUNDS'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--ifm-color-content-secondary)' }}>
                  Distance: {d.dist} km | Coords: {d.coords}
                </div>
              </div>
            );
          })}
        </div>

        {/* Command Output */}
        <div style={{ fontSize: '12px', fontFamily: 'monospace', backgroundColor: '#05070e', padding: '10px 12px', borderRadius: '6px', color: '#38bdf8', border: '1px solid rgba(255,255,255,0.05)' }}>
          GEOSEARCH active_drivers FROMLONLAT -122.41 37.77 BYRADIUS {radius} km ASC WITHDIST WITHCOORD
        </div>
      </div>
    </div>
  );
}
