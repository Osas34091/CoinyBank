"use client";

import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, Center, Bounds } from "@react-three/drei";
import * as THREE from "three";

interface Coin3DProps {
  isSpeaking?: boolean;
}

export default function Coin3D({ isSpeaking = false }: Coin3DProps) {
  const group = useRef<THREE.Group>(null);
  
  // Carga el GLB desde la carpeta public
  const { scene } = useGLTF("/cent_coin.glb");

  useFrame((state, delta) => {
    if (group.current) {
      // Si está hablando, hacer un pequeño squash & stretch
      if (isSpeaking) {
        const scaleFactor = 1 + Math.sin(state.clock.elapsedTime * 15) * 0.05;
        group.current.scale.set(1, scaleFactor, 1);
      } else {
        group.current.scale.set(1, 1, 1);
      }
    }
  });

  // Auto-centramos el modelo y usamos Bounds para que quepa en la vista
  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group ref={group}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

// Precargar el modelo para que no haya flash al instanciar
useGLTF.preload("/cent_coin.glb");
