"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ReportMapProps {
  location: { lat: number; lng: number };
  onChange: (loc: { lat: number; lng: number }) => void;
}

export default function ReportMap({ location, onChange }: ReportMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerInstance = useRef<L.Marker | null>(null);

  useEffect(() => {
    // 1. Mount Phase: Sadece bir kere çalışır ve haritayı oluşturur.
    // React 19 ve Next.js turbopack uyumsuzluklarını aşmak için Vanilla Leaflet kullanıldı.
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current).setView([location.lat, location.lng], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const marker = L.marker([location.lat, location.lng], { draggable: true }).addTo(map);
      marker.bindPopup('Konumunuzu ayarlamak için beni sürükleyin!').openPopup();

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onChange({ lat: pos.lat, lng: pos.lng });
      });

      mapInstance.current = map;
      markerInstance.current = marker;
    }

    // 2. Unmount Phase: Haritayı bellekten ve DOM'dan tamamen temizle (SOLID Prensibi)
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Sadece ilk yüklemede çalışır.

  // 3. Update Phase: Dışarıdan location değişirse sadece görünümü (view) güncelle
  useEffect(() => {
    if (mapInstance.current && markerInstance.current) {
      mapInstance.current.setView([location.lat, location.lng]);
      markerInstance.current.setLatLng([location.lat, location.lng]);
    }
  }, [location.lat, location.lng]);

  return <div ref={mapRef} className="w-full h-64 rounded-xl overflow-hidden border-2 border-slate-300 shadow-inner z-0 relative" />;
}
