"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";

interface Coin3DProps {
  isSpeaking?: boolean;
  isThinking?: boolean;
}

export default function Coin3D({ isSpeaking = false, isThinking = false }: Coin3DProps) {
  const group = useRef<THREE.Group>(null);
  
  // Carga el GLB desde la carpeta public
  const { scene, animations } = useGLTF("/Coiny.glb");
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const playAnim = () => {
      const action = actions["BaseRig"];
      if (action) {
        action.reset().setLoop(THREE.LoopOnce, 1).play();
        action.clampWhenFinished = true;
      }
    };

    if (isThinking || isSpeaking) {
      playAnim(); // Play immediately when starts thinking or speaking
      
      const loopWithDelay = () => {
        const delay = Math.random() * 3000 + 2000; // Random interval between 2s and 5s
        // Wait for animation to likely finish plus delay
        const action = actions["BaseRig"];
        const animDuration = action ? action.getClip().duration * 1000 : 1000;
        
        timeout = setTimeout(() => {
          if (isThinking) {
            playAnim();
            loopWithDelay();
          }
        }, animDuration + delay);
      };
      
      loopWithDelay();
    } else {
      const action = actions["BaseRig"];
      if (action) {
        action.fadeOut(0.5);
      }
    }
    
    return () => clearTimeout(timeout);
  }, [isThinking, isSpeaking, actions]);

  useFrame((state, delta) => {
    if (group.current) {
      if (isSpeaking) {
        // Restauramos el "yapeo" (squash & stretch manual) para cuando habla, 20% más lento
        const t = state.clock.getElapsedTime();
        const scaleY = 0.5 + Math.sin(t * 20) * 0.08;
        const scaleXZ = 0.5 - Math.sin(t * 20) * 0.04;
        group.current.scale.set(scaleXZ, scaleY, scaleXZ);
      } else {
        // Escala normal si no está hablando
        group.current.scale.set(0.5, 0.5, 0.5);
      }
    }
  });

  // Ya no usamos Bounds ni Center porque el esqueleto (huesos) de Blender a veces
  // engaña a estos componentes y hace que la cámara se mueva hacia arriba,
  // causando el efecto de "verlo desde arriba".
  return (
    <group ref={group} rotation={[0, 0, 0]} position={[0, -1.1, 0]} scale={[0.5, 0.5, 0.5]}>
      <primitive object={scene} />
    </group>
  );
}

// Precargar el modelo para que no haya flash al instanciar
useGLTF.preload("/Coiny.glb");
