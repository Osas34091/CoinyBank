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
You are Coiny, a friendly and helpful personal financial assistant mascot.
Your job is to help the user manage their finances, answer questions about their balance, and provide insights on their transactions.

Current User Financial Context:
- Main Account Balance: $${context.balance} MXN
- Recent Transactions:
${context.recentTransactions.map((tx: any) => `  * ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount} for ${tx.description || tx.merchant_id || 'External'}`).join('\n')}

Rules:
1. You MUST respond in ${isEn ? 'English' : 'Spanish'}.
2. Keep your response conversational and energetic. If listing data (like transactions), format it beautifully using HTML tags (<ul>, <li>, <b>, <br>). DO NOT use markdown, ONLY HTML tags inside the message string.
3. You must output EXACTLY a valid JSON object with NO markdown wrapping, NO formatting, and NO extra text outside the JSON.
4. The JSON must match this structure:
{
  "message": "Your spoken response here.",
  "options": [
    { "label": "A suggested quick reply button for the user", "action": "view_balance" },
    { "label": "Another suggestion", "action": "ignore" }
  ]
}
For the "action" field, use one of these generic frontend actions: "view_balance", "view_transactions", "set_goal", or "ignore".
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
