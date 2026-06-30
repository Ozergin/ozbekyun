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

const iconP1 = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconP2 = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconP3 = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const iconVol = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface ReportMarker {
  id?: number;
  lat?: number;
  lng?: number;
  type?: string;
  name?: string;
  phone?: string;
  priority?: string;
  details?: string;
  vehicle?: string;
  training?: string;
  resources?: string;
}

export default function DashboardMap({ reports, focusedReportId, isWidget = false }: { reports: ReportMarker[], focusedReportId: number | null, isWidget?: boolean }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersLayer = useRef<L.LayerGroup | null>(null);

  // 1. Vanilla Leaflet Kurulumu (React-Leaflet yerine doğrudan entegrasyon)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const map = L.map(mapRef.current, {
        scrollWheelZoom: !isWidget,
        zoomControl: !isWidget
      }).setView([39.0, 35.0], isWidget ? 5 : 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);
      
      markersLayer.current = L.layerGroup().addTo(map);
      mapInstance.current = map;
    }

    // Unmount anında tamamen temizle
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // isWidget prop'u değiştiğinde haritayı güncelle (Tam Ekran geçişleri için)
  useEffect(() => {
    if (mapInstance.current) {
      if (isWidget) {
        mapInstance.current.scrollWheelZoom.disable();
      } else {
        mapInstance.current.scrollWheelZoom.enable();
        // Harita boyutu değiştiğinde tiles'ların gri kalmasını engeller
        setTimeout(() => mapInstance.current?.invalidateSize(), 300);
      }
    }
  }, [isWidget]);

  // 2. Raporlar değiştikçe pinleri güncelle
  useEffect(() => {
    if (!mapInstance.current || !markersLayer.current) return;
    
    markersLayer.current.clearLayers();
    const validReports = reports.filter((r): r is ReportMarker & { lat: number, lng: number } => r.lat !== undefined && r.lng !== undefined);
    
    validReports.forEach(r => {
      let icon = iconP3;
      let popupContent = '';

      if (r.type === 'volunteer') {
        icon = iconVol;
        popupContent = `
          <div style="font-family: sans-serif;">
            <strong style="color: #0284c7;">💙 GÖNÜLLÜ: ${r.name}</strong><br/>
            📞 ${r.phone}<br/>
            🛠️ <strong>Araç:</strong> ${r.vehicle}<br/>
            🎓 <strong>Eğitim:</strong> ${r.training}<br/>
            <p style="margin-top: 4px; font-size: 12px; color: #475569;">"${r.resources}"</p>
          </div>
        `;
      } else {
        icon = r.priority === 'P1' ? iconP1 : r.priority === 'P2' ? iconP2 : iconP3;
        popupContent = `
          <div style="font-family: sans-serif;">
            <strong>${r.name}</strong><br/>
            📞 ${r.phone}<br/>
            🚨 <strong>Öncelik: ${r.priority}</strong><br/>
            <p style="margin-top: 4px; font-size: 12px; color: #475569;">"${r.details}"</p>
          </div>
        `;
      }

      if (r.lat && r.lng) {
        const marker = L.marker([r.lat, r.lng], { icon });
        marker.bindPopup(popupContent);
        markersLayer.current?.addLayer(marker);
      }
    });

    // Eğer odaklanmış bir id yoksa tüm pinleri kapsayacak şekilde haritayı ortala
    if (!focusedReportId && validReports.length > 0) {
       const bounds = L.latLngBounds(validReports.map(r => [r.lat, r.lng]));
       if (bounds.isValid()) {
         mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
       }
    }
  }, [reports, focusedReportId]);

  // 3. Konumu Gör butonuna tıklandığında uçuş (FlyTo) animasyonu yap
  useEffect(() => {
    if (!mapInstance.current) return;
    if (focusedReportId) {
      const target = reports.find(r => r.id === focusedReportId);
      if (target && target.lat && target.lng) {
        mapInstance.current.flyTo([target.lat, target.lng], 16, { animate: true, duration: 1.5 });
      }
    }
  }, [focusedReportId, reports]);

  return <div ref={mapRef} className="w-full h-full rounded-3xl overflow-hidden shadow-xl z-0 relative border-4 border-white" />;
}
