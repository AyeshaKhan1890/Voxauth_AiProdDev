"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useReducedMotion } from "motion/react";
import * as THREE from "three";
import type { VoxauthTheme } from "./theme-controller";
import { themePalettes } from "./theme-controller";

const vertexShader = `
  uniform float uTime;
  varying vec3 vNormalW;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    float waveA = sin(position.y * 4.3 + uTime * 1.35) * 0.07;
    float waveB = cos(position.x * 5.1 - uTime * 0.92) * 0.05;
    float waveC = sin((position.x + position.z) * 3.0 + uTime * 0.65) * 0.035;
    float displacement = waveA + waveB + waveC;
    vec3 displaced = position + normal * displacement;
    vec4 world = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = world.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vDisplacement = displacement;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  varying vec3 vNormalW;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), viewDirection), 0.0), 2.3);
    float scan = smoothstep(0.42, 0.5, sin(vWorldPosition.y * 7.0 - uTime * 1.8) * 0.5 + 0.5);
    float energy = smoothstep(-0.1, 0.13, vDisplacement);
    vec3 base = mix(uColorA, uColorB, fresnel);
    base = mix(base, uColorC, scan * 0.3 + energy * 0.18);
    float alpha = 0.14 + fresnel * 0.76 + scan * 0.08;
    gl_FragColor = vec4(base, alpha);
  }
`;

type Palette = { primary: string; secondary: string; tertiary: string };

function CameraDrift() {
  const { camera, pointer } = useThree();
  useFrame((_, delta) => {
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.34, 2.4, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pointer.y * 0.24, 2.4, delta);
    camera.lookAt(0.65, 0, 0);
  });
  return null;
}

function VoiceCore({ palette }: { palette: Palette }) {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColorA: { value: new THREE.Color(palette.primary) },
    uColorB: { value: new THREE.Color(palette.secondary) },
    uColorC: { value: new THREE.Color(palette.tertiary) },
  }), [palette]);

  useEffect(() => {
    uniforms.uColorA.value.set(palette.primary);
    uniforms.uColorB.value.set(palette.secondary);
    uniforms.uColorC.value.set(palette.tertiary);
  }, [palette, uniforms]);

  useFrame((state, delta) => {
    if (material.current) material.current.uniforms.uTime.value += delta;
    if (group.current) {
      group.current.rotation.y += delta * 0.09;
      group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.22) * 0.08;
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.42) * 0.08;
    }
  });

  return (
    <group ref={group} position={[1.15, 0.12, 0]}>
      <mesh>
        <icosahedronGeometry args={[1.38, 5]} />
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite
          side={THREE.FrontSide}
          blending={THREE.NormalBlending}
        />
      </mesh>
      <mesh scale={1.12} rotation={[0.55, 0.2, 0.28]}>
        <torusGeometry args={[1.55, 0.009, 8, 220]} />
        <meshBasicMaterial color={palette.primary} transparent opacity={0.46} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={1.15} rotation={[1.15, 0.45, -0.38]}>
        <torusGeometry args={[1.7, 0.006, 8, 220]} />
        <meshBasicMaterial color={palette.secondary} transparent opacity={0.32} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh scale={1.05} rotation={[0.2, 1.15, 0.7]}>
        <torusGeometry args={[1.78, 0.004, 8, 220]} />
        <meshBasicMaterial color={palette.tertiary} transparent opacity={0.22} blending={THREE.AdditiveBlending} />
      </mesh>
      <pointLight color={palette.primary} intensity={8} distance={6} decay={2} />
    </group>
  );
}

function ParticleWavefield({ palette }: { palette: Palette }) {
  const points = useRef<THREE.Points>(null);
  const countX = 56;
  const countZ = 34;
  const { positions, base } = useMemo(() => {
    const array = new Float32Array(countX * countZ * 3);
    let cursor = 0;
    for (let z = 0; z < countZ; z += 1) {
      for (let x = 0; x < countX; x += 1) {
        array[cursor++] = (x - countX / 2) * 0.17;
        array[cursor++] = 0;
        array[cursor++] = (z - countZ / 2) * 0.17;
      }
    }
    return { positions: array, base: array.slice() };
  }, []);

  useFrame((state) => {
    if (!points.current) return;
    const attribute = points.current.geometry.attributes.position as THREE.BufferAttribute;
    const time = state.clock.elapsedTime;
    for (let index = 0; index < countX * countZ; index += 1) {
      const offset = index * 3;
      const x = base[offset];
      const z = base[offset + 2];
      const radial = Math.sqrt((x - 1.1) ** 2 + z ** 2);
      attribute.array[offset + 1] =
        Math.sin(x * 1.45 + time * 1.05) * 0.13 +
        Math.cos(z * 2.1 - time * 0.72) * 0.08 +
        Math.sin(radial * 3.2 - time * 1.4) * 0.11;
    }
    attribute.needsUpdate = true;
    points.current.rotation.z = Math.sin(time * 0.13) * 0.025;
  });

  return (
    <points ref={points} position={[1.05, -1.55, -0.7]} rotation={[-0.44, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={palette.primary}
        size={0.026}
        transparent
        opacity={0.62}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function SignalDust({ palette }: { palette: Palette }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(900 * 3);
    let seed = 9182;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let index = 0; index < values.length; index += 3) {
      values[index] = (next() - 0.5) * 11;
      values[index + 1] = (next() - 0.5) * 6;
      values[index + 2] = (next() - 0.5) * 5 - 1.8;
    }
    return values;
  }, []);
  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.012;
    ref.current.position.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.08;
  });
  return (
    <points ref={ref}>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color={palette.secondary} size={0.018} transparent opacity={0.52} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function SignalShards({ palette }: { palette: Palette }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const group = useRef<THREE.Group>(null);
  const count = 28;
  const transforms = useMemo(() => {
    let seed = 411;
    const next = () => {
      seed = (seed * 48271) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3((next() - 0.5) * 8.5, (next() - 0.5) * 4.7, (next() - 0.5) * 3 - 1),
      rotation: new THREE.Euler(next() * Math.PI, next() * Math.PI, next() * Math.PI),
      scale: 0.018 + next() * 0.055,
    }));
  }, []);

  useEffect(() => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    transforms.forEach((item, index) => {
      dummy.position.copy(item.position);
      dummy.rotation.copy(item.rotation);
      dummy.scale.setScalar(item.scale);
      dummy.updateMatrix();
      mesh.current?.setMatrixAt(index, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y -= delta * 0.025;
    group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.12) * 0.08;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color={palette.tertiary} transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </instancedMesh>
    </group>
  );
}

function Scene({ palette }: { palette: Palette }) {
  return (
    <>
      <CameraDrift />
      <ambientLight intensity={0.2} />
      <VoiceCore palette={palette} />
      <ParticleWavefield palette={palette} />
      <SignalDust palette={palette} />
      <SignalShards palette={palette} />
    </>
  );
}

export function ImmersiveSignalScene({ theme, className = "" }: { theme: VoxauthTheme; className?: string }) {
  const reduceMotion = useReducedMotion();
  const palette = themePalettes[theme];

  if (reduceMotion) {
    return <div className={`immersive-scene-fallback ${className}`} aria-hidden="true"><i /><i /><i /></div>;
  }

  return (
    <div className={`immersive-scene ${className}`} aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6.1], fov: 44, near: 0.1, far: 50 }}
        dpr={[1, 1.55]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        fallback={<div className="immersive-scene-fallback"><i /><i /><i /></div>}
      >
        <Suspense fallback={null}><Scene palette={palette} /></Suspense>
      </Canvas>
    </div>
  );
}
