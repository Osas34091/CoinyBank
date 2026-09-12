"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Mic } from "lucide-react";
import { Canvas } from "@react-three/fiber";
import Coin3D from "./Coin3D";
import { useTranslations, useLocale } from "next-intl";

export interface ChatOption {
  label: string;
  action: string;
}

export interface AssistantResponse {
  message: string;
  options: ChatOption[];
}

export default function CoinyAssistant() {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const controls = useAnimation();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  
  // Track position to calculate arcs and safe zones
  const posRef = useRef({ x: 0, y: 0 });
  const [currentMessage, setCurrentMessage] = useState<AssistantResponse | null>(null);

  // Initialize window size and initial position
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      
      // Start in the center
      posRef.current = { x: width / 2, y: height / 2 };
      controls.set({ x: width / 2, y: height / 2 });
      
      // Saludo inicial después de un segundo
      setTimeout(() => {
        jumpToSafeZone(() => {
          setCurrentMessage({
            message: "¡Hola! Estoy explorando tu pantalla dando saltitos.",
            options: [{ label: "¡Qué bien!", action: "ignore" }]
          });
        });
      }, 1000);

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [controls]);

  // FUNCIÓN CENTRAL DE HABLA Y AUDIO
  const speakAndAnimate = async (text: string, responseObj: AssistantResponse) => {
    // 1. Reproducimos el audio
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (res.ok) {
        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play().catch(e => console.error("Error reproduciendo audio:", e));
      }
    } catch (e) {
      console.error("Error conectando con TTS:", e);
    }

    // 2. Mostramos el mensaje
    setCurrentMessage(responseObj);
  };

  // Listener para los botones del Dashboard
  useEffect(() => {
    const handleWake = (e: any) => {
      const task = e.detail;
      setCurrentMessage(null);
      setIsThinking(true);
      
      setTimeout(async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: task, lang: locale })
          });
          const response = await res.json();
          setIsThinking(false);
          
          if (response.error) {
            await speakAndAnimate("Parece que hubo un error de conexión.", { message: "Error de servidor: " + response.error, options: [] });
          } else {
            await speakAndAnimate(response.message, response);
          }
        } catch (err) {
          setIsThinking(false);
          await speakAndAnimate("Ups, algo salió mal.", { message: "No pude conectar con el cerebro.", options: [] });
        }
      }, 500);
    };

    window.addEventListener("coiny_wake", handleWake);
    return () => window.removeEventListener("coiny_wake", handleWake);
  }, [controls, windowSize, locale]);

  // [ELIMINADO] Función de Salto a Zona Segura
  const jumpToSafeZone = async (callback: () => void) => {
    callback(); // Directamente ejecuta el callback sin saltar
  };

  // [ELIMINADO] Lógica de mascota virtual (Wander y Hops)

  const handleOptionClick = async (action: string, label: string) => {
    if (action === "ignore") {
      setCurrentMessage(null);
      return;
    }
    setCurrentMessage(null);
    setIsThinking(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: label, lang: locale })
      });
      const response = await res.json();
      await speakAndAnimate(response.message, response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsThinking(false);
    }
  };

  const toggleMic = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setCurrentMessage(null);
      setTimeout(() => {
        setIsListening(false);
        handleOptionClick("voice_input", "Hola, revisa mis cuentas");
      }, 2500);
    }
  };

  return (
    <div className="fixed bottom-12 right-12 z-50 pointer-events-none">
      
      <motion.div 
        className="pointer-events-auto flex flex-col items-center justify-center relative"
      >
        <AnimatePresence>
          {/* Globo de diálogo adaptativo */}
          {currentMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute bottom-full mb-6 bg-yellow-50 border-2 border-yellow-400 p-5 shadow-2xl w-72 sm:w-80"
              style={{ borderRadius: '24px 24px 24px 4px' }}
            >
              <div className="absolute -bottom-3 left-10 w-6 h-6 bg-yellow-50 border-b-2 border-r-2 border-yellow-400 transform rotate-45" />

              <div className="relative z-10">
                <p className="text-xl font-medium text-slate-800 mb-5 leading-snug">
                  {currentMessage.message}
                </p>
                
                <div className="flex flex-col gap-3">
                  {(currentMessage.options || []).map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleOptionClick(opt.action, opt.label)}
                      className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-left transition-all active:scale-95 shadow-sm"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isThinking && !currentMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-full mb-4 bg-white border-2 border-slate-200 px-4 py-2 rounded-full shadow-lg flex gap-2 items-center"
            >
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-100" />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-200" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Personaje */}
        <div className="relative group cursor-pointer">
          <button 
            onClick={toggleMic}
            className={`absolute -left-16 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-50'}`}
            aria-label="Hablar con el asistente"
          >
            <Mic className="w-5 h-5" />
          </button>

          <motion.div
            onClick={() => {
              if (!currentMessage && !isThinking) {
                controls.stop(); 
                jumpToSafeZone(() => {
                  setCurrentMessage({
                    message: "¿Me llamaste? ¿Qué se te ofrece?",
                    options: [
                      { label: t("btnBalance"), action: "summary" },
                      { label: "Sigue paseando", action: "ignore" }
                    ]
                  });
                });
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-28 h-32 flex flex-col items-center justify-center relative"
          >
            {/* Renderizador WebGL (3D) de la moneda */}
            <div className="w-full h-full pointer-events-none">
              <Canvas camera={{ position: [0, 0, 1], fov: 40 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 10]} intensity={2} />
                <Coin3D isSpeaking={isSpeaking} />
              </Canvas>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
