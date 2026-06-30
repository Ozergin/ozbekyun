"use client";

import { useEffect } from "react";

export default function OfflineSyncManager() {
  useEffect(() => {
    const processOfflineQueue = async () => {
      if (!navigator.onLine) return;
      
      const queue = JSON.parse(localStorage.getItem("offline_sync_queue") || "[]");
      if (queue.length === 0) return;

      const remainingQueue = [];
      let syncedCount = 0;

      for (const item of queue) {
        try {
          const payloadToSend = { ...item.payload };
          delete payloadToSend.id; // Geçici ID'yi sil

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
        } catch {
          remainingQueue.push(item);
        }
      }
      
      localStorage.setItem("offline_sync_queue", JSON.stringify(remainingQueue));
      if (syncedCount > 0) {
        alert(`${syncedCount} adet çevrimdışı taslak başarıyla merkeze iletildi!`);
        
        // Cache'i güncellemek için arka planda fetch yap (isteğe bağlı)
        window.dispatchEvent(new Event('offline-sync-completed'));
      }
    };

    // 1. Bileşen yüklendiğinde (ve internet varsa) çalıştır
    processOfflineQueue();

    // 2. İnternet bağlantısı geldiği an tetikle
    window.addEventListener('online', processOfflineQueue);

    return () => {
      window.removeEventListener('online', processOfflineQueue);
    };
  }, []);

  return null; // Arayüzü olmayan, sadece arka planda çalışan bir bileşen
}
