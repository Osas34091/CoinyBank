"use client";

import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";

interface Coin3DProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
  isJumping?: boolean; // When true, play Split.
}

export default function Coin3D({ isSpeaking = false, isThinking = false, isJumping = false }: Coin3DProps) {
  const group = useRef<THREE.Group>(null);
  
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

    if (isJumping) {
      // 1. Jumping (Split / Parabola)
      playAnim("Split", true); // Loop the jump pose until landing
      return;
    }

    if (isThinking) {
      // 2. Thinking
      playAnim("Thinking", true);
      return;
    }

    if (isSpeaking) {
      // Solo BaseRig fijo, porque el useFrame se encarga de estirarlo/achicarlo
      playAnim("BaseRig", true);
      return;
    }

    // 3. Idle (Strictly when quiet and not jumping)
    const playIdle = () => {
      const idles = ["BaseRig", "Feet", "Salto360"];
      const randomIdle = idles[Math.floor(Math.random() * idles.length)];
      const action = playAnim(randomIdle, false);
      
      const animDuration = action ? action.getClip().duration * 1000 : 1000;
      const cooldown = Math.random() * 4000 + 3000; // 3 a 7 segundos de cooldown
      
      timeout = setTimeout(playIdle, animDuration + cooldown);
    };

    playIdle();

    return () => clearTimeout(timeout);
  }, [isJumping, isThinking, isSpeaking, actions]);

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
