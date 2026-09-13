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
  const [sideIndex, setSideIndex] = useState(0);
  
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });
      
      const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      window.addEventListener('resize', handleResize);
      
      // Initial position outside bottom right
      const startX = width > 768 ? width - 150 : width / 2;
      const endY = height - 150;
      
      posRef.current = { x: startX, y: endY };
      setIsRightSide(startX > width / 2);
      
      // Start outside bottom
      controls.set({ x: startX, y: height + 300 });
      
      // Entrance Jump
      setTimeout(() => {
        controls.start({
          y: [height + 300, endY - 200, endY],
          transition: { 
            duration: 1.2, 
            times: [0, 0.6, 1],
            ease: ["easeOut", "easeIn"]
          }
        }).then(() => {
          setCurrentMessage({
            message: t("greetingMsg"),
            options: [{ label: t("greetingOpt"), action: "ignore" }],
            msgKey: 'greeting'
          });
        });
      }, 500);

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [controls, t]);

  const speakAndAnimate = async (text: string, responseObj: AssistantResponse) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
    
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

  const toggleSide = () => {
    if (isThinking || isSpeaking || currentMessage) return; // Don't jump while busy
    
    const newIsRight = !isRightSide;
    setIsRightSide(newIsRight);
    setSideIndex(prev => prev + 1); // trigger Split animation

    const targetX = newIsRight ? windowSize.width - 150 : 150;
    const targetY = windowSize.height - 150;
    
    // Parabola physics
    controls.start({
      x: targetX,
      y: [targetY, targetY - 250, targetY], // Jump arc
      transition: { 
        x: { duration: 0.8, ease: "linear" },
        y: { duration: 0.8, times: [0, 0.5, 1], ease: ["easeOut", "easeIn"] }
      }
    });
    
    posRef.current = { x: targetX, y: targetY };
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

  const toggleMic = () => {
    if (isListening) return; // If already listening, do nothing (user can't cancel via same button easily right now)
    
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
    recognition.lang = locale === 'en' ? 'en-US' : 'es-MX';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentMessage(null);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      handleOptionClick("dynamic", transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
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
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
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
        animate={controls}
        className="pointer-events-auto absolute flex flex-col items-center justify-center"
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
                  className="text-lg font-medium text-slate-800 mb-5 leading-snug max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mt-2 [&>ul>li]:mb-1 [&>b]:text-blue-700"
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

          <button 
            onClick={(e) => { e.stopPropagation(); toggleSide(); }}
            className={`absolute -right-12 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-md transition-all z-10 bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-50`}
            aria-label="Cambiar de lado"
          >
            <ArrowLeftRight className="w-5 h-5" />
          </button>

          <motion.div
            onClick={() => {
              if (!currentMessage && !isThinking) {
                setCurrentMessage({
                  message: t("wakeMsg"),
                  options: getWakeOptions(),
                  msgKey: 'wake'
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
                <Coin3D isSpeaking={isSpeaking} isThinking={isThinking} sideIndex={sideIndex} />
              </Canvas>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

