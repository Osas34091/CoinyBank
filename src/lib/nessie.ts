export const NESSIE_BASE_URL = "http://api.nessieisreal.com";

const getApiKey = () => {
  const key = process.env.NESSIE_API_KEY;
  if (!key) throw new Error("NESSIE_API_KEY is missing");
  return key;
};

// Types
export interface Customer {
  _id: string;
  first_name: string;
  last_name: string;
  address: {
    street_number: string;
    street_name: string;
    city: string;
    state: string;
    zip: string;
  };
}

export interface Account {
  _id: string;
  type: string;
  nickname: string;
  rewards: number;
  balance: number;
  customer_id: string;
}

export interface Transaction {
  _id: string;
  type: string;
  merchant_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  status: string;
  transaction_date?: string;
  purchase_date?: string;
  description: string;
}

export interface Bill {
  _id: string;
  status: string;
  payee: string;
  nickname: string;
  payment_date: string;
  payment_amount: number;
}

export interface Loan {
  _id: string;
  type: string;
  status: string;
  amount: number;
  monthly_payment: number;
  description: string;
}

export const nessieService = {
  // Get all customers (useful for testing)
  async getCustomers(): Promise<Customer[]> {
    const response = await fetch(`${NESSIE_BASE_URL}/customers?key=${getApiKey()}`);
    if (!response.ok) throw new Error("Failed to fetch customers");
    return response.json();
  },

  // Get specific customer by ID
  async getCustomer(customerId: string): Promise<Customer> {
    try {
      const response = await fetch(`${NESSIE_BASE_URL}/customers/${customerId}?key=${getApiKey()}`);
      if (!response.ok) throw new Error("Failed to fetch customer");
      return await response.json();
    } catch (e) {
      return { _id: customerId, first_name: "Roberto", last_name: "García (Modo Offline)", address: { street_number: "123", street_name: "Avenida", city: "MTY", state: "NL", zip: "64000" } };
    }
  },

  // Get accounts for a customer
  async getCustomerAccounts(customerId: string): Promise<Account[]> {
    try {
      const response = await fetch(`${NESSIE_BASE_URL}/customers/${customerId}/accounts?key=${getApiKey()}`);
      if (!response.ok) throw new Error("Failed to fetch accounts");
      return await response.json();
    } catch (e) {
      return [{ _id: "mock-acc-456", type: "Checking", nickname: "Cuenta Pensión Offline", rewards: 0, balance: 14500.00, customer_id: customerId }];
    }
  },

  // Get purchases (transactions) for an account
  async getAccountPurchases(accountId: string): Promise<Transaction[]> {
    try {
      const response = await fetch(`${NESSIE_BASE_URL}/accounts/${accountId}/purchases?key=${getApiKey()}`);
      if (!response.ok) throw new Error("Failed to fetch purchases");
      return await response.json();
    } catch (e) {
      const today = new Date().toISOString();
      return [
        { _id: "t1", type: "merchant", merchant_id: "m1", payer_id: "u1", payee_id: "u2", amount: 500, status: "pending", transaction_date: today, description: "Farmacias del Ahorro" },
        { _id: "t2", type: "merchant", merchant_id: "m2", payer_id: "u1", payee_id: "u2", amount: 299, status: "pending", transaction_date: today, description: "Netflix" }
      ];
    }
  },

  // Get bills for an account
  async getAccountBills(accountId: string): Promise<Bill[]> {
    try {
      const response = await fetch(`${NESSIE_BASE_URL}/accounts/${accountId}/bills?key=${getApiKey()}`);
      if (!response.ok) throw new Error("Failed to fetch bills");
      return await response.json();
    } catch (e) {
      return [
        { _id: "b1", status: "pending", payee: "CFE", nickname: "Luz", payment_date: "2026-09-30", payment_amount: 350.50 }
      ];
    }
  },

  // Get loans for an account
  async getAccountLoans(accountId: string): Promise<Loan[]> {
    try {
      const response = await fetch(`${NESSIE_BASE_URL}/accounts/${accountId}/loans?key=${getApiKey()}`);
      if (!response.ok) throw new Error("Failed to fetch loans");
      return await response.json();
    } catch (e) {
      return [
        { _id: "l1", type: "personal", status: "active", amount: 5000, monthly_payment: 500, description: "Préstamo Personal" }
      ];
    }
  },

  // ---- MÉTODOS DE ESCRITURA (SEEDING) ----
  
  async createCustomer(data: any): Promise<Customer> {
    const response = await fetch(`${NESSIE_BASE_URL}/customers?key=${getApiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.objectCreated;
  },

  async createAccount(customerId: string, data: any): Promise<Account> {
    const response = await fetch(`${NESSIE_BASE_URL}/customers/${customerId}/accounts?key=${getApiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.objectCreated;
  },

  async createMerchant(data: any): Promise<any> {
    const response = await fetch(`${NESSIE_BASE_URL}/merchants?key=${getApiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.objectCreated;
  },

  async createPurchase(accountId: string, data: any): Promise<Transaction> {
    const response = await fetch(`${NESSIE_BASE_URL}/accounts/${accountId}/purchases?key=${getApiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return result.objectCreated;
  },

  // Inicializador Automático de Datos de Prueba (Con Fallback si Nessie está caído)
  async ensureSeedData(): Promise<{ customerId: string, accountId: string }> {
    try {
      const customers = await this.getCustomers();
      if (customers.length > 0) {
        const customer = customers[0];
        const accounts = await this.getCustomerAccounts(customer._id);
        if (accounts.length > 0) {
          return { customerId: customer._id, accountId: accounts[0]._id };
        }
      }

      console.log("Generando cliente de prueba (Seed)...");
      const newCustomer = await this.createCustomer({
        first_name: "Roberto",
        last_name: "García",
        address: {
          street_number: "123",
          street_name: "Avenida Principal",
          city: "Monterrey",
          state: "NL",
          zip: "64000"
        }
      });

      const newAccount = await this.createAccount(newCustomer._id, {
        type: "Checking",
        nickname: "Cuenta Pensión",
        rewards: 0,
        balance: 14500
      });

      const merchantFarmacia = await this.createMerchant({ name: "Farmacias del Ahorro" });
      const merchantNetflix = await this.createMerchant({ name: "Netflix" });

      const today = new Date().toISOString().split('T')[0];

      await this.createPurchase(newAccount._id, {
        merchant_id: merchantFarmacia._id,
        medium: "balance",
        purchase_date: today,
        amount: 500.00,
        status: "pending",
        description: "Medicinas"
      });

      await this.createPurchase(newAccount._id, {
        merchant_id: merchantNetflix._id,
        medium: "balance",
        purchase_date: today,
        amount: 299.00,
        status: "pending",
        description: "Suscripción"
      });

      return { customerId: newCustomer._id, accountId: newAccount._id };
    } catch (error) {
      console.warn("⚠️ NESSIE OFFLINE: Retornando IDs simulados para que no falle la app.");
      return { customerId: "mock-cust-123", accountId: "mock-acc-456" };
    }
  },

  async getDashboardData() {
    const { customerId, accountId } = await this.ensureSeedData();
    const customer = await this.getCustomer(customerId);
    const accounts = await this.getCustomerAccounts(customerId);
    const purchases = await this.getAccountPurchases(accountId);
    const bills = await this.getAccountBills(accountId);
    const loans = await this.getAccountLoans(accountId);
    const mainAccount = accounts.find((a: any) => a._id === accountId) || accounts[0];

    return {
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
      transactions: purchases.map((p: any) => ({
        id: p._id,
        amount: p.amount,
        date: p.purchase_date || p.transaction_date,
        description: p.description,
        status: p.status,
        type: "purchase",
        payee_id: p.payee_id,
        merchant_id: p.merchant_id
      })),
      bills: bills.map((b: any) => ({
        id: b._id,
        amount: b.payment_amount,
        date: b.payment_date,
        payee: b.payee,
        nickname: b.nickname,
        status: b.status
      })),
      loans: loans.map((l: any) => ({
        id: l._id,
        amount: l.amount,
        monthly: l.monthly_payment,
        description: l.description,
        status: l.status
      }))
    };
  }
};
