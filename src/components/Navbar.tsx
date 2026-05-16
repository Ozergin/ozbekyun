"use client";

import { useEffect, useState, useRef } from "react";
import { Wifi, WifiOff, ShieldAlert, MapPin, BookOpen, Menu, X } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasLocation, setHasLocation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-3">
            <Link href="/education" className="flex items-center text-xs font-bold bg-sky-500 text-white px-3 py-1.5 rounded-full hover:bg-sky-400 transition-colors">
              <BookOpen className="w-4 h-4 mr-1" /> Afet Rehberi
            </Link>
            <Link href="/dashboard" className="flex items-center text-xs font-bold bg-white text-primary-navy px-3 py-1.5 rounded-full hover:bg-slate-200 transition-colors">
              <ShieldAlert className="w-4 h-4 mr-1" /> AFAD Paneli
            </Link>
            {hasLocation && (
              <div className="flex items-center space-x-1 bg-white/10 px-3 py-1.5 rounded-full text-xs font-medium">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span>GPS</span>
              </div>
            )}
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded-full text-sm font-medium transition-colors">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span>Çevrimiçi</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-warning-amber" />
                  <span className="text-warning-amber">Çevrimdışı</span>
                </>
              )}
            </div>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex items-center space-x-3 sm:hidden">
            <div className="flex items-center space-x-1 bg-white/10 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors">
              {isOnline ? (
                <Wifi className="w-4 h-4 text-green-400" />
              ) : (
                <WifiOff className="w-4 h-4 text-warning-amber" />
              )}
            </div>
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition-colors focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden bg-slate-800 border-t border-slate-700 absolute top-full w-full left-0 shadow-xl">
          <div className="px-4 pt-4 pb-6 space-y-4 flex flex-col">
            <Link 
              href="/education" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center text-sm font-bold bg-sky-500 text-white px-4 py-3 rounded-xl hover:bg-sky-400 transition-colors"
            >
              <BookOpen className="w-5 h-5 mr-3" /> Afet Rehberi
            </Link>
            <Link 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center text-sm font-bold bg-white text-primary-navy px-4 py-3 rounded-xl hover:bg-slate-200 transition-colors"
            >
              <ShieldAlert className="w-5 h-5 mr-3" /> AFAD Paneli
            </Link>
            
            <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm">
              <div className="flex items-center space-x-2 text-slate-300">
                {hasLocation ? (
                  <><MapPin className="w-4 h-4 text-blue-400" /><span>GPS Aktif</span></>
                ) : (
                  <><MapPin className="w-4 h-4 text-slate-500" /><span>GPS Kapalı</span></>
                )}
              </div>
              <div className="flex items-center space-x-2 font-medium">
                {isOnline ? (
                  <><Wifi className="w-4 h-4 text-green-400" /><span className="text-green-400">Çevrimiçi</span></>
                ) : (
                  <><WifiOff className="w-4 h-4 text-warning-amber" /><span className="text-warning-amber">Çevrimdışı</span></>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
