import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { nessieService } from "@/lib/nessie";

export default async function MovimientosPage() {
  const t = await getTranslations("Transactions");
  
  let transactions: any[] = [];
  try {
    const data = await nessieService.getDashboardData();
    transactions = data.transactions || [];
  } catch (err) {
    console.error("Failed to load transactions", err);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">{t("title")}</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-xl text-slate-600 mb-6">{t("description")}</p>
          
          <ul className="space-y-4">
            {transactions.length === 0 ? (
              <p>{t("noTransactions")}</p>
            ) : (
              transactions.map((tx: any, idx: number) => (
                <li key={idx} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-bold text-slate-800">
                      {tx.type === "deposit" ? t("deposit") : t("purchase")} {t("to")} {tx.payee_id || tx.merchant_id || t("externalAccount")}
                    </p>
                    <p className="text-slate-500">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-red-600 text-lg">-${tx.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </main>
  );
}
