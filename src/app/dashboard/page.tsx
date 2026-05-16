"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ArrowLeft, MapPin, Phone, User, Clock, HandHeart, Truck, BookOpen, Package, Trash2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

const DashboardMap = dynamic(() => import('@/components/DashboardMap'), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-slate-200 animate-pulse rounded-3xl border-4 border-white"></div> 
});

export default function DashboardPage() {
  const [victimReports, setVictimReports] = useState<any[]>([]);
  const [volunteerReports, setVolunteerReports] = useState<any[]>([]);
  const [focusedId, setFocusedId] = useState<number | null>(null);
  
  // Tab State: 'victims' veya 'volunteers'
  const [activeTab, setActiveTab] = useState<'victims' | 'volunteers'>('victims');

  useEffect(() => {
    const fetchReports = async () => {
      // Önce yerel önbellekten (Cache) yükle ki çevrimdışıysa ekran boşalmasın
      const cachedVictims = JSON.parse(localStorage.getItem("crisis_reports_cache") || "[]");
      const cachedVols = JSON.parse(localStorage.getItem("volunteer_reports_cache") || "[]");
      if (cachedVictims.length > 0) setVictimReports(cachedVictims);
      if (cachedVols.length > 0) setVolunteerReports(cachedVols);

      // Sonra arka planda API'den güncel veriyi çekmeye çalış (İnternet varsa)
      try {
        const [resVictims, resVols] = await Promise.all([
          fetch('/api/db/reports'),
          fetch('/api/db/volunteers')
        ]);
        
        if (resVictims.ok) {
          const data = await resVictims.json();
          setVictimReports(data);
          localStorage.setItem("crisis_reports_cache", JSON.stringify(data)); // Cache'i tazele
        }
        
        if (resVols.ok) {
          const data = await resVols.json();
          setVolunteerReports(data);
          localStorage.setItem("volunteer_reports_cache", JSON.stringify(data)); // Cache'i tazele
        }
      } catch (err) {
        // Hata verirse (çevrimdışı vb.) sessizce yut, çünkü zaten ekranda Cache verisi var!
        console.log("Offline mode: Using cached data.");
      }
    };
    
    fetchReports();
    const interval = setInterval(fetchReports, 5000); // 5 saniyede bir poll
    return () => clearInterval(interval);
  }, []);

  // Haritada her ikisini de aynı anda göstermek stratejik olarak mantıklıdır (Yakındaki gönüllüyü görmek için)
  const allReportsForMap = [...victimReports, ...volunteerReports];
  const activeList = activeTab === 'victims' ? victimReports : volunteerReports;

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-8">
      <Link href="/" className="inline-flex items-center text-primary-navy font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-5 h-5 mr-2" /> Ana Sayfaya Dön
      </Link>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary-navy flex items-center">
            <ShieldAlert className="w-10 h-10 mr-3 text-warning-amber" />
            AFAD Koordinasyon Merkezi
          </h1>
          <p className="text-slate-600 mt-2 font-medium">Sahadan gelen yardım talepleri ve gönüllü kaynakları</p>
        </div>
        <div className="bg-primary-navy text-white px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="font-bold text-sm">Canlı Sistem Aktif</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-slate-200 p-1.5 rounded-2xl w-full md:w-max">
        <button 
          onClick={() => setActiveTab('victims')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'victims' 
            ? 'bg-white text-red-600 shadow-md' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Yardım Bekleyenler ({victimReports.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('volunteers')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
            activeTab === 'volunteers' 
            ? 'bg-white text-blue-600 shadow-md' 
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-300'
          }`}
        >
          <HandHeart className="w-5 h-5" />
          <span>Gönüllüler / Kaynaklar ({volunteerReports.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dynamic List */}
        <div className="lg:col-span-2 space-y-4 h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          
          {activeList.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-dashed border-slate-300 mt-4">
              <p className="text-slate-500 font-medium">Bu kategoride şu an kayıt bulunmuyor.</p>
            </div>
          ) : (
            activeList.map((r) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={r.id} 
                className={`bg-white rounded-2xl p-5 shadow-md border-l-8 ${
                  focusedId === r.id ? 'ring-2 ring-primary-navy shadow-lg ' : ''
                } ${
                  activeTab === 'volunteers' ? 'border-blue-500 bg-blue-50/20' :
                  r.priority === 'P1' ? 'border-red-500 bg-red-50/30' : 
                  r.priority === 'P2' ? 'border-amber-500 bg-amber-50/30' : 
                  'border-green-500 bg-green-50/30'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    {activeTab === 'victims' ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold text-white ${
                        r.priority === 'P1' ? 'bg-red-500' : 
                        r.priority === 'P2' ? 'bg-amber-500' : 
                        'bg-green-500'
                      }`}>Öncelik: {r.priority}</span>
                    ) : (
                      <span className="px-2 py-1 rounded text-xs font-bold text-white bg-blue-500 flex items-center">
                        <HandHeart className="w-3 h-3 mr-1" /> Gönüllü
                      </span>
                    )}
                    <span className="text-xs font-medium text-slate-500 flex items-center"><Clock className="w-3 h-3 mr-1"/> {new Date(r.timestamp).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {r.lat && r.lng && (
                      <button 
                        onClick={() => setFocusedId(r.id)}
                        className="bg-primary-navy hover:bg-slate-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span className="hidden sm:inline">Konumu Haritada Gör</span>
                      </button>
                    )}
                  </div>
                </div>
                
                {/* List Content based on Tab */}
                {activeTab === 'victims' ? (
                  <>
                    <p className="text-lg font-bold text-slate-800 mb-2">"{r.details}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 mt-4 bg-white/50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center space-x-2"><User className="w-4 h-4 text-primary-navy" /> <span className="font-medium">{r.name}</span></div>
                      <div className="flex items-center space-x-2"><Phone className="w-4 h-4 text-primary-navy" /> <span>{r.phone}</span></div>
                      <div className="flex items-center space-x-2 md:col-span-2"><MapPin className="w-4 h-4 text-primary-navy shrink-0" /> <span>{r.address}</span></div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-800 mb-2"><span className="text-slate-500 text-sm font-normal">Sağlayacağı Kaynak:</span> <br/> "{r.resources}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600 mt-4 bg-white/50 p-3 rounded-lg border border-slate-100">
                      <div className="flex items-center space-x-2"><User className="w-4 h-4 text-primary-navy" /> <span className="font-medium">{r.name}</span></div>
                      <div className="flex items-center space-x-2"><Phone className="w-4 h-4 text-primary-navy" /> <span>{r.phone}</span></div>
                      <div className="flex items-center space-x-2"><Truck className="w-4 h-4 text-blue-600" /> <span className="font-medium">Araç:</span> <span className="uppercase">{r.vehicle}</span></div>
                      <div className="flex items-center space-x-2"><BookOpen className="w-4 h-4 text-blue-600" /> <span className="font-medium">Eğitim:</span> <span className="uppercase">{r.training}</span></div>
                      {r.details && <div className="flex items-center space-x-2 md:col-span-2"><Package className="w-4 h-4 text-slate-400" /> <span className="italic text-slate-500">Not: {r.details}</span></div>}
                    </div>
                  </>
                )}
                
              </motion.div>
            ))
          )}
        </div>

        {/* Map View */}
        <div className="lg:col-span-1">
          <div className="h-[700px] sticky top-24">
            {/* Haritada her zaman ikisini de göster ki kim kime yakın bilinsin! */}
            <DashboardMap reports={allReportsForMap} focusedReportId={focusedId} />
          </div>
        </div>

      </div>
    </div>
  );
}
