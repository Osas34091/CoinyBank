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

    if (isThinking) {
      playAnim(); // Play immediately when starts thinking
      
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
  }, [isThinking, actions]);

  useFrame((state, delta) => {
    // Eliminado el squash & stretch manual porque aplasta el rig del modelo 3D y lo deforma.
  });

  // Auto-centramos el modelo y usamos Bounds para que quepa en la vista
  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group ref={group} rotation={[0, 0, 0]}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

// Precargar el modelo para que no haya flash al instanciar
useGLTF.preload("/Coiny.glb");
