import { useRef, useState, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Stars, Float } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from "@react-three/postprocessing";
import * as THREE from "three";

// --- 1. Texture Generation ---
function getMeteorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  
  if (context) {
    const gradient = context.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");      // Head
    gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");  // Core
    gradient.addColorStop(0.4, "rgba(165, 180, 252, 0.6)");  // Tail
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");            // Fade
    context.fillStyle = gradient;
    context.fillRect(0, 0, 32, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// --- 2. Galaxy Particles (UPGRADED: Multi-Color) ---
function ParticleSphere(props: any) {
  const ref = useRef<THREE.Points>(null!);
  
  // Professional Sci-Fi Palette
  const palette = ["#ffffff", "#a5b4fc", "#c084fc", "#22d3ee"];

  const [positions, colors] = useMemo(() => {
    const count = 15000; 
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < count; i++) {
      // Position
      const r = 12 * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 3;
      const phi = Math.acos(2 * Math.random() - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Color (Randomly assigned from palette)
      const randomColor = palette[Math.floor(Math.random() * palette.length)];
      color.set(randomColor);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    }
    return [pos, col];
  }, []);

  useFrame((_: any, delta: number) => {
    ref.current.rotation.y -= delta / 25; 
  });

  return (
    <Points ref={ref} positions={positions} colors={colors} stride={3} frustumCulled={false} {...props}>
      <PointMaterial 
        transparent 
        vertexColors // <--- Critical for multi-color
        size={0.02} 
        sizeAttenuation 
        depthWrite={false} 
      />
    </Points>
  );
}

// --- 3. NEW: Floating Dust (Immersion Layer) ---
function FloatingDust() {
  const ref = useRef<THREE.Points>(null!);
  
  const positions = useMemo(() => {
    const count = 500; 
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 15;     
      arr[i * 3 + 1] = (Math.random() - 0.5) * 15; 
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10; 
    }
    return arr;
  }, []);

  useFrame((_: any, delta: number) => {
    ref.current.rotation.x -= delta / 50;
    ref.current.rotation.y -= delta / 40;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial 
        transparent 
        color="#fff" 
        opacity={0.3} 
        size={0.03} 
        sizeAttenuation 
        depthWrite={false} 
      />
    </Points>
  );
}

// --- 4. NEW: Tech Debris (Wireframe Shapes) ---
function TechShape({ position, color, speed, scale }: any) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [rot] = useState(() => ({
    dir: Math.random() > 0.5 ? 1 : -1
  }));

  useFrame((state: any, delta: number) => {
    if(mesh.current) {
        mesh.current.rotation.x += delta * speed * rot.dir;
        mesh.current.rotation.y += delta * speed * rot.dir;
        mesh.current.position.y += Math.sin(state.clock.elapsedTime * speed + position[0]) * 0.002;
    }
  });

  return (
    <mesh ref={mesh} position={position} scale={scale}>
      <icosahedronGeometry args={[1, 0]} /> 
      <meshBasicMaterial color={color} wireframe transparent opacity={0.15} />
    </mesh>
  );
}

function TechDebris() {
  const items = useMemo(() => {
    return new Array(12).fill(0).map(() => ({
      position: [
        (Math.random() - 0.5) * 30, 
        (Math.random() - 0.5) * 15, 
        (Math.random() - 0.5) * 10  
      ],
      scale: Math.random() * 0.4 + 0.3, 
      speed: Math.random() * 0.2 + 0.1, 
      color: Math.random() > 0.5 ? "#22d3ee" : "#c084fc" 
    }));
  }, []);

  return <>{items.map((item, i) => <TechShape key={i} {...item} />)}</>;
}

// --- 5. The Meteor Component ---
const Meteor = ({ texture }: { texture: THREE.CanvasTexture }) => {
  const mesh = useRef<THREE.Mesh>(null!);
  
  const angle = Math.PI / 4; 
  const speedMultiplier = Math.random() * 0.5 + 0.5; 
  
  const velocity = {
    x: -Math.cos(angle) * speedMultiplier * 10, 
    y: -Math.sin(angle) * speedMultiplier * 10 
  };

  const [conf] = useState(() => ({
    x: Math.random() * 40 + 20, 
    y: Math.random() * 20 + 10, 
    z: Math.random() * 10 - 5,
    scale: Math.random() * 0.5 + 1.0 
  }));

  useFrame((_: any, delta: number) => {
    if (!mesh.current) return;
    mesh.current.position.x += velocity.x * delta;
    mesh.current.position.y += velocity.y * delta;

    if (mesh.current.position.y < -15 || mesh.current.position.x < -20) {
      mesh.current.position.x = Math.random() * 30 + 10;
      mesh.current.position.y = Math.random() * 10 + 20;
    }
  });

  return (
    <mesh 
      ref={mesh} 
      position={[conf.x, conf.y, conf.z]} 
      rotation={[0, 0, angle + (Math.PI / 2)]} 
      scale={[conf.scale * 0.05, conf.scale * 4, 1]} 
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial 
        map={texture} 
        transparent 
        opacity={1} 
        side={THREE.DoubleSide} 
        depthWrite={false} 
        blending={THREE.AdditiveBlending} 
      />
    </mesh>
  );
};

const MeteorShower = () => {
  const texture = useMemo(() => getMeteorTexture(), []);
  const meteors = useMemo(() => new Array(3).fill(0), []);
  return <>{meteors.map((_, i) => <Meteor key={i} texture={texture} />)}</>;
};

// --- 6. Mouse Parallax Rig ---
function MouseRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null!);
  useFrame((state: any) => {
    if (group.current) {
        group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, state.mouse.y / 20, 0.05);
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, state.mouse.x / 20, 0.05);
    }
  });
  return <group ref={group}>{children}</group>;
}

// --- 7. Main Background ---
export default function Background() {
  return (
    <div className="spline-bg" style={{ background: "#030303" }}>
      <Canvas 
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ antialias: false }}
        dpr={[1, 1.5]} 
      >
        <color attach="background" args={['#030303']} />
        <fog attach="fog" args={['#030303', 5, 20]} /> 
        <ambientLight intensity={0.2} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <MouseRig>
            <Float speed={1} rotationIntensity={0.5} floatIntensity={0.5}>
              <ParticleSphere />
            </Float>
        </MouseRig>

        <FloatingDust />
        <TechDebris />
        <MeteorShower />

        {/* Post Processing: Added Chromatic Aberration & fixed Normal Pass */}
        <EffectComposer enableNormalPass>
          <Bloom luminanceThreshold={0} mipmapBlur intensity={2.5} radius={0.5} />
          <Noise opacity={0.05} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <ChromaticAberration 
            // @ts-ignore
            offset={new THREE.Vector2(0.002, 0.002)} 
            radialModulation={false}
            modulationOffset={0}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}