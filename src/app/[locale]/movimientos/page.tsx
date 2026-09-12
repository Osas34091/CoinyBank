import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export default function MovimientosPage() {
  const t = useTranslations("Transactions");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/nessie')
      .then(res => res.json())
      .then(data => {
        setTransactions(data.transactions || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);
  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" /> {t("back")}
        </Link>
        <h1 className="text-3xl font-extrabold text-slate-800 mb-6">{t("title")}</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <p className="text-xl text-slate-600 mb-6">Aquí podrás ver el historial de tus compras y depósitos.</p>
          
          <ul className="space-y-4">
            {isLoading ? (
              <p className="text-slate-500">{t("loading")}</p>
            ) : transactions.length === 0 ? (
              <p>No tienes movimientos recientes.</p>
            ) : (
              transactions.map((tx, idx) => (
                <li key={idx} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-bold text-slate-800">
                      {tx.type === "deposit" ? t("deposit") : t("purchase")} a {tx.payee_id || tx.merchant_id || "Cuenta Externa"}
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
