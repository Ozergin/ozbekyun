"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

const isValidTCKN = (tckn: string) => {
  if (tckn.length !== 11 || tckn[0] === '0') return false;
  const digits = tckn.split('').map(Number);
  
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  
  let digit10 = (oddSum * 7 - evenSum) % 10;
  if (digit10 < 0) digit10 += 10;
  const digit11 = (oddSum + evenSum + digits[9]) % 10;
  
  return digits[9] === digit10 && digits[10] === digit11;
};

export default function ProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    tckn: "",
    phone: "",
    address: "",
    bloodType: "Bilinmiyor",
    medicalInfo: "",
  });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [tcknError, setTcknError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const profileStr = localStorage.getItem("crisis_user_profile");
    if (profileStr) {
      const parsed = JSON.parse(profileStr);
      setFormData({
        firstName: parsed.firstName || "",
        lastName: parsed.lastName || "",
        tckn: parsed.tckn || "",
        phone: parsed.phone || "",
        address: parsed.address || "",
        bloodType: parsed.bloodType || "Bilinmiyor",
        medicalInfo: parsed.medicalInfo || "",
      });
    } else {
      router.push("/register");
    }
    setIsLoaded(true);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "tckn") {
      setTcknError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.tckn && !isValidTCKN(formData.tckn)) {
      setTcknError("Geçersiz T.C. Kimlik Numarası");
      return;
    }

    localStorage.setItem("crisis_user_profile", JSON.stringify(formData));
    setShowSuccess(true);
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  if (!isLoaded) return null;

  return (
    <div className="max-w-md mx-auto w-full px-4 py-8">
      <Link href="/" className="inline-flex items-center text-primary-navy font-semibold mb-6 hover:underline">
        <ArrowLeft className="w-5 h-5 mr-2" /> Geri Dön
      </Link>

      <div className="bg-white shadow-xl rounded-3xl p-6 md:p-8 border-t-8 border-primary-navy relative">
        {showSuccess && (
          <div className="absolute inset-0 bg-white/95 z-10 flex flex-col items-center justify-center rounded-3xl">
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-primary-navy">Profil Güncellendi</h2>
            <p className="text-slate-600 mt-2">Ana sayfaya yönlendiriliyorsunuz...</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center mb-8 space-y-4">
          <UserCircle className="w-16 h-16 text-primary-navy" />
          <h1 className="text-3xl font-extrabold text-primary-navy text-center">Profilimi Güncelle</h1>
          <p className="text-slate-500 text-center text-sm font-medium">
            Kişisel ve sağlık bilgilerinizi buradan güncelleyebilirsiniz.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Adınız</label>
              <input 
                type="text" 
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Soyadınız</label>
              <input 
                type="text" 
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">T.C. Kimlik Numarası <span className="text-xs font-normal text-slate-400">(Opsiyonel)</span></label>
            <input 
              type="text" 
              name="tckn"
              value={formData.tckn}
              onChange={handleChange}
              maxLength={11}
              className={`w-full bg-slate-50 border-2 rounded-xl px-4 py-3 focus:outline-none transition-colors ${tcknError ? 'border-red-500 focus:border-red-600' : 'border-slate-200 focus:border-primary-navy'}`}
            />
            {tcknError && <p className="text-red-500 text-xs font-bold mt-1">{tcknError}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Telefon Numaranız</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Açık Adresiniz</label>
            <textarea 
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors resize-none"
              required
            ></textarea>
          </div>
          
          <div className="pt-4 border-t border-slate-200">
            <h3 className="font-bold text-primary-navy mb-3">Sağlık Bilgileriniz (Önemli)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kan Grubunuz</label>
                <select 
                  name="bloodType"
                  value={formData.bloodType}
                  onChange={handleChange}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors"
                >
                  <option value="Bilinmiyor">Bilinmiyor</option>
                  <option value="A+">A Rh (+)</option>
                  <option value="A-">A Rh (-)</option>
                  <option value="B+">B Rh (+)</option>
                  <option value="B-">B Rh (-)</option>
                  <option value="AB+">AB Rh (+)</option>
                  <option value="AB-">AB Rh (-)</option>
                  <option value="0+">0 Rh (+)</option>
                  <option value="0-">0 Rh (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Kronik Hastalık / İlaçlar <span className="text-xs font-normal text-slate-400">(Opsiyonel)</span></label>
                <textarea 
                  name="medicalInfo"
                  value={formData.medicalInfo}
                  onChange={handleChange}
                  rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary-navy hover:bg-slate-800 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 mt-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Bilgileri Güncelle</span>
          </button>
        </form>
      </div>
    </div>
  );
}
