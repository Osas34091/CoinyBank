import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";

export default async function BillsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center text-blue-600 font-bold hover:underline">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al Inicio
          </Link>
        </header>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Receipt className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4">{t("upcomingBills")}</h2>
          <p className="text-slate-600 text-lg">Esta sección está en construcción.</p>
        </section>
      </div>
    </div>
  );
}
