import { ArrowRightLeft, CreditCard, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { getTranslations } from "next-intl/server";
import { nessieService } from "@/lib/nessie";

export default async function Home() {
  const t = await getTranslations("Dashboard");
  
  let bankingData: any = null;
  let error: string | null = null;
  try {
    bankingData = await nessieService.getDashboardData();
  } catch (err: any) {
    error = err.message;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <header className="flex justify-between items-center border-b-2 border-slate-200 pb-6">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-800">
              {t("hello")}, {bankingData?.customer?.firstName || t("user")}
            </h1>
            <p className="text-xl text-slate-600 mt-2">{t("welcome")}</p>
          </div>
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            {t("secureConnection")}
          </div>
        </header>

        <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-bold text-slate-700 mb-2">{t("totalBalance")}</h2>
          <p className="text-6xl font-black text-blue-700">
            {bankingData 
              ? `$${bankingData.account.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
              : t("loading")} 
            {bankingData && <span className="text-2xl text-slate-500 ml-2">MXN</span>}
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <Link 
            href="/movimientos"
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 block"
          >
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center mb-4">
              <ArrowRightLeft className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("recentTransactions")}</h3>
            <p className="text-slate-600 text-sm">{t("recentTransactionsDesc")}</p>
          </Link>

          <Link 
            href="/tarjetas"
            className="text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer outline-none focus:ring-4 focus:ring-blue-200 block"
          >
            <div className="w-14 h-14 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t("myCards")}</h3>
            <p className="text-slate-600 text-sm">{t("myCardsDesc")}</p>
          </Link>
          
          {/* Próximos Pagos (Bills) */}
          <div className="text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200 block">
            <h3 className="text-xl font-bold mb-2 text-slate-800">{t("upcomingBills")}</h3>
            <p className="text-slate-600 text-sm mb-4">{t("upcomingBillsDesc")}</p>
            {bankingData?.bills?.slice(0, 2).map((bill: any) => (
              <div key={bill.id} className="flex justify-between items-center py-2 border-t border-slate-100 mt-2">
                <div>
                  <p className="font-bold text-slate-700">{bill.payee}</p>
                  <p className="text-xs text-slate-500">{bill.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">-${bill.amount}</p>
                  <button className="text-xs text-blue-600 font-bold hover:underline mt-1">{t("pay")}</button>
                </div>
              </div>
            ))}
          </div>

          {/* Préstamos (Loans) */}
          <div className="text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200 block">
            <h3 className="text-xl font-bold mb-2 text-slate-800">{t("myLoans")}</h3>
            <p className="text-slate-600 text-sm mb-4">{t("myLoansDesc")}</p>
            {bankingData?.loans?.slice(0, 2).map((loan: any) => (
              <div key={loan.id} className="flex flex-col py-2 border-t border-slate-100 mt-2">
                <div className="flex justify-between items-center">
                  <p className="font-bold text-slate-700">{loan.description}</p>
                  <p className="font-black text-slate-800">${loan.amount}</p>
                </div>
                <p className="text-xs text-slate-500 mt-1">${loan.monthly} / {t("monthly")}</p>
              </div>
            ))}
          </div>

        </section>

        <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-2xl mt-8">
          <h3 className="text-xl font-bold text-yellow-800 mb-2">{t("needHelp")}</h3>
          <p className="text-lg text-yellow-900" dangerouslySetInnerHTML={{ __html: t.raw("coinyHelp").replace('<coiny>', '<strong>').replace('</coiny>', '</strong>') }}>
          </p>
        </div>

      </div>

    </main>
  );
}
