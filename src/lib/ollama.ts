export interface ChatOption {
  label: string;
  action: string;
}

export interface AssistantResponse {
  message: string;
  options: ChatOption[];
}

const OLLAMA_URL = "http://155.138.230.236:11434/api/chat";
const MODEL_NAME = "llama3.2";

export const generateRealAssistantResponse = async (context: any, userMessage: string, lang: string = 'es'): Promise<AssistantResponse> => {
  const isEn = lang === 'en';
  
const systemPrompt = `
You are Coiny, a highly intelligent, patient, and insightful personal financial assistant mascot.
Your primary users are ELDERLY PEOPLE (abuelos / 3era edad). You must speak to them with extreme clarity, respect, and patience, explaining their finances simply but with profound financial wisdom.

Current User Financial Context:
- User Name: ${context.userName}
- Main Account Balance: $${context.balance} MXN
- Total Spent Recently: $${context.totalSpent} MXN
- Pending Bills: ${context.bills && context.bills.length > 0 ? context.bills.map((b: any) => `$${b.payment_amount} for ${b.nickname || b.payee}`).join(', ') : 'None'}
- Active Loans: ${context.loans && context.loans.length > 0 ? context.loans.map((l: any) => `$${l.amount} (${l.description})`).join(', ') : 'None'}
- Recent Transactions:
${context.recentTransactions.map((tx: any) => `  * ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount} for ${tx.description || tx.merchant_id || 'External'}`).join('\n')}

Rules:
1. You MUST respond in ${isEn ? 'English' : 'Spanish'}.
2. Speak respectfully to the user. Address them by their first name (${context.userName}) in a warm, polite tone. NEVER call them "mijo" or "kiddo". You are their smart, reliable assistant.
3. EXTREME BREVITY BUT HIGH INTELLIGENCE: Keep your answer to a MAXIMUM of 3 short sentences, but make them count. Give thoughtful, practical, and highly intelligent financial advice tailored to their transactions. Provide actionable tips (e.g., how to cut down on a specific expense if it's too high).
4. DO NOT DO MATH: You are terrible at math. NEVER attempt to add up the transactions. Simply read and mention the "Total Spent Recently" value provided in the context if you need to talk about their total spending.
5. ZERO HALLUCINATIONS: You MUST ONLY use the EXACT numbers and data provided in the Current User Financial Context. NEVER invent, assume, or make up balances or transactions.
6. CURRENCY NAMING: The currency is Mexican Pesos (MXN). When speaking in English, ALWAYS say "Mexican Pesos" or "Pesos", NEVER "Dollars". When speaking in Spanish, ALWAYS say "Pesos" or "Pesos Mexicanos", NEVER "Dólares".
7. FORMATTING: Format your response beautifully using HTML tags (<ul>, <li>, <b>, <br>). DO NOT use markdown, ONLY HTML tags inside the message string.
8. You must output EXACTLY a valid JSON object with NO markdown wrapping, NO formatting, and NO extra text outside the JSON.
9. The JSON must match this structure:
{
  "message": "Your very short but highly intelligent spoken response here (with HTML formatting).",
  "options": [
    { "label": "A specific, smart follow-up question related to the advice", "action": "dynamic_1" },
    { "label": "Another specific alternative", "action": "dynamic_2" }
  ]
}
IMPORTANT: Do NOT use generic options like "View Balance" every time. Generate deeply contextual, smart, and varied options based on your advice.
`;


  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        stream: false,
        format: "json", // Forces JSON mode in Ollama
        options: {
          temperature: 0.5,
        }
      })
    });

    if (!response.ok) {
      throw new Error("Failed to reach Ollama VPS");
    }

    const data = await response.json();
    const result = JSON.parse(data.message.content);
    
    return {
      message: result.message || (isEn ? "I'm having trouble thinking." : "Tengo problemas para pensar."),
      options: result.options || []
    };

  } catch (err) {
    console.error("Ollama real error:", err);
    // Fallback in case the VPS is down or LLM returns malformed JSON
    return {
      message: isEn 
        ? "My brain is currently disconnected or still starting up on the VPS!" 
        : "¡Mi cerebro está desconectado o apenas arrancando en el servidor!",
      options: [
        { label: "Ok", action: "ignore" }
      ]
    };
  }
};
