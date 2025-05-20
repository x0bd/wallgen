"use client";

import React from "react";
import ShaderCanvas from "./ShaderCanvas";
import { useAlgorithm } from "@/context/algorithm-context";

interface GradientCanvasProps {
	width?: number;
	height?: number;
	className?: string;
}

const GradientCanvas: React.FC<GradientCanvasProps> = ({
	width = 400,
	height = 300,
	className,
}) => {
	const { algorithm } = useAlgorithm();

	// Only render if the algorithm is "gradient"
	if (algorithm !== "gradient") {
		return null;
	}

	return <ShaderCanvas width={width} height={height} className={className} />;
};

export default GradientCanvas;
