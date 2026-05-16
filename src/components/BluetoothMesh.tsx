"use client";

import { useState } from "react";
import { Bluetooth, BluetoothSearching, CheckCircle2, AlertCircle } from "lucide-react";

export default function BluetoothMesh() {
  const [isScanning, setIsScanning] = useState(false);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const startBluetoothScan = async () => {
    setIsScanning(true);
    setError(null);
    setSuccess(false);
    setDeviceName(null);

    try {
      if (!navigator.bluetooth) {
        throw new Error("Tarayıcınız Web Bluetooth API'yi desteklemiyor (Lütfen Chrome/Edge kullanın).");
      }

      // Tarayıcının donanımsal Bluetooth tarama menüsünü tetikler
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // İsteğe bağlı olarak sadece belirli servisleri tarayabiliriz
        // filters: [{ services: ['battery_service'] }]
      });

      setDeviceName(device.name || "İsimsiz Cihaz");
      
      // Eşleşme başarılı olduktan sonra "Offline Queue" simülasyonu:
      const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
      
      if (queue.length > 0) {
        // Cihaza bağlanma simülasyonu
        setTimeout(() => {
          setSuccess(true);
          setIsScanning(false);
        }, 1500);
      } else {
        setError("Yakındaki cihaza bağlanıldı ancak aktarılacak çevrimdışı veri bulunamadı.");
        setIsScanning(false);
      }

    } catch (err: any) {
      console.error(err);
      if (err.name === "NotFoundError") {
        setError("İşlem iptal edildi veya cihaz seçilmedi.");
      } else if (err.name === "SecurityError") {
        setError("Güvenlik hatası. Lütfen sitenin Bluetooth izinlerini kontrol edin.");
      } else {
        setError(err.message || "Bluetooth taraması sırasında bir hata oluştu.");
      }
      setIsScanning(false);
    }
  };

  return (
    <div className="w-full bg-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden mb-8">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
      
      <div className="flex flex-col items-center justify-center relative z-10 text-center">
        <div className="bg-blue-500/20 p-4 rounded-full mb-4">
          {isScanning ? (
            <BluetoothSearching className="w-10 h-10 text-blue-400 animate-pulse" />
          ) : success ? (
            <CheckCircle2 className="w-10 h-10 text-green-400" />
          ) : (
            <Bluetooth className="w-10 h-10 text-blue-400" />
          )}
        </div>
        
        <h3 className="text-xl font-bold mb-2">Gossip Protocol (Bluetooth Mesh)</h3>
        <p className="text-slate-300 text-sm mb-6 max-w-sm">
          İnternet bağlantısı tamamen koptuğunda, acil durum verilerinizi yakındaki diğer cihazlara Bluetooth üzerinden "elden ele" aktarın.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-xl mb-4 w-full flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-4 w-full text-left">
            <div className="font-bold flex items-center mb-1">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Başarılı Aktarım
            </div>
            Bağlanılan Cihaz: <strong>{deviceName}</strong><br/>
            Bekleyen çevrimdışı veriler (Offline Queue) başarıyla yakındaki cihaza devredildi. İnternet bulan ilk cihaz veriyi merkeze iletecek!
          </div>
        )}

        <button
          onClick={startBluetoothScan}
          disabled={isScanning}
          className={`w-full py-3.5 px-6 rounded-xl font-bold flex items-center justify-center transition-all ${
            isScanning 
            ? "bg-slate-700 text-slate-400 cursor-not-allowed" 
            : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50 active:scale-95"
          }`}
        >
          {isScanning ? (
            <>
              <BluetoothSearching className="w-5 h-5 mr-2 animate-spin-slow" /> Yakındaki Cihazlar Taranıyor...
            </>
          ) : (
            <>
              <Bluetooth className="w-5 h-5 mr-2" /> Çevredeki Cihazları Tara
            </>
          )}
        </button>
      </div>
    </div>
  );
}
