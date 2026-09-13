"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Coin3DProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  isJumping?: boolean; // When true, play Jump.
  isEntering?: boolean;
  isDragging?: boolean;
}

export default function Coin3D({ isSpeaking = false, isThinking = false, isJumping = false, isEntering = false, isDragging = false }: Coin3DProps) {
  const group = useRef<THREE.Group>(null);
  
  // Usar el nuevo modelo V7 (CoinityV5)
  const { scene, animations } = useGLTF("/CoinityV5.glb");
  const { actions } = useAnimations(animations, group);

  // Stop all animations gracefully
  const stopAll = () => {
    Object.values(actions).forEach(action => {
      if (action && action.isRunning()) {
        action.fadeOut(0.3);
      }
    });
  };

  const [currentIdleAnim, setCurrentIdleAnim] = useState<string | null>(null);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animClearRef = useRef<NodeJS.Timeout | null>(null);

  // Random idle animations
  useEffect(() => {
    const isBusy = isEntering || isJumping || isThinking || isSpeaking || isDragging;
    
    if (isBusy) {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (animClearRef.current) clearTimeout(animClearRef.current);
      setCurrentIdleAnim(null);
      return;
    }

    const scheduleNextIdle = () => {
      idleTimeoutRef.current = setTimeout(() => {
        const anims = ["Looking", "Flip"];
        const randAnim = anims[Math.floor(Math.random() * anims.length)];
        setCurrentIdleAnim(randAnim);
        
        // Reset back to base pose after 2.5s (gives animation time to play)
        animClearRef.current = setTimeout(() => {
          setCurrentIdleAnim(null);
          scheduleNextIdle();
        }, 2500); 

      }, 3000 + Math.random() * 1000); // 3 to 4 seconds
    };

    scheduleNextIdle();

    return () => {
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      if (animClearRef.current) clearTimeout(animClearRef.current);
    };
  }, [isEntering, isJumping, isThinking, isSpeaking]);

  // State Machine
  useEffect(() => {
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

    if (isEntering) {
      playAnim("Entrance", false);
      return;
    }
    
    if (isDragging) {
      playAnim("Grab", true);
      return;
    }
    
    if (isJumping) {
      playAnim("Jump", true);
      return;
    }

    if (isThinking) {
      playAnim("Thinking", true);
      return;
    }

    if (currentIdleAnim) {
      playAnim(currentIdleAnim, false);
      return;
    }

    // Base pose
    stopAll();

  }, [isJumping, isThinking, isSpeaking, isEntering, currentIdleAnim, actions]);

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

useGLTF.preload("/CoinityV5.glb");
