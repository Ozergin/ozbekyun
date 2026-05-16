"use client";

import { useEffect, useState, useRef } from "react";
import { Wifi, WifiOff, ShieldAlert, MapPin, BookOpen } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Geolocation tracking
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            timestamp: new Date().toISOString(),
          };
          localStorage.setItem("last_known_location", JSON.stringify(loc));
          setHasLocation(true);
        },
        (error) => {
          console.error("GPS Error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-primary-navy text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <ShieldAlert className="w-8 h-8 text-warning-amber" />
            <span className="font-bold text-xl tracking-tight">CrisisGrid</span>
          </Link>

          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/education" className="flex items-center text-xs font-bold bg-sky-500 text-white px-2.5 py-1.5 sm:px-3 rounded-full hover:bg-sky-400 transition-colors" title="Afet Rehberi">
              <BookOpen className="w-4 h-4 sm:mr-1" /> <span className="hidden sm:inline">Afet Rehberi</span>
            </Link>
            <Link href="/dashboard" className="flex items-center text-xs font-bold bg-white text-primary-navy px-2.5 py-1.5 sm:px-3 rounded-full hover:bg-slate-200 transition-colors" title="AFAD Yönetim Paneli">
              <ShieldAlert className="w-4 h-4 sm:mr-1 sm:hidden" /> <span className="hidden sm:inline">AFAD Paneli</span>
            </Link>
            {hasLocation && (
              <div className="hidden sm:flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>GPS</span>
              </div>
            )}
            <div className="flex items-center space-x-1 sm:space-x-2 bg-white/10 px-2.5 py-1.5 sm:px-3 rounded-full text-xs sm:text-sm font-medium transition-colors">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="hidden sm:inline">Çevrimiçi</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-warning-amber" />
                  <span className="hidden sm:inline text-warning-amber">Çevrimdışı</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
