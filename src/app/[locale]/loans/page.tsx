import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";
import { nessieService } from "@/lib/nessie";

export default async function LoansPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "Dashboard" });
  
  // Fetch data
  const bankingData = await nessieService.getDashboardData();
  const loans = bankingData.loans || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans pb-32">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center text-blue-600 font-bold hover:underline">
            <ArrowLeft className="w-5 h-5 mr-2" />
            {t("backToHome")}
          </Link>
        </header>

        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center mb-8">
            <div className="w-16 h-16 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center mr-4">
              <Landmark className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800">{t("myLoans")}</h2>
              <p className="text-slate-600">
                {t("myLoansDesc")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {loans.length === 0 ? (
              <p className="text-slate-500 text-center py-8">
                {t("noLoans")}
              </p>
            ) : (
              loans.map((loan: any) => (
                <div key={loan.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 gap-4 md:gap-0">
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{loan.description}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase">{loan.status === "active" ? t("active") : loan.status}</p>
                  </div>
                  <div className="text-left md:text-right flex flex-col md:items-end w-full md:w-auto">
                    <p className="font-black text-slate-800 text-xl">${loan.amount} <span className="text-sm font-normal text-slate-500">total</span></p>
                    <p className="text-sm font-bold text-blue-600 mt-1">${loan.monthly} / {t("monthly")}</p>
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
