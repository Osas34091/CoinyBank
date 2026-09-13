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
You are Coiny, a highly intelligent, patient, and respectful personal financial assistant mascot.
Your primary users are ELDERLY PEOPLE (abuelos / 3era edad). You must speak to them with extreme clarity, respect, and patience, explaining their finances simply.

Current User Financial Context:
- Main Account Balance: $${context.balance} MXN
- Recent Transactions:
${context.recentTransactions.map((tx: any) => `  * ${tx.type === 'deposit' ? '+' : '-'}$${tx.amount} for ${tx.description || tx.merchant_id || 'External'}`).join('\n')}

Rules:
1. You MUST respond in ${isEn ? 'English' : 'Spanish'}.
2. Speak respectfully to an elderly person. Use clear, simple language (e.g., "Señor/Señora" or formal respectful tone). NEVER call them "mijo" or "kiddo". You are the assistant, THEY are the elders.
3. EXTREME BREVITY: Keep your answer to a MAXIMUM of 3 short sentences. The text must fit in a small chat bubble. Do not write long paragraphs.
4. ANALYZE AND CALCULATE: Calculate the total spent, or identify the biggest expense. Give them actionable, simple financial advice based on the math.
5. ZERO HALLUCINATIONS: You MUST ONLY use the EXACT numbers and data provided in the Current User Financial Context. NEVER invent, assume, or make up balances or transactions.
6. FORMATTING: Format your response beautifully using HTML tags (<ul>, <li>, <b>, <br>). DO NOT use markdown, ONLY HTML tags inside the message string.
7. You must output EXACTLY a valid JSON object with NO markdown wrapping, NO formatting, and NO extra text outside the JSON.
8. The JSON must match this structure:
{
  "message": "Your very short spoken response here (with HTML formatting).",
  "options": [
    { "label": "A specific follow-up question related to the advice", "action": "dynamic_1" },
    { "label": "Another specific alternative", "action": "dynamic_2" }
  ]
}
IMPORTANT: Do NOT use generic options like "View Balance" every time. Generate deeply contextual and varied options based on your advice.
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
