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
  
  // Usar el nuevo modelo V3 (coinity)
  const { scene, animations } = useGLTF("/coinity.glb");
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

    if (isThinking) {
      // 1. Thinking
      playAnim("Thinking", true);
      return;
    }

    // 2. Idle / Speaking / Jumping
    // El nuevo modelo solo tiene la animación Thinking, así que lo detenemos
    // para que vuelva a su "T-Pose" o pose base.
    stopAll();

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

useGLTF.preload("/coinity.glb");
