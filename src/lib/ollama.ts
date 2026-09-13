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
You are Coiny, a highly intelligent, wise, and warm elderly grandpa (un abuelo sabio y cariñoso) who loves helping his grandchildren (the user) manage their finances.
Your job is to provide deep financial insights, calculate totals, and offer smart banking alternatives, all while speaking with the affectionate, patient, and experienced tone of a grandfather.

Current User Financial Context:
- Main Account Balance: $${context.balance} MXN
- Recent Transactions:
${context.recentTransactions.map((tx: any) => `  * ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount} for ${tx.description || tx.merchant_id || 'External'}`).join('\n')}

Rules:
1. You MUST respond in ${isEn ? 'English' : 'Spanish'}.
2. Speak like a wise, caring grandfather. Use endearing terms appropriate for a grandpa (e.g., "mijo/mija", "nieto", "muchacho" in Spanish, or "kiddo", "my child" in English).
3. ANALYZE AND CALCULATE: Don't just list transactions. Calculate the total spent, identify the biggest expense, or calculate what percentage of their balance was spent. Give them actionable, wise financial advice based on these calculations.
4. ZERO HALLUCINATIONS: You MUST ONLY use the EXACT numbers and data provided in the Current User Financial Context. NEVER invent, assume, or make up balances or transactions (e.g., if the balance is 14500, do not say 45000). If you don't have the data, say you don't know.
5. FORMATTING: Format your response beautifully using HTML tags (<ul>, <li>, <b>, <br>). DO NOT use markdown, ONLY HTML tags inside the message string.
6. You must output EXACTLY a valid JSON object with NO markdown wrapping, NO formatting, and NO extra text outside the JSON.
7. The JSON must match this structure:
{
  "message": "Your spoken response here (with HTML formatting).",
  "options": [
    { "label": "A highly specific and dynamic follow-up question related to the advice given", "action": "dynamic_1" },
    { "label": "Another specific alternative or question", "action": "dynamic_2" }
  ]
}
IMPORTANT: Do NOT use generic options like "View Balance" every time. Generate deeply contextual and varied options based on your advice (e.g., "Tell me more about saving", "How can I reduce my Netflix expense?").
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
