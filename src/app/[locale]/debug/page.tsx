"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, OrbitControls, Bounds, Center } from "@react-three/drei";
import * as THREE from "three";

function DebugModel({ rotX, rotY, rotZ }: { rotX: number, rotY: number, rotZ: number }) {
  const { scene, animations } = useGLTF("/Coiny.glb");
  const { actions } = useAnimations(animations, scene);

  // Reproducir la animación BaseRig para verla
  useState(() => {
    setTimeout(() => {
      if (actions["BaseRig"]) {
        actions["BaseRig"].play();
      }
    }, 500);
  });

  return (
    <Bounds fit clip observe margin={1.2}>
      <Center>
        <group rotation={[rotX, rotY, rotZ]}>
          <primitive object={scene} />
        </group>
      </Center>
    </Bounds>
  );
}

export default function DebugPage() {
  const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [rotZ, setRotZ] = useState(0);
  const [camY, setCamY] = useState(0);
  const [camZ, setCamZ] = useState(2);
  const [fov, setFov] = useState(40);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-100">
      <div className="p-4 bg-white shadow-md z-10 grid grid-cols-2 gap-4">
        <div>
          <h2 className="font-bold text-lg mb-2">Rotación del Modelo</h2>
          <label className="block">Rot X: {rotX.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotX} onChange={(e) => setRotX(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Rot Y: {rotY.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotY} onChange={(e) => setRotY(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Rot Z: {rotZ.toFixed(2)}</label>
          <input type="range" min="-3.14" max="3.14" step="0.01" value={rotZ} onChange={(e) => setRotZ(parseFloat(e.target.value))} className="w-full" />
        </div>
        
        <div>
          <h2 className="font-bold text-lg mb-2">Cámara</h2>
          <label className="block">Cam Y: {camY.toFixed(2)}</label>
          <input type="range" min="-5" max="5" step="0.1" value={camY} onChange={(e) => setCamY(parseFloat(e.target.value))} className="w-full" />
          
          <label className="block mt-2">Cam Z: {camZ.toFixed(2)}</label>
          <input type="range" min="0" max="10" step="0.1" value={camZ} onChange={(e) => setCamZ(parseFloat(e.target.value))} className="w-full" />

          <label className="block mt-2">FOV (Zoom): {fov}</label>
          <input type="range" min="10" max="100" step="1" value={fov} onChange={(e) => setFov(parseFloat(e.target.value))} className="w-full" />
          
          <p className="mt-4 text-sm text-blue-600 font-semibold">Instrucciones: Mueve los sliders hasta que se vea perfecto. Arrastra con el mouse sobre el modelo para rotar la cámara manualmente (OrbitControls). Cuando encuentres los números perfectos, dímelos.</p>
        </div>
      </div>
      
      <div className="flex-1 relative bg-slate-800">
        <Canvas camera={{ position: [0, camY, camZ], fov: fov }}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 10]} intensity={2} />
          <DebugModel rotX={rotX} rotY={rotY} rotZ={rotZ} />
          <OrbitControls makeDefault />
        </Canvas>
      </div>
    </div>
  );
}
