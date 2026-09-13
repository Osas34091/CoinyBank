"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { Mic, ArrowLeftRight } from "lucide-react";
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
  msgKey?: 'greeting' | 'wake' | 'llm';
}

export default function CoinyAssistant() {
  const t = useTranslations("Assistant");
  const locale = useLocale();
  
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const controls = useAnimation();
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [isRightSide, setIsRightSide] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const lastActivityTime = useRef<number>(Date.now());
  const wanderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const posRef = useRef({ x: 0, y: 0 });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentMessage, setCurrentMessage] = useState<AssistantResponse | null>(null);

  const getWakeOptions = () => {
    const pool = [
      { label: t("optAdvice"), action: "dynamic" },
      { label: t("optAnalyze"), action: "dynamic" },
      { label: t("optBiggest"), action: "dynamic" },
      { label: t("optSave"), action: "dynamic" }
    ];
    const shuffled = pool.sort(() => 0.5 - Math.random());
    return [
      { label: t("btnBalance"), action: "summary" },
      shuffled[0],
      shuffled[1],
      { label: t("wakeOptIgnore"), action: "ignore" },
      { label: t("optManual"), action: "manual_input" }
    ];
  };

  // Re-translate hardcoded messages when language changes
  useEffect(() => {
    if (!currentMessage) return;
    
    if (currentMessage.msgKey === 'greeting') {
      setCurrentMessage({
        message: t("greetingMsg"),
        options: [{ label: t("greetingOpt"), action: "ignore" }],
        msgKey: 'greeting'
      });
    } else if (currentMessage.msgKey === 'wake') {
      setCurrentMessage({
        message: t("wakeMsg"),
        options: getWakeOptions(),
        msgKey: 'wake'
      });
    } else if (currentMessage.msgKey === 'llm') {
      // Clear LLM message on lang change so the user asks again
      setCurrentMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, t]);

  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      
      const endX = width > 768 ? width - 150 : width / 2;
      const endY = height - 150;
      
      posRef.current = { x: endX, y: endY };
      setIsRightSide(endX > width / 2);
      
      // Entrance Jump from right side
      // Start slightly off-screen, invisible
      const startX = width + 50; 
      controls.set({ x: startX, y: endY, opacity: 0 });
      
      // Wait 1.5s before entering
      setTimeout(() => {
        setIsEntering(true);
        
        // El movimiento físico de entrar
        controls.start({
          opacity: 1,
          x: endX,
          y: endY,
          transition: { 
            opacity: { duration: 0 }, // Instant visibility at frame 1
            x: { duration: 4, ease: "easeOut" } // Tomar 4s para entrar a la pantalla (el doble de lento)
          }
        });

        // Darle 6 segundos completos a la animación para que reproduzca sus frames 
        // antes de detenerla y mostrar el mensaje.
        setTimeout(() => {
          setIsEntering(false);
          setCurrentMessage({
            message: t("greetingMsg"),
            options: [{ label: t("greetingOpt"), action: "ignore" }],
            msgKey: 'greeting'
          });
          resetWanderTimer();
        }, 4000);

      }, 1500);

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [controls, t]);

  const jumpToSafeZone = async (callback?: () => void) => {
    const margin = 150;
    const topMargin = 400; // Much higher margin for the bubble
    const { x, y } = posRef.current;
    const { width, height } = windowSize;
    
    if (x < margin || x > width - margin || y < topMargin || y > height - margin) {
      const safeX = Math.max(margin, Math.min(x, width - margin));
      const safeY = Math.max(topMargin, Math.min(y, height - margin));
      
      setIsJumping(true);
      await controls.start({
        x: safeX,
        y: [y, y - 150, safeY], // Arc jump
        transition: { 
          x: { duration: 0.8, ease: "linear" },
          y: { duration: 0.8, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }
        }
      });
      setIsJumping(false);
      posRef.current = { x: safeX, y: safeY };
      setIsRightSide(safeX > width / 2);
    }
    if (callback) callback();
  };

  const speakAndAnimate = async (text: string, responseObj: AssistantResponse) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }

    // Ensure there is enough space for the message bubble before speaking
    await jumpToSafeZone();
    
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
        audioRef.current = audio;
        
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.play().catch(e => console.error(e));
      }
    } catch (e) {
      console.error(e);
    }
    
    // Default to 'llm' if not specified so we know to clear it on language change
    setCurrentMessage({ ...responseObj, msgKey: responseObj.msgKey || 'llm' });
  };

  useEffect(() => {
    const handleWake = (e: any) => {
      const task = e.detail;
      setCurrentMessage(null);
      setIsThinking(true);
      
      const processWake = async () => {
        try {
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: task, lang: locale })
          });
          const response = await res.json();
          setIsThinking(false);
          
          if (response.error) {
            await speakAndAnimate(t("errorMsg1"), { message: response.error, options: [], msgKey: 'llm' });
          } else {
            await speakAndAnimate(response.message, response);
          }
        } catch (err) {
          setIsThinking(false);
          await speakAndAnimate(t("errorMsg2"), { message: "Error", options: [], msgKey: 'llm' });
        }
      };
      processWake();
    };

    window.addEventListener("coiny_wake", handleWake);
    return () => window.removeEventListener("coiny_wake", handleWake);
  }, [locale, t]);

  // Click outside to close message
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!currentMessage && !isThinking) return;
      const target = e.target as HTMLElement;
      if (target.closest('#coiny-assistant-container')) return;
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsSpeaking(false);
      }
      
      setCurrentMessage(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentMessage, isThinking]);
    
  // WANDERING LOGIC
  const resetWanderTimer = () => {
    lastActivityTime.current = Date.now();
    if (wanderTimeoutRef.current) clearTimeout(wanderTimeoutRef.current);
    
    const scheduleNextWander = () => {
      const timeSinceActivity = Date.now() - lastActivityTime.current;
      if (timeSinceActivity >= 5000 && !isThinking && !isSpeaking && !currentMessage && !isDragging && !isJumping && !isListening) {
        wanderToRandomSpot();
      } else {
        // Not ready, try again later
        wanderTimeoutRef.current = setTimeout(scheduleNextWander, 2000);
      }
    };
    
    wanderTimeoutRef.current = setTimeout(scheduleNextWander, Math.random() * 5000 + 5000); // 5 to 10 seconds
  };

  const wanderToRandomSpot = () => {
    if (isThinking || isSpeaking || currentMessage || isDragging || isJumping) return;
    setIsJumping(true);
    
    const margin = 150;
    const minX = margin;
    const maxX = windowSize.width - margin;
    const minY = margin + 100; // Leave room for chat bubble
    const maxY = windowSize.height - margin;
    
    const targetX = Math.random() * (maxX - minX) + minX;
    const targetY = Math.random() * (maxY - minY) + minY;
    
    setIsRightSide(targetX > windowSize.width / 2);
    
    // Jump arc based on distance
    const dist = Math.sqrt(Math.pow(targetX - posRef.current.x, 2) + Math.pow(targetY - posRef.current.y, 2));
    const jumpHeight = Math.min(300, Math.max(100, dist * 0.5));
    const duration = Math.min(1.5, Math.max(0.8, dist / 500));
    
    controls.start({
      x: targetX,
      y: [posRef.current.y, posRef.current.y - jumpHeight, targetY],
      transition: { 
        x: { duration, ease: "linear" },
        y: { duration, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }
      }
    }).then(() => {
      setIsJumping(false);
      resetWanderTimer();
    });
    
    posRef.current = { x: targetX, y: targetY };
  };

  useEffect(() => {
    resetWanderTimer();
    return () => {
      if (wanderTimeoutRef.current) clearTimeout(wanderTimeoutRef.current);
    };
  }, [isThinking, isSpeaking, currentMessage, isDragging, isJumping, isListening]);

  const toggleSide = () => {
    if (isThinking || isSpeaking || currentMessage || isJumping) return; // Don't jump while busy
    lastActivityTime.current = Date.now();
    setIsJumping(true);
    
    const newIsRight = !isRightSide;
    setIsRightSide(newIsRight);

    const targetX = newIsRight ? windowSize.width - 150 : 150;
    const targetY = windowSize.height - 150;
    
    // Parabola physics
    controls.start({
      x: targetX,
      y: [posRef.current.y, posRef.current.y - 250, targetY], // Jump arc
      transition: { 
        x: { duration: 0.8, ease: "linear" },
        y: { duration: 0.8, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }
      }
    }).then(() => {
      setIsJumping(false);
      resetWanderTimer();
    });
    
    posRef.current = { x: targetX, y: targetY };
  };



  const handleDragEnd = (e: any, info: any) => {
    setIsDragging(false);
    resetWanderTimer();
    posRef.current = {
      x: posRef.current.x + info.offset.x,
      y: posRef.current.y + info.offset.y,
    };
    setIsRightSide(posRef.current.x > windowSize.width / 2);
    jumpToSafeZone();
  };

  const handleOptionClick = async (action: string, label: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
    
    if (action === "ignore") {
      setCurrentMessage(null);
      return;
    }
    if (action === "manual_input") {
      setShowKeyboard(true);
      return;
    }
    
    setCurrentMessage(null);
    setShowKeyboard(false);
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

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef2 = useRef<NodeJS.Timeout | null>(null);
  const currentTranscriptRef = useRef<string>("");

  const forceSubmitVoice = () => {
    if (silenceTimeoutRef2.current) clearTimeout(silenceTimeoutRef2.current);
    
    // Si hay texto, enviarlo inmediatamente y limpiar
    if (currentTranscriptRef.current.trim()) {
      handleOptionClick("dynamic", currentTranscriptRef.current.trim());
      currentTranscriptRef.current = "";
    }
    
    // Detener de forma segura sin disparar el onend doble
    if (recognitionRef.current) {
      // Quitamos el onend para que no haga envíos dobles si el navegador decide dispararlo al detenerse
      recognitionRef.current.onend = null;
      recognitionRef.current.onresult = null;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
      // Manual stop
      forceSubmitVoice();
      return;
    }
    
    // Check if SpeechRecognition API exists
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Graceful fallback for HTTP without SSL or unsupported browsers
      console.warn("Speech Recognition API not supported or blocked (likely due to missing HTTPS). Falling back to keyboard.");
      setCurrentMessage({
        message: t("voiceError"),
        options: [],
        msgKey: 'llm'
      });
      setShowKeyboard(true);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    currentTranscriptRef.current = "";
    
    recognition.lang = locale === 'en' ? 'en-US' : 'es-MX';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentMessage(null);
      
      // Start initial silence timeout just in case they don't say anything
      if (silenceTimeoutRef2.current) clearTimeout(silenceTimeoutRef2.current);
      silenceTimeoutRef2.current = setTimeout(forceSubmitVoice, 5000);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        finalTranscript += event.results[i][0].transcript;
      }
      
      currentTranscriptRef.current = finalTranscript;
      
      // Reset the silence timeout
      if (silenceTimeoutRef2.current) clearTimeout(silenceTimeoutRef2.current);
      silenceTimeoutRef2.current = setTimeout(forceSubmitVoice, 5000);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (silenceTimeoutRef2.current) clearTimeout(silenceTimeoutRef2.current);
      recognitionRef.current = null;
      setIsListening(false);
      // Fallback
      setCurrentMessage({
        message: t("voiceError"),
        options: [],
        msgKey: 'llm'
      });
      setShowKeyboard(true);
    };

    recognition.onend = () => {
      // Si se detiene por sí solo (por límite de tiempo del navegador)
      if (isListening) {
        forceSubmitVoice();
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      recognitionRef.current = null;
      setIsListening(false);
      setCurrentMessage({
        message: t("voiceError"),
        options: [],
        msgKey: 'llm'
      });
      setShowKeyboard(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <motion.div 
        id="coiny-assistant-container"
        drag
        dragMomentum={false}
        onDragStart={() => {
          setIsDragging(true);
          lastActivityTime.current = Date.now();
        }}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="pointer-events-auto absolute flex flex-col items-center justify-center"
        style={{ touchAction: 'none' }}
      >
        <AnimatePresence>
          {currentMessage && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className={`absolute bottom-full mb-6 bg-yellow-50 border-2 border-yellow-400 p-5 shadow-2xl w-72 sm:w-80 ${
                isRightSide ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
              }`}
              style={{ borderRadius: isRightSide ? '24px 24px 4px 24px' : '24px 24px 24px 4px' }}
            >
              <div className={`absolute -bottom-3 w-6 h-6 bg-yellow-50 border-b-2 border-r-2 border-yellow-400 transform rotate-45 ${
                isRightSide ? 'right-10' : 'left-10'
              }`} />

              <div className="relative z-10">
                <div 
                  className="text-lg font-medium text-slate-800 mb-5 leading-snug max-h-48 overflow-y-auto pr-2 custom-scrollbar [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mt-2 [&>ul>li]:mb-1 [&>b]:text-blue-700"
                  dangerouslySetInnerHTML={{ __html: currentMessage.message }}
                />
                
                <div className="flex flex-col gap-3">
                  {!showKeyboard ? (
                    (currentMessage.options || []).map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt.action, opt.label)}
                        className="bg-white border-2 border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-bold py-2 px-4 rounded-xl text-left transition-all active:scale-95 shadow-sm"
                      >
                        {opt.label}
                      </button>
                    ))
                  ) : (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (inputValue.trim()) {
                          handleOptionClick("dynamic", inputValue.trim());
                          setInputValue("");
                        }
                      }}
                      className="flex flex-col gap-2"
                    >
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={t("placeholderInput") || "Escribe aquí..."}
                        autoFocus
                        className="w-full border-2 border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-slate-800"
                      />
                      <button
                        type="submit"
                        disabled={!inputValue.trim()}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-all active:scale-95 shadow-sm"
                      >
                        {t("btnSend") || "Enviar"}
                      </button>
                    </form>
                  )}
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
              className={`absolute bottom-full mb-4 bg-white border-2 border-slate-200 px-4 py-2 shadow-lg flex gap-2 items-center ${
                isRightSide ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'
              }`}
              style={{ borderRadius: isRightSide ? '24px 24px 4px 24px' : '24px 24px 24px 4px' }}
            >
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce" />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-100" />
              <div className="w-3 h-3 bg-slate-400 rounded-full animate-bounce delay-200" />
              <div className={`absolute -bottom-2 w-4 h-4 bg-white border-b-2 border-r-2 border-slate-200 transform rotate-45 ${
                isRightSide ? 'right-6' : 'left-6'
              }`} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group cursor-pointer">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMic(); }}
            className={`absolute -left-12 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-md transition-all z-10 ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-50'}`}
            aria-label="Hablar con el asistente"
          >
            <Mic className="w-5 h-5" />
          </button>

          <motion.div
            onClick={() => {
              lastActivityTime.current = Date.now();
              if (!isDragging && !currentMessage && !isThinking) {
                jumpToSafeZone(() => {
                  const randomWake = Math.floor(Math.random() * 10) + 1;
                  setCurrentMessage({
                    message: t(`wakeMsg${randomWake}`),
                    options: getWakeOptions(),
                    msgKey: 'wake'
                  });
                });
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-28 h-32 flex flex-col items-center justify-center relative"
          >
            <div className="w-full h-full pointer-events-none">
              <Canvas camera={{ position: [0, 0, 4], fov: 35 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 10]} intensity={2} />
                <Coin3D isSpeaking={isSpeaking} isThinking={isThinking} isJumping={isJumping} isEntering={isEntering} isDragging={isDragging} />
              </Canvas>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

