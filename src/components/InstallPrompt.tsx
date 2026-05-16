"use client";

import { useState, useEffect } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // Uygulama zaten yüklüyse veya tarayıcı PWA modundaysa gizle
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // iOS Tespiti
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice && !standalone) {
      setIsInstallable(true);
    }

    // Android/Chrome PWA Kurulum Etkinliği (Event)
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Varsayılan pop-up'ı engelle
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSPrompt(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  // Eğer zaten PWA modundaysak hiçbir şey gösterme
  if (isStandalone || !isInstallable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex flex-col items-center">
      {/* iOS Yönlendirme Balonu */}
      {showIOSPrompt && (
        <div className="bg-slate-800 text-white p-4 rounded-2xl shadow-2xl mb-3 flex items-start space-x-3 w-full max-w-sm border border-slate-700 relative animate-in slide-in-from-bottom-2">
          <button 
            onClick={() => setShowIOSPrompt(false)} 
            className="absolute top-2 right-2 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="bg-primary-navy/50 p-2 rounded-xl">
            <Share className="w-6 h-6 text-sky-400" />
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">iPhone'a Yükle</h4>
            <p className="text-xs text-slate-300">
              Safari'nin alt menüsündeki <strong>Paylaş</strong> ikonuna basın, ardından aşağı kaydırıp <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.
            </p>
          </div>
        </div>
      )}

      {/* Ana Yükleme Butonu */}
      <button
        onClick={handleInstallClick}
        className="bg-white text-primary-navy font-bold px-6 py-3.5 rounded-full shadow-2xl flex items-center space-x-3 hover:bg-slate-100 transition-all active:scale-95 border-2 border-primary-navy/10 w-full max-w-sm justify-center"
      >
        <div className="bg-primary-navy text-white p-1.5 rounded-full">
          <Download className="w-5 h-5" />
        </div>
        <span>Uygulamayı Telefona İndir</span>
      </button>
    </div>
  );
}
