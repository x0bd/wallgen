"use client";

import React from "react";
import dynamic from "next/dynamic";

// Define the prop interface for consistency
interface P5CanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

// Use next/dynamic to load the component with no SSR
const P5CanvasImpl = dynamic(() => import('./P5CanvasImpl'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <div className="text-white font-mono text-sm">Loading canvas...</div>
    </div>
  )
});

// This is a wrapper component that safely renders the canvas only on the client
export function P5Canvas(props: P5CanvasProps) {
  return <P5CanvasImpl {...props} />;
}