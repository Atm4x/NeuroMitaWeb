import React, { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_CONFIGS = {
  crazy: { path: '/models/crazy_mita.glb', rotation: [0, 0, 0] },
  kind: { path: '/models/kind_mita.glb', rotation: [0, 0, 0] },
  cappie: { path: '/models/cappie.glb', rotation: [Math.PI, -Math.PI/2, 0], yOffset: -1.5  },
  sleepy: { path: '/models/sleepy_mita.glb', rotation: [Math.PI, 0, 0], yOffset: -1.5  },
  shorthair: { path: '/models/shorthair_mita.glb', rotation: [0, 0, 0] },
  mila: { path: '/models/mila.glb', rotation: [0, 0, 0] },
  // creepy: { path: '/models/creepy_mita.glb', rotation: [0, 0, 0] },
  default: { path: '', rotation: [0, 0, 0] }
};

function Model({ config }) {
  const { scene, animations } = useGLTF(config.path);
  const modelRef = useRef();
  
  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = 1.5 / maxDim;
    
    const newPosition = [
      -center.x * scaleFactor,
      -center.y * scaleFactor + 0.8 + (config.yOffset || 0),
      -center.z * scaleFactor
    ];
    
    return { scale: scaleFactor, position: newPosition };
  }, [scene, config]);

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        const oldMaterial = child.material;
        if (oldMaterial.transparent) {
          child.material = new THREE.MeshToonMaterial({
            map: oldMaterial.map,
            color: oldMaterial.color,
            transparent: true,
            opacity: oldMaterial.opacity,
            alphaMap: oldMaterial.alphaMap,
            side: oldMaterial.side,
          });
        } else {
          child.material = new THREE.MeshToonMaterial({
            map: oldMaterial.map,
            color: oldMaterial.color,
          });
        }
      }
    });
  }, [scene]);

  const { actions } = useAnimations(animations, modelRef);

  useEffect(() => {
    const action = actions?.Idle;
    if (action) {
      action.reset().fadeIn(0.5).play();
    }
  }, [actions]);

  return (
    <group ref={modelRef} scale={scale} position={position} rotation={config.rotation}>
        <primitive object={scene} />
    </group>
  );
}

const CharacterModelViewer = ({ characterId }) => {
  const config = MODEL_CONFIGS[characterId] || MODEL_CONFIGS.default;

  if (!config.path) {
    return null;
  }

  return (
    <div className="model-viewer-container">
      <Canvas 
        shadows
        camera={{ position: [0, 1.1, 2], fov: 45 }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.0} 
            castShadow 
          />
           <directionalLight 
            position={[-5, 5, -5]} 
            intensity={0.2} 
            color="#ff66aa"
          />
          <Model config={config} />
        </Suspense>
        <OrbitControls 
          target={[0, 0.8, 0]}
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.8}
        />
      </Canvas>
    </div>
  );
};

Object.values(MODEL_CONFIGS).forEach(config => {
  if (config.path) {
    useGLTF.preload(config.path);
  }
});

export default CharacterModelViewer;