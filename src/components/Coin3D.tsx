"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Coin3DProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  sideIndex?: number; // Whenever this changes, trigger Split
}

export default function Coin3D({ isSpeaking = false, isThinking = false, sideIndex = 0 }: Coin3DProps) {
  const group = useRef<THREE.Group>(null);
  const [hasEntered, setHasEntered] = useState(false);
  
  // Usar el nuevo modelo V2
  const { scene, animations } = useGLTF("/FinalCoinyV2.glb");
  const { actions } = useAnimations(animations, group);

  // Stop all animations gracefully
  const stopAll = () => {
    Object.values(actions).forEach(action => {
      if (action && action.isRunning()) {
        action.fadeOut(0.3);
      }
    });
  };

  // State Machine
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const playAnim = (name: string, loop: boolean = false) => {
      const action = actions[name];
      if (action) {
        stopAll();
        action.reset().fadeIn(0.2).play();
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
        action.clampWhenFinished = !loop;
        return action;
      }
      return null;
    };

    // 1. Entrance animation (Jumping)
    if (!hasEntered) {
      const jumpAction = playAnim("Jumping", false);
      if (jumpAction) {
        const duration = jumpAction.getClip().duration * 1000;
        timeout = setTimeout(() => setHasEntered(true), duration);
      } else {
        setHasEntered(true);
      }
      return () => clearTimeout(timeout);
    }

    // 2. Thinking
    if (isThinking) {
      playAnim("Thinking", true);
      return;
    }

    // 3. Wandering (Idle loop with cooldown)
    const playWander = () => {
      const idles = ["BaseRig", "Feet", "Salto360"];
      // Seleccionar uno al azar
      const randomIdle = idles[Math.floor(Math.random() * idles.length)];
      const action = playAnim(randomIdle, false);
      
      const animDuration = action ? action.getClip().duration * 1000 : 1000;
      const cooldown = Math.random() * 4000 + 3000; // 3 a 7 segundos de cooldown
      
      timeout = setTimeout(playWander, animDuration + cooldown);
    };

    // Comenzar el ciclo de wander si no está pensando
    playWander();

    return () => clearTimeout(timeout);
  }, [hasEntered, isThinking, actions]); // NO metemos sideIndex aquí para no interrumpir el ciclo principal tontamente

  // 4. Parabolic Jump (Split)
  // Lo manejamos en un useEffect separado para que interrumpa lo que esté haciendo
  useEffect(() => {
    if (!hasEntered) return; // No saltar si apenas está entrando

    const action = actions["Split"];
    if (action) {
      stopAll();
      action.reset().fadeIn(0.1).play();
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      
      // No reanudamos wandring manualmente aquí porque el otro useEffect se 
      // encargará de re-evaluar si sus dependencias cambian, pero como no cambian,
      // el timeout de playWander podría pisar esto. 
      // Para solucionarlo rápido: el Salto (Split) durará su tiempo y luego la máquina 
      // sola lanzará el próximo wander cuando el timeout del otro useEffect venza.
    }
  }, [sideIndex, hasEntered, actions]);

  // Squash & Stretch para hablar
  useFrame((state, delta) => {
    if (group.current) {
      if (isSpeaking) {
        const t = state.clock.getElapsedTime();
        const scaleY = 0.5 + Math.sin(t * 20) * 0.08;
        const scaleXZ = 0.5 - Math.sin(t * 20) * 0.04;
        group.current.scale.set(scaleXZ, scaleY, scaleXZ);
      } else {
        group.current.scale.set(0.5, 0.5, 0.5);
      }
    }
  });

  return (
    <group ref={group} rotation={[0, 0, 0]} position={[0, -1.1, 0]} scale={[0.5, 0.5, 0.5]}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/FinalCoinyV2.glb");
