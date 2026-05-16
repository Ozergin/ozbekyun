"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, AlertTriangle, Wind, Droplets, Flame, X, ShieldCheck, ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const disasters = [
  {
    id: "deprem",
    title: "Deprem",
    subtitle: "Sarsıntı ve Sonrası",
    icon: <AlertTriangle className="w-8 h-8" />,
    image: "/education/deprem.png",
    color: "from-sky-500 to-blue-700",
    shadow: "shadow-blue-500/30",
    description: "Sarsıntı anında panik yapmadan hayatta kalmanızı sağlayacak, uzmanlarca onaylanmış kritik adımlar.",
    content: {
      before: [
        { text: "Evdeki ağır eşyaları (dolap, kitaplık) duvara çelik dübellerle sabitleyin." },
        { text: "İçinde su, fener ve radyo bulunan acil durum çantanızı hazırlayın." },
        { text: "Aile bireyleriyle dışarıda güvenli bir toplanma alanı belirleyin." }
      ],
      during: [
        { text: "Asla merdivenlere veya asansörlere koşmayın." },
        { text: "Sağlam bir eşyanın yanına ÇÖK, KAPAN, TUTUN hareketini uygulayın.", media: "/animations/cok_kapan.png" },
        { text: "Pencerelerden ve dış duvarlardan uzak durun." }
      ],
      after: [
        { text: "Sarsıntı tamamen bitince gaz, su ve elektriği ana vanadan kapatın.", media: "/animations/salter_kapat.png" },
        { text: "Binayı acil çıkış planına göre hızlıca ve asansör kullanmadan terk edin." },
        { text: "Artçı sarsıntılara karşı hazırlıklı olun, hasarlı binalara girmeyin." }
      ]
    }
  },
  {
    id: "sel",
    title: "Sel ve Taşkın",
    subtitle: "Su Baskınından Korunma",
    icon: <Droplets className="w-8 h-8" />,
    image: "/education/sel.png",
    color: "from-teal-400 to-emerald-600",
    shadow: "shadow-emerald-500/30",
    description: "Ani su baskınlarında güvenli bölgeye geçiş, hayatta kalma ve tahliye rehberi.",
    content: {
      before: [
        { text: "Bölgenizin sel riskini öğrenin ve yerel meteorolojik uyarıları takip edin." },
        { text: "Kıymetli evraklarınızı su geçirmez kapalı poşetlere koyun." },
        { text: "Bodrum katlarındaki önemli eşyaları üst katlara taşıyın." }
      ],
      during: [
        { text: "Hemen yüksek yerlere (tepeler, üst katlar) doğru tahliye olun." },
        { text: "Sel suyu içinde yürümeye veya araç kullanmaya çalışmayın (15 cm su insanı devirebilir)." },
        { text: "Kopan elektrik tellerine ve suya temas eden cihazlara dokunmayın." }
      ],
      after: [
        { text: "Sel sularıyla temas etmiş yiyecekleri (konserve dahil) tüketmeyin." },
        { text: "Bina çevresinde veya içinde hasar/çökme riskine karşı dikkatli olun." },
        { text: "Şebeke suyu yetkililer 'güvenli' diyene kadar kaynatılmadan içilmemelidir." }
      ]
    }
  },
  {
    id: "firtina",
    title: "Fırtına",
    subtitle: "Şiddetli Rüzgar",
    icon: <Wind className="w-8 h-8" />,
    image: "/education/firtina.png",
    color: "from-indigo-500 to-purple-700",
    shadow: "shadow-purple-500/30",
    description: "Yıkıcı rüzgarlar ve hortumlara karşı ev içi ve dışı tam korunma yöntemleri.",
    content: {
      before: [
        { text: "Pencere ve kapıları sağlamlaştırın, dışarıdaki uçabilecek eşyaları içeri alın.", media: "/animations/pencere_kapat.png" },
        { text: "Elektrik kesintilerine karşı şarjlı ışıldak ve powerbanklerinizi doldurun." },
        { text: "Ağaç ve direk devrilme riskine karşı aracınızı kapalı garaja veya açık alana alın." }
      ],
      during: [
        { text: "Kapı ve pencerelerden uzak, binanın en iç kısmında (koridor vb.) saklanın." },
        { text: "Açık alandaysanız hemen alçak bir hendeğe çöküp başınızı koruyun." },
        { text: "Köprü ve üstgeçit altlarına kesinlikle sığınmayın." }
      ],
      after: [
        { text: "Kopan elektrik tellerinden ve hasarlı yapılardan uzak durun." },
        { text: "Yetkililerin fırtına bitti uyarılarını bekleyin." },
        { text: "Gaz sızıntısı ihtimaline karşı kibrit veya çakmak kullanmayın." }
      ]
    }
  },
  {
    id: "yangin",
    title: "Yangın",
    subtitle: "Orman ve Şehir",
    icon: <Flame className="w-8 h-8" />,
    image: "/education/yangin.png",
    color: "from-orange-500 to-red-600",
    shadow: "shadow-red-500/30",
    description: "Hızlı yayılan alevlere karşı tahliye ve zehirli dumandan korunma adımları.",
    content: {
      before: [
        { text: "Evinizin etrafındaki kuru ot, yaprak ve yanıcı materyalleri temizleyin." },
        { text: "Hortum, kova ve yangın söndürme tüpünüzü kolay erişilebilir tutun." },
        { text: "Eğer risk bölgesindeyseniz erken tahliye çantanızı hazırda bulundurun." }
      ],
      during: [
        { text: "Yetkililerin tahliye uyarısına anında ve tartışmasız uyun." },
        { text: "Eğer duman yoğunsa, ıslak bir bezle ağzınızı/burnunuzu kapatarak yere yakın sürünerek ilerleyin.", media: "/animations/maske_tak.png" },
        { text: "Eğer alevler arasında kaldıysanız, bitki örtüsünün en az olduğu (veya yanmış) alana sığının." }
      ],
      after: [
        { text: "Bölgeye yetkililer izin vermeden kesinlikle geri dönmeyin." },
        { text: "Havadaki duman ve zehirli gazlara karşı N95 maske kullanın." },
        { text: "Evinizin çatısındaki veya bahçesindeki gizli közlere dikkat edin." }
      ]
    }
  }
];

// Animasyon Varyantları
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const modalListVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.3 } }
};

const modalListItemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function EducationPage() {
  const [activeCard, setActiveCard] = useState<any | null>(null);

  return (
    <div className="flex-1 flex flex-col w-full min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-x-hidden">
      
      {/* Dynamic Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px]" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[30%] -right-[10%] w-[35%] h-[50%] rounded-full bg-sky-300/20 blur-[120px]" 
        />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-12 z-10">
        
        {/* Navigation */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-12">
          <Link href="/" className="group inline-flex items-center text-slate-500 font-bold hover:text-primary-navy transition-colors bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md border border-slate-200">
            <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" /> 
            Geri Dön
          </Link>
        </motion.div>

        {/* Hero Header */}
        <div className="text-center mb-16 relative">
          <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="inline-flex items-center justify-center p-5 bg-gradient-to-br from-sky-400 to-blue-600 rounded-[2rem] shadow-2xl shadow-blue-500/30 mb-8"
          >
            <BookOpen className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="text-5xl md:text-7xl font-black tracking-tight text-slate-800 mb-6 drop-shadow-sm"
          >
            Afet & Hayatta Kalma
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.2 }} 
            className="text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto font-medium"
          >
            Modern, bilimsel ve hayat kurtaran yönergeler. Geleceği kontrol edemeyiz, ancak ona <strong>hazır olabiliriz.</strong>
          </motion.p>
        </div>

        {/* Modern Interactive Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10"
        >
          {disasters.map((d) => (
            <motion.div
              key={d.id}
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCard(d)}
              className={`bg-white rounded-[2.5rem] overflow-hidden shadow-xl ${d.shadow} cursor-pointer group flex flex-col h-[28rem] relative border border-slate-100 transition-all duration-300`}
            >
              <div className="relative h-3/5 w-full overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/80 z-10 transition-opacity duration-500`}></div>
                <Image 
                  src={d.image} 
                  alt={d.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-110" 
                />
                
                {/* Floating Title on Image */}
                <div className="absolute bottom-6 left-8 z-20">
                  <span className="bg-white/20 backdrop-blur-md text-white/90 text-sm font-bold px-3 py-1 rounded-full mb-2 inline-block border border-white/20">
                    {d.subtitle}
                  </span>
                  <h2 className="text-3xl font-black text-white flex items-center drop-shadow-md">
                    {d.title}
                  </h2>
                </div>
              </div>

              <div className="p-8 h-2/5 flex flex-col justify-between bg-white z-20">
                <p className="text-slate-500 font-medium text-lg line-clamp-2 leading-relaxed">
                  {d.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm font-bold text-slate-400 group-hover:text-sky-500 transition-colors flex items-center">
                    <Info className="w-4 h-4 mr-1" /> Rehberi İncele
                  </span>
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${d.color} flex items-center justify-center text-white shadow-lg transform group-hover:rotate-45 transition-transform duration-300`}>
                    <ArrowRight className="w-6 h-6 -rotate-45" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Cinematic Expandable Modal */}
        <AnimatePresence>
          {activeCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              {/* Blur Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                transition={{ duration: 0.3 }}
                onClick={() => setActiveCard(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xl cursor-pointer"
              />
              
              {/* Modal Content */}
              <motion.div 
                layoutId={activeCard.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="bg-slate-50 rounded-[2.5rem] shadow-2xl w-full max-w-5xl h-[90vh] md:h-[80vh] overflow-hidden relative z-10 flex flex-col md:flex-row border border-white/50"
              >
                {/* Left: Image Hero */}
                <div className="relative h-64 md:h-full md:w-2/5 shrink-0 overflow-hidden">
                  <Image src={activeCard.image} alt={activeCard.title} fill className="object-cover" />
                  <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${activeCard.color} opacity-60 mix-blend-multiply`}></div>
                  
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveCard(null)}
                    className="absolute top-6 left-6 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-colors border border-white/30 shadow-2xl z-50"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                  
                  <div className="absolute bottom-10 left-8 right-8 z-20">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                      className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6 border border-white/30"
                    >
                      {activeCard.icon}
                    </motion.div>
                    <motion.h2 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                      className="text-5xl font-black text-white drop-shadow-xl mb-2"
                    >
                      {activeCard.title}
                    </motion.h2>
                    <motion.p 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                      className="text-white/80 font-medium text-lg"
                    >
                      {activeCard.subtitle}
                    </motion.p>
                  </div>
                </div>

                {/* Right: Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-12 bg-white/50">
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-10"
                  >
                    <p className="text-lg text-slate-600 font-medium leading-relaxed">
                      {activeCard.description} Bu modern hayatta kalma rehberi, kriz anında reflekslerinizi doğru yönlendirmek için özel olarak tasarlanmıştır.
                    </p>
                  </motion.div>

                  <motion.div variants={modalListVariants} initial="hidden" animate="show" className="space-y-8">
                    
                    {/* Before Card */}
                    <motion.div variants={modalListItemVariants} className="group bg-white p-8 rounded-[2rem] shadow-md shadow-sky-100/50 border border-sky-100 hover:border-sky-300 transition-colors relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-sky-100 to-transparent rounded-bl-[100px] -z-10 opacity-50"></div>
                      <h3 className="text-2xl font-black text-sky-900 mb-6 flex items-center">
                        <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mr-4">
                          <ShieldCheck className="w-6 h-6" />
                        </span>
                        Afet Öncesi (Hazırlık)
                      </h3>
                      <ul className="space-y-4">
                        {activeCard.content.before.map((item: any, i: number) => (
                          <li key={i} className="flex flex-col text-slate-700 font-medium text-lg">
                            <div className="flex items-start">
                              <span className="w-2 h-2 rounded-full bg-sky-400 mt-2.5 mr-4 shrink-0 shadow-sm shadow-sky-300"></span>
                              <span className="leading-relaxed">{item.text}</span>
                            </div>
                            {item.media && (
                              <div className="mt-4 ml-6 rounded-2xl overflow-hidden border-4 border-slate-100 shadow-sm w-full sm:max-w-xs transition-transform hover:scale-105">
                                <img src={item.media} alt="Öğretici Animasyon" className="w-full h-auto object-cover" />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* During Card */}
                    <motion.div variants={modalListItemVariants} className="group bg-white p-8 rounded-[2rem] shadow-md shadow-red-100/50 border border-red-100 hover:border-red-300 transition-colors relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-100 to-transparent rounded-bl-[100px] -z-10 opacity-50"></div>
                      <h3 className="text-2xl font-black text-red-900 mb-6 flex items-center">
                        <span className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mr-4">
                          <AlertTriangle className="w-6 h-6" />
                        </span>
                        Afet Anında (Hayatta Kalma)
                      </h3>
                      <ul className="space-y-4">
                        {activeCard.content.during.map((item: any, i: number) => (
                          <li key={i} className="flex flex-col text-slate-700 font-medium text-lg">
                            <div className="flex items-start">
                              <span className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-4 shrink-0 shadow-sm shadow-red-300"></span>
                              <span className="leading-relaxed">{item.text}</span>
                            </div>
                            {item.media && (
                              <div className="mt-4 ml-6 rounded-2xl overflow-hidden border-4 border-red-50 shadow-sm w-full sm:max-w-xs transition-transform hover:scale-105">
                                <img src={item.media} alt="Öğretici Animasyon" className="w-full h-auto object-cover" />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                    {/* After Card */}
                    <motion.div variants={modalListItemVariants} className="group bg-white p-8 rounded-[2rem] shadow-md shadow-emerald-100/50 border border-emerald-100 hover:border-emerald-300 transition-colors relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-100 to-transparent rounded-bl-[100px] -z-10 opacity-50"></div>
                      <h3 className="text-2xl font-black text-emerald-900 mb-6 flex items-center">
                        <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mr-4">
                          <BookOpen className="w-6 h-6" />
                        </span>
                        Afet Sonrası (Kurtuluş)
                      </h3>
                      <ul className="space-y-4">
                        {activeCard.content.after.map((item: any, i: number) => (
                          <li key={i} className="flex flex-col text-slate-700 font-medium text-lg">
                            <div className="flex items-start">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2.5 mr-4 shrink-0 shadow-sm shadow-emerald-300"></span>
                              <span className="leading-relaxed">{item.text}</span>
                            </div>
                            {item.media && (
                              <div className="mt-4 ml-6 rounded-2xl overflow-hidden border-4 border-emerald-50 shadow-sm w-full sm:max-w-xs transition-transform hover:scale-105">
                                <img src={item.media} alt="Öğretici Animasyon" className="w-full h-auto object-cover" />
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </motion.div>

                  </motion.div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
