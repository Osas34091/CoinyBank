import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";
import { nessieService } from "@/lib/nessie";

export default async function BillsPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  
  // Fetch data
  const bankingData = await nessieService.getDashboardData();
  const bills = bankingData.bills || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center text-blue-600 font-bold hover:underline">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {locale === 'en' ? 'Back to Home' : 'Volver al Inicio'}
          </Link>
        </header>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-red-100 text-red-700 rounded-2xl flex items-center justify-center mr-4">
              <Receipt className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">{t("upcomingBills")}</h2>
              <p className="text-slate-600">
                {locale === 'en' ? 'Manage your upcoming payments.' : 'Administra tus próximos pagos.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {bills.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                {locale === 'en' ? 'No pending bills.' : 'No tienes recibos pendientes.'}
              </p>
            ) : (
              bills.map((bill: any) => (
                <div key={bill.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{bill.payee}</p>
                    <p className="text-sm text-slate-500">Ref: {bill.nickname}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{bill.status} • {bill.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-red-600 text-xl">-${bill.amount}</p>
                    <button className="bg-blue-600 text-white font-bold py-1 px-4 rounded-lg mt-2 text-sm hover:bg-blue-700 transition-colors">
                      {t("pay")}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
