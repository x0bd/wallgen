"use client";

import React, { useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
// import { useAlgorithm } from "@/context/algorithm-context"; // Temporarily unused for debugging

// Super basic vertex shader - just pass UV coordinates
const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

// Direct implementation of basic.glsl with THREE's coordinate system
const fragmentShader = `
varying vec2 vUv;

#define SRGB_TO_LINEAR(c) pow((c), vec3(2.2))
#define LINEAR_TO_SRGB(c) pow((c), vec3(1.0 / 2.2))
#define SRGB(r, g, b) SRGB_TO_LINEAR(vec3(float(r), float(g), float(b)) / 255.0)

const vec3 COLOR0 = SRGB(255, 0, 114); // Pink from basic.glsl
const vec3 COLOR1 = SRGB(197, 255, 80); // Green from basic.glsl

// Gradient noise from basic.glsl
float gradientNoise(in vec2 uv) {
  const vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
  return fract(magic.z * fract(dot(uv, magic.xy)));
}

void main() {
  // In React Three Fiber, vUv is already in 0-1 range for the canvas
  // Simple gradient based on x-position
  float t = smoothstep(0.0, 1.0, vUv.x);
  
  // Interpolate between colors in linear space
  vec3 color = mix(COLOR0, COLOR1, t);
  
  // Convert from linear to sRGB
  color = LINEAR_TO_SRGB(color);
  
  // Add gradient noise to reduce banding
  color += (1.0/255.0) * gradientNoise(vUv * 1000.0) - (0.5/255.0);
  
  gl_FragColor = vec4(color, 1.0);
}
`;

// A simple full-screen quad for the shader
function GradientMaterial() {
	// Create a full-screen quad that's pre-transformed
	return (
		<mesh>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				// No uniforms needed for this simplified version
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
				<GradientMaterial />
			</Canvas>
		</div>
	);
};

export default ShaderCanvas;
