import { NextResponse } from 'next/server';
import { generateAssistantResponse } from '@/lib/ollama-mock';
import { nessieService } from '@/lib/nessie';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, lang } = body;

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // 1. Extraemos el contexto de Nessie (Saldo y Movimientos) para inyectarlo en el Cerebro (LLM)
    const { customerId, accountId } = await nessieService.ensureSeedData();
    const accounts = await nessieService.getCustomerAccounts(customerId);
    const purchases = await nessieService.getAccountPurchases(accountId);
    
    const mainAccount = accounts.find(a => a._id === accountId) || accounts[0];
    
    const bankingContext = {
      balance: mainAccount.balance,
      recentTransactions: purchases.slice(0, 5) // Contexto de las últimas 5 transacciones
    };

    // 2. Pasamos el contexto al "Cerebro"
    // NOTA: Cuando el VPS esté listo, cambiaremos `generateAssistantResponse` por un fetch real a Ollama (localhost:11434)
    const response = await generateAssistantResponse(bankingContext, message, lang);

    return NextResponse.json(response);

  } catch (error: any) {
    console.error("Chat API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
