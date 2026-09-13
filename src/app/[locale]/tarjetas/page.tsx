import { ArrowLeft, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";

export default async function TarjetasPage() {
  const t = await getTranslations("Cards");
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">{t("title")}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-8 rounded-2xl shadow-lg text-white">
            <CreditCard className="w-10 h-10 mb-6 opacity-80" />
            <h3 className="text-xl font-bold">Capital One Quicksilver</h3>
            <p className="text-blue-100">{t("credit")}</p>
            <p className="text-2xl font-mono tracking-widest mb-4">**** **** **** 1234</p>
            <div className="flex justify-between items-center">
              <span className="font-bold">Roberto</span>
              <span>12/28</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
