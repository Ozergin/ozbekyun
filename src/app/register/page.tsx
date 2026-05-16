"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("crisis_user_profile", JSON.stringify(formData));
    router.push("/");
  };

  return (
    <div className="max-w-md mx-auto w-full px-4 py-12">
      <div className="bg-white shadow-xl rounded-3xl p-6 md:p-8 border-t-8 border-primary-navy">
        <div className="flex flex-col items-center justify-center mb-8 space-y-4">
          <ShieldAlert className="w-16 h-16 text-primary-navy" />
          <h1 className="text-3xl font-extrabold text-primary-navy text-center">Sisteme Kayıt Ol</h1>
          <p className="text-slate-500 text-center text-sm font-medium">
            Afet anında size en hızlı şekilde ulaşabilmemiz için bilgilerinizi yerel olarak cihazınıza kaydediyoruz. İnternet olmasa bile bilgileriniz güvende.
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
            <label className="block text-sm font-bold text-slate-700 mb-1">Telefon Numaranız</label>
            <input 
              type="tel" 
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-primary-navy transition-colors"
              placeholder="05XX XXX XX XX"
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
              placeholder="Mahalle, Sokak, Bina No, İlçe/İl"
              required
            ></textarea>
          </div>

          <button 
            type="submit"
            className="w-full bg-primary-navy hover:bg-slate-800 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-95 mt-4"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Kaydı Tamamla</span>
          </button>
        </form>
      </div>
    </div>
  );
}
