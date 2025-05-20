"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useAlgorithm } from "@/context/algorithm-context";

// Define the prop interface for consistency
interface P5CanvasProps {
	width?: number;
	height?: number;
	className?: string;
}

// Dynamically load implementations with no SSR
const P5CanvasImpl = dynamic(() => import("./P5CanvasImpl"), {
	ssr: false,
	loading: () => (
		<div className="w-full h-full flex items-center justify-center bg-black">
			<div className="text-white font-mono text-sm">
				Loading canvas...
			</div>
		</div>
	),
});

const GradientCanvas = dynamic(() => import("./GradientCanvas"), {
	ssr: false,
	loading: () => (
		<div className="w-full h-full flex items-center justify-center bg-black">
			<div className="text-white font-mono text-sm">
				Loading gradient shader...
			</div>
		</div>
	),
});

// This is a wrapper component that safely renders the appropriate canvas based on the algorithm
export function P5Canvas(props: P5CanvasProps) {
	const { algorithm } = useAlgorithm();

	return (
		<>
			{algorithm === "gradient" ? (
				<GradientCanvas {...props} />
			) : (
				<P5CanvasImpl {...props} />
			)}
		</>
	);
}
