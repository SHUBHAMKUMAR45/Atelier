'use client'

import { useRef, useMemo, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Float, MeshDistortMaterial, Stars, ContactShadows, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'

function StyleNode({ position, color, distort, speed, scrollOffset = 0, geometry }: any) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    const scroll = window.scrollY
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * speed * 0.2 + (scroll * 0.001 * scrollOffset)
      meshRef.current.rotation.y = state.clock.elapsedTime * speed * 0.3 + (scroll * 0.0015 * scrollOffset)
      meshRef.current.position.y = position[1] + (scroll * 0.0015 * scrollOffset)
    }
  })

  return (
    <Float floatIntensity={4} speed={speed}>
      <mesh position={position} ref={meshRef} geometry={geometry}>
        <MeshDistortMaterial
          color={color}
          envMapIntensity={2}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.9}
          roughness={0.1}
          distort={distort}
          speed={speed}
        />
      </mesh>
    </Float>
  )
}

function GlobalScene({ isLowPerf }: { isLowPerf: boolean }) {
  const sgArgs = isLowPerf ? [1, 16, 16] : [1, 32, 32]
  // @ts-ignore
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(...sgArgs), [isLowPerf])

  useFrame((state) => {
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, -(window.scrollY * 0.002), 0.1)
  })

  return (
    <>
      {/* Vibrant lighting setup */}
      <ambientLight intensity={0.8} color="#C398EB" />
      <directionalLight position={[10, 10, 5]} intensity={2} color="#F83286" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#47A1FA" />
      
      <Environment preset="city" />
      
      {!isLowPerf && (
        <Stars radius={50} depth={50} count={3000} factor={5} saturation={1} fade speed={2} />
      )}
      
      {/* Vibrant floating abstract elements */}
      <StyleNode geometry={sphereGeo} position={[-4, 2, -3]} color="#F83286" distort={0.5} speed={2} scrollOffset={1.5} />
      <StyleNode geometry={sphereGeo} position={[4, 0, -6]} color="#8631D7" distort={0.7} speed={3} scrollOffset={-1} />
      <StyleNode geometry={sphereGeo} position={[0, -4, -5]} color="#47A1FA" distort={0.4} speed={1.5} scrollOffset={2} />
      
      <ContactShadows 
        position={[0, -5, 0]} 
        opacity={0.6} 
        scale={25} 
        blur={3} 
        far={5} 
        color="#F83286"
        resolution={isLowPerf ? 128 : 256} 
      />
    </>
  )
}

export function GlobalExperience() {
  const [dpr, setDpr] = useState(1.5)
  const [isLowPerf, setIsLowPerf] = useState(false)

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-ink-900">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }} dpr={dpr}>
        <PerformanceMonitor 
          onDecline={() => { setIsLowPerf(true); setDpr(1) }} 
          onIncline={() => { setIsLowPerf(false); setDpr(1.5) }} 
        />
        <GlobalScene isLowPerf={isLowPerf} />
      </Canvas>
    </div>
  )
}
