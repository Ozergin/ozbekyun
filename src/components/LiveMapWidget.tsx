"use client";

import { useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { Maximize2, Minimize2, MapPin } from "lucide-react";

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { 
  ssr: false, 
  loading: () => (
    <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center flex-col text-slate-400">
      <MapPin className="w-10 h-10 mb-2" />
      <span>Harita Yükleniyor...</span>
    </div>
  ) 
});

export default function LiveMapWidget() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reports, setReports] = useState<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const fetchWidgetData = async () => {
      // Çevrimdışıysa cache'den al
      const cachedVictims = JSON.parse(localStorage.getItem("crisis_reports_cache") || "[]");
      const cachedVols = JSON.parse(localStorage.getItem("volunteer_reports_cache") || "[]");
      const allCached = [...cachedVictims, ...cachedVols];
      
      if (allCached.length > 0) {
        setReports(allCached);
      }

      // İnternet varsa canlı veriyi al
      if (navigator.onLine) {
        try {
          const [resVictims, resVols] = await Promise.all([
            fetch('/api/db/reports'),
            fetch('/api/db/volunteers')
          ]);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let combined: any[] = [];
          if (resVictims.ok) combined = [...combined, ...(await resVictims.json())];
          if (resVols.ok) combined = [...combined, ...(await resVols.json())];
          
          if (combined.length > 0) {
            setReports(combined);
          }
        } catch {
          console.error("Widget veri çekme hatası");
        }
      }
    };

    fetchWidgetData();
    // Ana sayfada bataryayı korumak için 15 saniyede bir poll yapalım
    const interval = setInterval(fetchWidgetData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={
      isFullscreen 
        ? "fixed inset-0 z-[100] w-full h-full bg-slate-900" 
        : "w-full rounded-2xl overflow-hidden h-96 relative flex items-center justify-center border border-slate-300 shadow-xl group"
    }>
      
      {/* Harita Bileşeni */}
      <div className="absolute inset-0 z-0 pointer-events-auto">
        <DashboardMap reports={reports} focusedReportId={null} isWidget={!isFullscreen} />
      </div>

      {/* Üst Bilgi Katmanı */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-xl font-bold text-primary-navy shadow-lg flex items-center border border-slate-200">
          <span className="relative flex h-3 w-3 mr-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          Canlı Kriz Haritası
        </span>
      </div>

      {/* Tam Ekran Butonu */}
      <div className="absolute bottom-4 right-4 z-10">
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="bg-primary-navy hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-2 transition-transform transform hover:scale-105 active:scale-95 border-2 border-white/20"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="w-5 h-5" />
              <span>Küçült</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-5 h-5" />
              <span>Tam Ekran Büyüt</span>
            </>
          )}
        </button>
      </div>
      
    </div>
  );
}
