"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, HandHeart, Radio, MapPin, UserCircle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import InstallPrompt from "@/components/InstallPrompt";
import BluetoothMesh from "@/components/BluetoothMesh";

export default function Home() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [userProfile, setUserProfile] = useState<{firstName: string, phone: string} | null>(null);
  
  // Kullanıcının kendi aktif çağrıları
  const [myActiveReport, setMyActiveReport] = useState<any>(null);
  const [myActiveVolunteer, setMyActiveVolunteer] = useState<any>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem("crisis_user_profile");
    if (!profileStr) {
      router.push("/register");
    } else {
      const profile = JSON.parse(profileStr);
      setUserProfile(profile);

      // Çevrimdışı senkronizasyon kuyruğunu işle
      const processOfflineQueue = async () => {
        if (!navigator.onLine) return;
        
        const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
        if (queue.length === 0) return;

        let remainingQueue = [];
        let syncedCount = 0;

        for (const item of queue) {
          try {
            // ID'yi geçici vermiştik, veritabanı kendi ID atasın diye siliyoruz
            const payloadToSend = { ...item.payload };
            delete payloadToSend.id;

            const res = await fetch(item.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payloadToSend)
            });
            if (res.ok) {
              const data = await res.json();
              syncedCount++;
              
              // Başarıyla senkronize olunca kendi aktif ID'sini de güncelle
              if (item.endpoint === '/api/db/reports') {
                localStorage.setItem("my_active_report_id", data.id.toString());
              } else if (item.endpoint === '/api/db/volunteers') {
                localStorage.setItem("my_active_volunteer_id", data.id.toString());
              }
            } else {
              remainingQueue.push(item);
            }
          } catch (e) {
            remainingQueue.push(item);
          }
        }
        
        localStorage.setItem("offline_sync_queue", JSON.stringify(remainingQueue));
        if (syncedCount > 0) {
          alert(`${syncedCount} adet çevrimdışı taslak başarıyla merkeze iletildi!`);
        }
      };

      // Kendi çağrısını önce Cache'den bul
      const cachedReports = JSON.parse(localStorage.getItem("crisis_reports_cache") || "[]");
      const activeRep = cachedReports.find((r: any) => r.phone === profile.phone);
      if (activeRep) setMyActiveReport(activeRep);

      const cachedVols = JSON.parse(localStorage.getItem("volunteer_reports_cache") || "[]");
      const activeVol = cachedVols.find((r: any) => r.phone === profile.phone);
      if (activeVol) setMyActiveVolunteer(activeVol);

      // Arka planda API'den günceli çek ve Cache'i tazele
      const fetchMyRecords = async () => {
        try {
          const [resRep, resVol] = await Promise.all([
            fetch('/api/db/reports'),
            fetch('/api/db/volunteers')
          ]);
          
          if (resRep.ok) {
            const reports = await resRep.json();
            localStorage.setItem("crisis_reports_cache", JSON.stringify(reports));
            const liveRep = reports.find((r: any) => r.phone === profile.phone);
            setMyActiveReport(liveRep || null);
          }

          if (resVol.ok) {
            const vols = await resVol.json();
            localStorage.setItem("volunteer_reports_cache", JSON.stringify(vols));
            const liveVol = vols.find((r: any) => r.phone === profile.phone);
            setMyActiveVolunteer(liveVol || null);
          }
        } catch (e) {
          console.log("Offline mode: Using cached records.");
        }
      };
      
      processOfflineQueue().then(fetchMyRecords);
    }
  }, [router]);

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => setSyncing(false), 3000);
  };

  const handleCancelReport = async () => {
    if(!confirm("Yardım çağrınızı silmek ve 'Kurtarıldım' olarak işaretlemek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/db/reports?id=${myActiveReport.id}`, { method: 'DELETE' });
      setMyActiveReport(null);
      localStorage.removeItem('my_active_report_id');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelVolunteer = async () => {
    if(!confirm("Gönüllü kaydınızı silmek istediğinize emin misiniz?")) return;
    try {
      await fetch(`/api/db/volunteers?id=${myActiveVolunteer.id}`, { method: 'DELETE' });
      setMyActiveVolunteer(null);
      localStorage.removeItem('my_active_volunteer_id');
    } catch (e) {
      console.error(e);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="flex-1 flex flex-col items-center justify-center w-full px-4 py-8 max-w-5xl mx-auto">
      
      {/* User Status Bar */}
      <div className="w-full flex justify-end mb-4">
        <div className="flex items-center space-x-2 text-slate-600 font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
          <UserCircle className="w-5 h-5 text-primary-navy" />
          <span>Kayıtlı Profil: {userProfile.firstName}</span>
        </div>
      </div>

      {/* Kullanıcının Kendi Aktif Çağrıları (Silme/Kurtarılma Alanı) */}
      {(myActiveReport || myActiveVolunteer) && (
        <div className="w-full space-y-4 mb-8">
          {myActiveReport && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border-2 border-red-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                <div>
                  <h3 className="font-bold text-red-900 text-lg">Aktif Yardım Çağrınız Yayında</h3>
                  <p className="text-sm text-red-700">Ekiplere konumunuz iletiliyor. Güvendeyseniz çağrıyı iptal edebilirsiniz.</p>
                </div>
              </div>
              <button 
                onClick={handleCancelReport}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Kurtarıldım / Çağrıyı Sil</span>
              </button>
            </motion.div>
          )}

          {myActiveVolunteer && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border-2 border-blue-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3 mb-3 sm:mb-0">
                <HandHeart className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-bold text-blue-900 text-lg">Gönüllü Kaydınız Aktif</h3>
                  <p className="text-sm text-blue-700">Görev tamamlandıysa veya iptal etmek isterseniz kaydınızı silebilirsiniz.</p>
                </div>
              </div>
              <button 
                onClick={handleCancelVolunteer}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Görevi Bitir / Sil</span>
              </button>
            </motion.div>
          )}
        </div>
      )}

      {/* Hero Section */}
      <div className="w-full space-y-8 text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary-navy">
          Hızlı Afet Yönetimi
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Güvenli, çevrimdışı çalışabilen ve anında müdahale için tasarlanmış acil durum koordinasyon ağı.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Link href="/report?type=need_help" className={`block w-full ${myActiveReport ? 'pointer-events-none opacity-50' : ''}`}>
            <motion.div 
              whileHover={!myActiveReport ? { scale: 1.02 } : {}}
              whileTap={!myActiveReport ? { scale: 0.98 } : {}}
              className="bg-primary-navy hover:bg-slate-800 text-white rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center space-y-4 h-64 border-4 border-transparent hover:border-warning-amber transition-colors"
            >
              <AlertTriangle className="w-16 h-16 text-warning-amber" />
              <h2 className="text-2xl font-bold">YARDIMA İHTİYACIM VAR</h2>
              <span className="text-slate-300 font-medium text-center">Son GPS Konumunuz ile Kurtarma Talebi Oluşturun</span>
            </motion.div>
          </Link>

          <Link href="/volunteer" className={`block w-full ${myActiveVolunteer ? 'pointer-events-none opacity-50' : ''}`}>
            <motion.div 
              whileHover={!myActiveVolunteer ? { scale: 1.02 } : {}}
              whileTap={!myActiveVolunteer ? { scale: 0.98 } : {}}
              className="bg-primary-green hover:bg-green-800 text-white rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center space-y-4 h-64 border-4 border-transparent hover:border-green-400 transition-colors"
            >
              <HandHeart className="w-16 h-16 text-green-200" />
              <h2 className="text-2xl font-bold">YARDIM ETMEK İSTİYORUM</h2>
              <span className="text-green-100 font-medium text-center">Gönüllü ve Kaynak Bildiriminde Bulunun</span>
            </motion.div>
          </Link>
        </div>
      </div>
      
      {/* PWA Install Prompt - Sadece anasayfada yüklü değilse çıkar */}
      <InstallPrompt />
      
      {/* Real Web Bluetooth Gossip Protocol Simulation */}
      <BluetoothMesh />

      {/* Map Mock */}
      <div className="w-full bg-slate-200 rounded-2xl overflow-hidden h-80 relative flex items-center justify-center border border-slate-300 shadow-inner">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%230f172a\\' fill-opacity=\\'0.4\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')" }}></div>
        <div className="z-10 flex flex-col items-center space-y-2">
          <MapPin className="w-12 h-12 text-primary-navy" />
          <span className="bg-white/90 px-4 py-2 rounded-lg font-semibold text-primary-navy shadow">
            Acil Durum Haritası (Cluster Görünümü)
          </span>
        </div>
        
        {/* Mock Pins */}
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-1/4 left-1/4 bg-warning-amber text-white font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          3
        </motion.div>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="absolute bottom-1/3 right-1/3 bg-red-600 text-white font-bold w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          12
        </motion.div>
        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="absolute top-1/2 right-1/4 bg-primary-green text-white font-bold w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
          1
        </motion.div>
      </div>

    </div>
  );
}
