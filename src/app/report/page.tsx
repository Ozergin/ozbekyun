"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, CheckCircle2, MapPin, RadioTower, Loader2, Mic, MicOff } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

const ReportMap = dynamic(() => import('@/components/ReportMap'), { 
  ssr: false, 
  loading: () => <div className="h-64 w-full bg-slate-200 animate-pulse rounded-xl flex items-center justify-center font-bold text-slate-500">Harita Yükleniyor...</div> 
});

export default function ReportPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    details: "",
  });
  
  const [mapLocation, setMapLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasManuallyMoved, setHasManuallyMoved] = useState(false);
  const [gpsError, setGpsError] = useState(false);

  const [priority, setPriority] = useState<"P1" | "P2" | "P3" | null>(null);
  const [saved, setSaved] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [aiReason, setAiReason] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const triageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Voice Recognition State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  // Load from local storage
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

    const savedData = localStorage.getItem("crisis_form_draft");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: parsed.name || name,
        phone: parsed.phone || phone,
        address: parsed.address || address,
        details: parsed.details || "",
      });
    } else {
      setFormData({ name, phone, address, details: "" });
    }

    const updateLocationDisplay = () => {
      if (hasManuallyMoved) return; // Do not overwrite if user moved pin
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

  const fallbackTriage = (text: string) => {
    const t = text.toLowerCase();
    if (t.includes("kanama") || t.includes("mahsur") || t.includes("nefes") || t.includes("oksijen") || t.includes("kalp") || t.includes("enkaz")) {
      setPriority("P1");
      setAiReason("İnternet yok: Çevrimdışı kelime bazlı analiz (Kritik)");
    } else if (t.includes("yaralı") || t.includes("kırık") || t.includes("su") || t.includes("yardım")) {
      setPriority("P2");
      setAiReason("İnternet yok: Çevrimdışı kelime bazlı analiz (Acil)");
    } else if (text.length > 5) {
      setPriority("P3");
      setAiReason("İnternet yok: Çevrimdışı kelime bazlı analiz (Hafif)");
    } else {
      setPriority(null);
      setAiReason("");
    }
  };

  // Tüm form verisi değiştiğinde taslağı kaydet
  useEffect(() => {
    localStorage.setItem("crisis_form_draft", JSON.stringify(formData));
  }, [formData]);

  // AI Triage API Call (Debounced)
  useEffect(() => {
    const text = formData.details;
    if (text.length < 10) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPriority(null);
      setAiReason("");
      return;
    }

    if (triageTimeoutRef.current) {
      clearTimeout(triageTimeoutRef.current);
    }

    triageTimeoutRef.current = setTimeout(async () => {
      setIsAnalyzing(true);
      if (navigator.onLine) {
        try {
          const res = await fetch('/api/triage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ details: text })
          });
          const data = await res.json();
          if (data.priority) {
            setPriority(data.priority);
            setAiReason(data.reason || "");
          } else {
            fallbackTriage(text);
          }
        } catch {
          fallbackTriage(text);
        }
      } else {
        fallbackTriage(text);
      }
      setIsAnalyzing(false);
    }, 1500);

    return () => {
      if (triageTimeoutRef.current) clearTimeout(triageTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.details]);



  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Ses kesildiğinde otomatik kapanması için false yapıldı
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "tr-TR";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              currentTranscript += transcript + " ";
            }
          }
          
          if (currentTranscript) {
            setFormData(prev => ({
              ...prev,
              details: prev.details ? prev.details + " " + currentTranscript : currentTranscript
            }));
            setSaved(true);
            setTimeout(() => setSaved(false), 1000);
          }
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      alert("Tarayıcınız sesli komut özelliğini desteklemiyor.");
      return;
    }
    
    // Web Speech API genellikle internet gerektirir. Kullanıcıyı bilgilendiriyoruz.
    if (!navigator.onLine) {
      alert("⚠️ Cihazınız çevrimdışı olduğu için tarayıcının sesli asistanı çalışamaz.\n\nBUNUN YERİNE: Telefonunuzun KENDİ KLAVYESİNDE bulunan 'Mikrofon' tuşuna basarak çevrimdışı sesli yazdırma yapabilirsiniz!");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  const handleMapChange = (loc: { lat: number; lng: number }) => {
    setMapLocation(loc);
    setHasManuallyMoved(true); // User took control
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    if (isListening) recognitionRef.current?.stop();
    
    try {
      const profileStr = localStorage.getItem("crisis_user_profile");
      let medicalContext = "";
      if (profileStr) {
        const p = JSON.parse(profileStr);
        if (p.bloodType && p.bloodType !== "Bilinmiyor") {
          medicalContext += `\n[Kan Grubu: ${p.bloodType}]`;
        }
        if (p.medicalInfo && p.medicalInfo.trim() !== "") {
          medicalContext += `\n[Sağlık Bilgisi: ${p.medicalInfo}]`;
        }
      }

      const finalDetails = formData.details + (medicalContext ? `\n---${medicalContext}` : "");

      const locationStr = mapLocation ? `${mapLocation.lat.toFixed(6)}, ${mapLocation.lng.toFixed(6)}` : "Konum Yok";
      
      const newReport: Record<string, unknown> = {
        type: 'victim',
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        details: finalDetails,
        lat: mapLocation?.lat,
        lng: mapLocation?.lng,
        priority: priority || "P3",
      };

      if (navigator.onLine) {
        const res = await fetch('/api/db/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReport)
        });
        
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("my_active_report_id", data.id.toString());
          localStorage.setItem("my_active_report_phone", formData.phone);
          alert(`Yardım talebiniz ve konumunuz (${locationStr}) CANLI olarak Supabase'e iletildi!`);
        } else {
          throw new Error("Server error");
        }
      } else {
        // Çevrimdışı senaryo: Kuyruğa ekle
        const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
        newReport.id = Date.now(); // Geçici ID
        queue.push({ endpoint: '/api/db/reports', payload: newReport });
        localStorage.setItem("offline_sync_queue", JSON.stringify(queue));
        
        // Yerel yedeği (cache) de güncelle ki dashboard'da hemen görünsün
        const cache = JSON.parse(localStorage.getItem("crisis_reports_cache") || "[]");
        localStorage.setItem("crisis_reports_cache", JSON.stringify([newReport, ...cache]));
        
        localStorage.setItem("my_active_report_phone", formData.phone);
        alert(`Cihazınız çevrimdışı. Çağrınız yerel hafızaya alındı, internet geldiğinde gönderilecek!`);
      }

      localStorage.removeItem("crisis_form_draft");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      
      // Fetch hata verdiyse de çevrimdışı gibi davranıp kuyruğa al
      const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
      const tempReport = { ...formData, type: 'victim', priority: priority || "P3", lat: mapLocation?.lat, lng: mapLocation?.lng, id: Date.now() };
      queue.push({ endpoint: '/api/db/reports', payload: tempReport });
      localStorage.setItem("offline_sync_queue", JSON.stringify(queue));
      
      const cache = JSON.parse(localStorage.getItem("crisis_reports_cache") || "[]");
      localStorage.setItem("crisis_reports_cache", JSON.stringify([tempReport, ...cache]));
      localStorage.setItem("my_active_report_phone", formData.phone);
      
      alert(`Bağlantı hatası yaşandı! Veri yerel hafızaya kaydedildi, internet düzelince gönderilecek.`);
      localStorage.removeItem("crisis_form_draft");
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

      <div className="bg-white shadow-xl rounded-3xl p-6 md:p-8 border-t-8 border-primary-navy relative overflow-hidden">
        
        {isSending && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
              <RadioTower className="w-20 h-20 text-warning-amber mb-4" />
            </motion.div>
            <h2 className="text-2xl font-bold text-primary-navy">Merkeze İletiliyor...</h2>
            <p className="text-slate-600 mt-2 font-medium">Canlı WebSocket Bağlantısı Kuruluyor</p>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-extrabold text-primary-navy">Yardım İste</h1>
          {saved && <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Taslak Kaydedildi</span>}
        </div>

        {/* Live Location Map Box */}
        <div className={`border rounded-xl p-4 mb-6 ${gpsError ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
          <div className="flex items-start space-x-3 mb-4">
            <MapPin className={`w-6 h-6 shrink-0 mt-1 ${gpsError ? 'text-red-600 animate-pulse' : 'text-blue-600'}`} />
            <div>
              <p className={`font-bold ${gpsError ? 'text-red-900' : 'text-blue-900'}`}>
                {gpsError ? "GPS İzni Alınamadı!" : "Haritadan Konumunuzu İşaretleyin"}
              </p>
              <p className={`text-xs mt-1 ${gpsError ? 'text-red-700 font-bold' : 'text-blue-700'}`}>
                {gpsError 
                  ? "Cihazınızdan konum alamadık. Lütfen harita üzerinden tam konumunuzu ELİNİZLE İŞARETLEYİN." 
                  : "GPS'ten otomatik alınan konum haritada işaretlenmiştir. Eğer yanlışlık varsa pini doğru bölgeye sürükleyip bırakabilirsiniz."}
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
              <label className="block text-sm font-bold text-slate-700 mb-2">Ad Soyad <span className="text-xs text-slate-400 font-normal">(Değiştirilebilir)</span></label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors font-medium text-slate-800 shadow-inner"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Telefon <span className="text-xs text-slate-400 font-normal">(Değiştirilebilir)</span></label>
              <input 
                type="text" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors font-medium text-slate-800 shadow-inner"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Açık Adres <span className="text-xs text-slate-400 font-normal">(Profilinizden alındı, güncelleyebilirsiniz)</span></label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full bg-white border-2 border-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors font-medium text-slate-800 shadow-inner resize-none"
              required
            ></textarea>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-slate-700">Durum Detayları (Yapay Zeka Destekli)</label>
              <button
                type="button"
                onClick={toggleListening}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'bg-primary-navy text-white hover:bg-slate-800'
                }`}
              >
                {isListening ? (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Dinleniyor...</span>
                  </>
                ) : (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Sesli Dikte (Konuş)</span>
                  </>
                )}
              </button>
            </div>
            
            <textarea 
              name="details"
              value={formData.details}
              onChange={handleChange}
              rows={4}
              className={`w-full bg-white border-2 rounded-xl px-4 py-4 focus:outline-none text-lg transition-colors resize-none shadow-inner ${
                isListening ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-primary-navy'
              }`}
              placeholder="Neler oluyor? Yaralı var mı? (Örn: Enkaz altında mahsur kalan var, kanama var) Sesli veya klavye ile yazabilirsiniz."
              required
            ></textarea>
          </div>

          {/* AI Priority Indicator */}
          {priority && (
            <div className={`p-4 rounded-xl flex items-start space-x-3 border-l-4 transition-colors duration-500 ${
              priority === 'P1' ? 'bg-red-50 border-red-500 text-red-800' :
              priority === 'P2' ? 'bg-amber-50 border-amber-500 text-amber-800' :
              'bg-green-50 border-green-500 text-green-800'
            }`}>
              {isAnalyzing ? (
                <Loader2 className="w-6 h-6 shrink-0 mt-0.5 animate-spin text-slate-500" />
              ) : (
                <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold flex items-center">
                  Gemini AI Triyaj Tahmini: Öncelik {priority}
                </p>
                <p className="text-sm font-medium italic mt-1 text-slate-700">
                  {isAnalyzing ? "Gemini analiz ediyor..." : `"${aiReason}"`}
                </p>
              </div>
            </div>
          )}

          <button 
            type="submit"
            disabled={isSending || !mapLocation}
            className="w-full bg-primary-navy hover:bg-slate-800 text-white font-extrabold text-xl py-5 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 disabled:opacity-80"
          >
            {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            <span>Harita Konumunu Gönder</span>
          </button>
          
        </form>
      </div>
    </div>
  );
}
