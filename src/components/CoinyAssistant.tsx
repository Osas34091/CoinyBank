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
  msgKey?: 'greeting' | 'wake' | 'llm';
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
  const [isRightSide, setIsRightSide] = useState(true);
  
  const posRef = useRef({ x: 0, y: 0 });
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
      { label: t("wakeOptIgnore"), action: "ignore" }
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
      
      // Initial position bottom right
      const startX = width - 150;
      const startY = height - 150;
      posRef.current = { x: startX, y: startY };
      setIsRightSide(startX > width / 2);
      controls.set({ x: startX, y: startY });
      
      setTimeout(() => {
        jumpToSafeZone(() => {
          // Initialize with current language
          setCurrentMessage({
            message: t("greetingMsg"),
            options: [{ label: t("greetingOpt"), action: "ignore" }],
            msgKey: 'greeting'
          });
        });
      }, 1000);

      return () => window.removeEventListener('resize', handleResize);
    }
  }, [controls, t]);

  const speakAndAnimate = async (text: string, responseObj: AssistantResponse) => {
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
      
      setCurrentMessage(null);
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [currentMessage, isThinking]);

  const jumpToSafeZone = async (callback?: () => void) => {
    const margin = 200;
    const { x, y } = posRef.current;
    const { width, height } = windowSize;
    
    // Check if out of bounds (or near edge where bubble cuts off)
    if (x < margin || x > width - margin || y < margin || y > height - margin) {
      const safeX = Math.max(margin, Math.min(x, width - margin));
      const safeY = Math.max(margin, Math.min(y, height - margin));
      
      await controls.start({
        x: safeX,
        y: safeY,
        transition: { type: "spring", stiffness: 100, damping: 10 }
      });
      posRef.current = { x: safeX, y: safeY };
      setIsRightSide(safeX > width / 2);
    }
    if (callback) callback();
  };

  const handleDragEnd = (e: any, info: any) => {
    setIsDragging(false);
    posRef.current = {
      x: posRef.current.x + info.offset.x,
      y: posRef.current.y + info.offset.y,
    };
    setIsRightSide(posRef.current.x > windowSize.width / 2);
    jumpToSafeZone();
  };

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
        handleOptionClick("voice_input", t("micCommand"));
      }, 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <motion.div 
        id="coiny-assistant-container"
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
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
                  className="text-lg font-medium text-slate-800 mb-5 leading-snug max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mt-2 [&>ul>li]:mb-1 [&>b]:text-blue-700"
                  dangerouslySetInnerHTML={{ __html: currentMessage.message }}
                />
                
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

        <div className="relative group cursor-grab active:cursor-grabbing">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleMic(); }}
            className={`absolute -left-16 top-1/2 -translate-y-1/2 p-3 rounded-full shadow-md transition-all ${isListening ? 'bg-red-500 text-white animate-pulse scale-110' : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-500 hover:bg-blue-50'}`}
            aria-label="Hablar con el asistente"
          >
            <Mic className="w-5 h-5" />
          </button>

          <motion.div
            onClick={() => {
              if (!isDragging && !currentMessage && !isThinking) {
                jumpToSafeZone(() => {
                  setCurrentMessage({
                    message: t("wakeMsg"),
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
              <Canvas camera={{ position: [0, 0, 1], fov: 40 }}>
                <ambientLight intensity={1.5} />
                <directionalLight position={[10, 10, 10]} intensity={2} />
                <Coin3D isSpeaking={isSpeaking} isThinking={isThinking} />
              </Canvas>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

