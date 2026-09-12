import { NextResponse } from 'next/server';
import { nessieService } from '@/lib/nessie';

export async function GET() {
  try {
    // 1. Aseguramos que haya un cliente de prueba con datos
    const { customerId, accountId } = await nessieService.ensureSeedData();

    // 2. Traemos el detalle del cliente, la cuenta y sus movimientos
    const customer = await nessieService.getCustomer(customerId);
    const accounts = await nessieService.getCustomerAccounts(customerId);
    const purchases = await nessieService.getAccountPurchases(accountId);

    // 3. Formateamos la respuesta consolidada
    const mainAccount = accounts.find(a => a._id === accountId) || accounts[0];

    return NextResponse.json({
      customer: {
        firstName: customer.first_name,
        lastName: customer.last_name,
      },
      account: {
        id: mainAccount._id,
        balance: mainAccount.balance,
        type: mainAccount.type,
        nickname: mainAccount.nickname
      },
      transactions: purchases.map(p => ({
        id: p._id,
        amount: p.amount,
        date: p.purchase_date,
        description: p.description,
        status: p.status
      }))
    });

  } catch (error: any) {
    console.error("Nessie API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
