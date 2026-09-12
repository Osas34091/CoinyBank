/**
 * This is a mock service to simulate the local Ollama LLM response.
 * Once the Vultr VPS with Ollama is ready, we will replace this with a real fetch
 * call to the local Ollama API (e.g., http://localhost:11434/api/generate).
 */

export interface ChatOption {
  label: string;
  action: string; // e.g., 'view_transactions', 'ignore'
}

export interface AssistantResponse {
  message: string;
  options: ChatOption[];
}

export const generateAssistantResponse = async (context: any, userMessage: string, lang: string = 'es'): Promise<AssistantResponse> => {
  // Simulación de delay de red (2 segundos para que parezca que piensa)
  await new Promise(resolve => setTimeout(resolve, 2000));

  const isEn = lang === 'en';

  if (userMessage.toLowerCase().includes("hola") || userMessage.toLowerCase().includes("hello")) {
    return {
      message: isEn 
        ? "Hi! I'm Coiny, your personal financial assistant. I noticed a recurring charge from Netflix for $299 MXN. Do you want to review your subscriptions?"
        : "¡Hola! Soy Coiny, tu asistente financiero personal. Veo que tienes un cargo recurrente de Netflix por $299 MXN. ¿Quieres que revisemos tus suscripciones?",
      options: [
        { label: isEn ? "Yes, review subscriptions" : "Sí, revisar suscripciones", action: "view_subscriptions" },
        { label: isEn ? "Not right now" : "No por ahora", action: "ignore" }
      ]
    };
  }

  if (userMessage.toLowerCase().includes("saldo") || userMessage.toLowerCase().includes("balance")) {
    return {
      message: isEn
        ? `Right now you have $${context.balance} MXN available in your main account. Everything looks stable! Are you planning to save this month?`
        : `En este momento tienes $${context.balance} MXN disponibles en tu cuenta principal. ¡Todo se ve estable! ¿Tienes planeado ahorrar este mes?`,
      options: [
        { label: isEn ? "Set a goal" : "Establecer una meta", action: "set_goal" },
        { label: isEn ? "Cool, thanks" : "Súper, gracias", action: "ignore" }
      ]
    };
  }

  // Fallback
  return {
    message: isEn
      ? "I'm still learning and I don't fully understand that yet. Can you ask me about your balance or recent transactions?"
      : "Aún estoy aprendiendo y no te entendí del todo. ¿Puedes preguntarme por tu saldo o por tus últimos movimientos?",
    options: [
      { label: isEn ? "View my balance" : "Ver mi saldo", action: "view_balance" },
      { label: isEn ? "Review recent transactions" : "Revisar últimos movimientos", action: "view_transactions" }
    ]
  };
};
