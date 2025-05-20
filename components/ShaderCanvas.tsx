"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useAlgorithm } from "@/context/algorithm-context";

// Simple pass-through vertex shader
const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// Fragment shader
const fragmentShader = `
  precision mediump float;

  uniform vec3 uColor1;
  uniform vec3 uColor2;
  uniform float uTime;
  uniform vec2 uResolution;

  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 q = uv - vec2(0.5, 0.0);

    vec3 col = mix(uColor1, uColor2, uv.y);

    float r = 0.8 + 0.25 * sin(uTime) * 2.0 * cos(atan(q.x, q.y) * 0.0 + 10.0 * q.x + 1.0);
    r += cos(0.5 * uTime * (q.y * 0.17)) * 0.1;

    col += smoothstep(r + 0.1, sin(r) * 0.5 + 0.1 + 0.1, length(q));

    col *= fract(uv.y);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// The shader mesh that renders our gradient
function GradientShaderMesh() {
	const meshRef = useRef<THREE.Mesh>(null);
	const materialRef = useRef<THREE.ShaderMaterial>(null);
	const { size } = useThree();
	const { getCurrentColors, params } = useAlgorithm();

	// Get colors from the algorithm context
	const getShaderColors = () => {
		const colors = getCurrentColors();
		const foregroundColors = colors.foregroundColors || [];

		// Convert hex colors to THREE.Color objects
		const color1 = new THREE.Color(
			foregroundColors[0] || colors.foreground || "#cc1ab3"
		);
		const color2 = new THREE.Color(
			foregroundColors[1] || colors.background || "#6633ff"
		);

		return {
			color1: [color1.r, color1.g, color1.b],
			color2: [color2.r, color2.g, color2.b],
		};
	};

	// Animation loop
	useFrame(({ clock }) => {
		if (materialRef.current) {
			const speedFactor = (params.speed || 50) / 50;
			materialRef.current.uniforms.uTime.value =
				clock.getElapsedTime() * speedFactor;

			const { color1, color2 } = getShaderColors();
			materialRef.current.uniforms.uColor1.value = new THREE.Vector3(
				...color1
			);
			materialRef.current.uniforms.uColor2.value = new THREE.Vector3(
				...color2
			);

			// Update resolution if window size changes
			if (
				materialRef.current.uniforms.uResolution.value.x !==
					size.width ||
				materialRef.current.uniforms.uResolution.value.y !== size.height
			) {
				materialRef.current.uniforms.uResolution.value.set(
					size.width,
					size.height
				);
			}
		}
	});

	// Initial shader colors and resolution
	const { color1, color2 } = getShaderColors();

	return (
		<mesh ref={meshRef} position={[0, 0, 0]}>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				ref={materialRef}
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={{
					uTime: { value: 0 },
					uColor1: { value: new THREE.Vector3(...color1) },
					uColor2: { value: new THREE.Vector3(...color2) },
					uResolution: {
						value: new THREE.Vector2(size.width, size.height),
					},
				}}
			/>
		</mesh>
	);
}

interface ShaderCanvasProps {
	width?: number;
	height?: number;
	className?: string;
}

// Main ShaderCanvas component
const ShaderCanvas: React.FC<ShaderCanvasProps> = ({
	width = 400,
	height = 300,
	className,
}) => {
	return (
		<div
			className={className || ""}
			style={{
				width: width,
				height: height,
				margin: "0 auto",
				position: "relative",
				overflow: "hidden",
				boxShadow: "0 0 20px rgba(0,0,0,0.2)",
				borderRadius: "4px",
			}}
		>
			<Canvas
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
				gl={{
					antialias: true,
					powerPreference: "high-performance",
				}}
			>
				<GradientShaderMesh />
			</Canvas>
		</div>
	);
};

export default ShaderCanvas;
