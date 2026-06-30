"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HandHeart, ArrowLeft, CheckCircle2, MapPin, RadioTower, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

const ReportMap = dynamic(() => import('@/components/ReportMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 w-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center font-bold text-slate-500">Harita Yükleniyor...</div> 
});

export default function VolunteerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    vehicle: "yok",
    training: "hayir",
    resources: "",
    details: "",
  });
  
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasManuallyMoved, setHasManuallyMoved] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const profileStr = localStorage.getItem("crisis_user_profile");
    let name = "";
    let phone = "";
    let address = "";
    
    if (profileStr) {
      const p = JSON.parse(profileStr);
      name = `${p.firstName} ${p.lastName}`;
      phone = p.phone;
      address = p.address;
    } else {
      router.push("/register");
      return;
    }

    const savedData = localStorage.getItem("volunteer_form_draft");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: parsed.name || name,
        phone: parsed.phone || phone,
        address: parsed.address || address,
        vehicle: parsed.vehicle || "yok",
        training: parsed.training || "hayir",
        resources: parsed.resources || "",
        details: parsed.details || "",
      });
    } else {
      setFormData({ name, phone, address, vehicle: "yok", training: "hayir", resources: "", details: "" });
    }

    const updateLocationDisplay = () => {
      if (hasManuallyMoved) return;
      const locStr = localStorage.getItem("last_known_location");
      if (locStr) {
        const loc = JSON.parse(locStr);
        setMapLocation({ lat: loc.lat, lng: loc.lng });
      }
    };
    
    updateLocationDisplay();
    const locInterval = setInterval(updateLocationDisplay, 2000);
    
    const timeoutId = setTimeout(() => {
      if (!localStorage.getItem("last_known_location") && !hasManuallyMoved) {
        setGpsError(true);
        setMapLocation({ lat: 39.925533, lng: 32.866287 }); // Türkiye / Ankara geneli
        setHasManuallyMoved(true); // Stop polling overwrites
      }
    }, 6000);

    return () => {
      clearInterval(locInterval);
      clearTimeout(timeoutId);
    };
  }, [router, hasManuallyMoved]);

  useEffect(() => {
    localStorage.setItem("volunteer_form_draft", JSON.stringify(formData));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  const handleMapChange = (loc: { lat: number; lng: number }) => {
    setMapLocation(loc);
    setHasManuallyMoved(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      // (locationStr was unused, so removed)
      const newReport: Record<string, unknown> = {
        type: 'volunteer',
        name: formData.name,
        phone: formData.phone,
        vehicle: formData.vehicle,
        training: formData.training,
        resources: formData.resources,
        details: formData.details,
        lat: mapLocation?.lat,
        lng: mapLocation?.lng,
      };

      if (navigator.onLine) {
        const res = await fetch('/api/db/volunteers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport)
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("my_active_volunteer_id", data.id.toString());
          localStorage.setItem("my_active_volunteer_phone", formData.phone);
          alert(`Gönüllü bildiriminiz ve konumunuz AFAD sistemine başarıyla Supabase üzerinden iletildi!`);
        } else {
          throw new Error("Server error");
        }
      } else {
        // Çevrimdışı senaryo: Kuyruğa ekle
        const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
        newReport.id = Date.now();
        queue.push({ endpoint: '/api/db/volunteers', payload: newReport });
        localStorage.setItem("offline_sync_queue", JSON.stringify(queue));
        
        // Yerel yedeği (cache) güncelle
        const cache = JSON.parse(localStorage.getItem("volunteer_reports_cache") || "[]");
        localStorage.setItem("volunteer_reports_cache", JSON.stringify([newReport, ...cache]));
        
        localStorage.setItem("my_active_volunteer_phone", formData.phone);
        alert(`Cihazınız çevrimdışı. Gönüllü kaydınız yerel hafızaya alındı, internet geldiğinde iletilecektir.`);
      }

      localStorage.removeItem("volunteer_form_draft");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      
      // Fetch hata verirse de çevrimdışı gibi davranıp kuyruğa al
      const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
      const tempVol = { ...formData, type: 'volunteer', lat: mapLocation?.lat, lng: mapLocation?.lng, id: Date.now() };
      queue.push({ endpoint: '/api/db/volunteers', payload: tempVol });
      localStorage.setItem("offline_sync_queue", JSON.stringify(queue));
      
      const cache = JSON.parse(localStorage.getItem("volunteer_reports_cache") || "[]");
      localStorage.setItem("volunteer_reports_cache", JSON.stringify([tempVol, ...cache]));
      localStorage.setItem("my_active_volunteer_phone", formData.phone);
      
      alert(`Bağlantı hatası! Veri yerel hafızaya kaydedildi, internet düzelince gönderilecek.`);
      localStorage.removeItem("volunteer_form_draft");
      router.push("/dashboard");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-8">
      <Link href="/" className="inline-flex items-center text-primary-navy font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-5 h-5 mr-2" /> Geri Dön
      </Link>

      <div className="bg-white shadow-xl rounded-3xl p-6 md:p-8 border-t-8 border-primary-green relative overflow-hidden">
        
        {isSending && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <RadioTower className="w-20 h-20 text-primary-green mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary-navy">Kayıt İletiliyor...</h2>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-primary-navy flex items-center">
            <HandHeart className="w-8 h-8 text-primary-green mr-3" />
            Gönüllü / Kaynak Formu
          </h1>
          {saved && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Taslak Kaydedildi</span>}
        </div>

        {/* Live Location Map Box */}
        <div className={`border rounded-xl p-4 mb-6 ${gpsError ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
          <div className="flex items-start space-x-3 mb-4">
            <MapPin className={`w-6 h-6 shrink-0 mt-1 ${gpsError ? 'text-red-600 animate-pulse' : 'text-green-600'}`} />
            <div>
              <p className={`font-bold ${gpsError ? 'text-red-900' : 'text-green-900'}`}>
                {gpsError ? "GPS İzni Alınamadı!" : "Bulunduğunuz Konum"}
              </p>
              <p className={`text-xs mt-1 ${gpsError ? 'text-red-700 font-bold' : 'text-green-800'}`}>
                {gpsError 
                  ? "Cihazınızdan konum alamadık. Lütfen gitmek istediğiniz veya bulunduğunuz noktayı haritadan ELİNİZLE İŞARETLEYİN." 
                  : "Eğer farklı bir bölgeye yardım götürecekseniz pini o bölgeye sürükleyebilirsiniz."}
              </p>
            </div>
          </div>
          
          {mapLocation ? (
            <ReportMap location={mapLocation} onChange={handleMapChange} />
          ) : (
            <div className="h-64 w-full bg-slate-200 animate-pulse rounded-xl flex flex-col items-center justify-center text-slate-500">
              <MapPin className="w-8 h-8 mb-2 opacity-50" />
              <span>GPS verisi bekleniyor...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefon</label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Eğitim Durumu</label>
            <select 
              name="training" 
              value={formData.training} 
              onChange={handleChange}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 shadow-inner"
            >
              <option value="hayir">AFAD / AKUT Eğitimi Almadım (Standart Gönüllü)</option>
              <option value="evet_temel">Temel Arama Kurtarma Eğitimi Aldım</option>
              <option value="evet_ileri">İleri Seviye Profesyonel Kurtarmacıyım</option>
              <option value="saglik">Sağlık Personeliyim (Doktor/Hemşire/Paramedik vb.)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Sahip Olduğunuz Araç / Ekipman</label>
            <select 
              name="vehicle" 
              value={formData.vehicle} 
              onChange={handleChange}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 shadow-inner"
            >
              <option value="yok">Aracım/Ekipmanım Yok (Sadece İş Gücü)</option>
              <option value="binek">Standart Binek Araç (İnsan Taşıma)</option>
              <option value="4x4">4x4 Arazi Aracı (Zorlu Yollar İçin)</option>
              <option value="kamyonet">Kamyon / Kamyonet (Malzeme Taşıma)</option>
              <option value="is_makinesi">İş Makinesi (Vinç / Kepçe vb.)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Sağlayabileceğiniz Yardım / Kaynaklar</label>
            <textarea 
              name="resources"
              value={formData.resources}
              onChange={handleChange}
              rows={2}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 resize-none shadow-inner"
              placeholder="Örn: 50 koli su, 10 adet kışlık çadır, jeneratör..."
              required
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Eklemek İstedikleriniz (Notlar)</label>
            <textarea 
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows={2}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-green transition-colors font-medium text-slate-800 resize-none shadow-inner"
              placeholder="Varış saatiniz, ulaşılamama durumunda alternatif numara vb."
            ></textarea>
          </div>

          <button 
            type="submit"
            disabled={isSending || !mapLocation}
            className="w-full bg-primary-green hover:bg-green-800 text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-80"
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            <span>Gönüllü Kaydımı Gönder</span>
          </button>
          
        </form>
      </div>
    </div>
  );
}
