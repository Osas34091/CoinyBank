"use client";

import { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function DebugModel({ rotX, rotY, rotZ, scale, posY, posZ }: { rotX: number, rotY: number, rotZ: number, scale: number, posY: number, posZ: number }) {
  const { scene, animations } = useGLTF("/Coiny.glb");
  const { actions } = useAnimations(animations, scene);

  // Reproducir la animación BaseRig para verla
  useEffect(() => {
    const action = actions["BaseRig"];
    if (action) {
      action.play();
    }
  }, [actions]);

  return (
    <group rotation={[rotX, rotY, rotZ]} position={[0, posY, posZ]} scale={[scale, scale, scale]}>
      <primitive object={scene} />
    </group>
  );
}

export default function DebugPage() {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [scale, setScale] = useState(1);
  const [posY, setPosY] = useState(0);
  const [posZ, setPosZ] = useState(0);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100">
      <div className="p-4 bg-white shadow-md z-10 grid grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold text-lg mb-2">Rotación del Modelo</h2>
          <label className="block">Rot X (Inclinación): {rotX.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotX} onChange={(e) => setRotX(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Rot Y (Giro): {rotY.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotY} onChange={(e) => setRotY(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Rot Z: {rotZ.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotZ} onChange={(e) => setRotZ(parseFloat(e.target.value))} className="w-full" />
        </div>
        
        <div>
          <h2 className="font-bold text-lg mb-2">Posición y Escala (Sin Bounds)</h2>
          <label className="block text-red-600 font-bold">Escala: {scale.toFixed(2)}</label>
          <input type="range" min="0.1" max="10" step="0.1" value={scale} onChange={(e) => setScale(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Pos Y (Arriba/Abajo): {posY.toFixed(2)}</label>
          <input type="range" min="-5" max="5" step="0.1" value={posY} onChange={(e) => setPosY(parseFloat(e.target.value))} className="w-full" />

          <label className="block mt-2">Pos Z (Adelante/Atrás): {posZ.toFixed(2)}</label>
          <input type="range" min="-5" max="5" step="0.1" value={posZ} onChange={(e) => setPosZ(parseFloat(e.target.value))} className="w-full" />
          
          <p className="mt-4 text-xs font-semibold text-blue-600">Eliminé el "Auto-centrado" que estaba rompiendo la cámara. Ahora tienes control real. Busca la combinación perfecta de Escala, PosY y RotX para que se vea bien en la previsualización de abajo, que tiene el mismo tamaño que el asistente real.</p>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-800 flex items-center justify-center">
        {/* Contenedor simulando el tamaño real del asistente */}
        <div className="w-28 h-32 border-2 border-red-500 relative bg-white/10">
          <Canvas camera={{ position: [0, 0, 1], fov: 40 }}>
            <ambientLight intensity={1.5} />
            <directionalLight position={[10, 10, 10]} intensity={2} />
            <DebugModel rotX={rotX} rotY={rotY} rotZ={rotZ} scale={scale} posY={posY} posZ={posZ} />
            {/* OrbitControls disabled so it matches the real bubble exactly. Use sliders to adjust! */}
          </Canvas>
          <div className="absolute -bottom-6 text-white text-xs text-center w-full">Tamaño real de la burbuja</div>
        </div>
      </div>
    </div>
  );
}
