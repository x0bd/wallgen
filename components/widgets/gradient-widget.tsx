"use client";

import React from "react";
import { Clock, Palette, MousePointer } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useAlgorithm } from "@/context/algorithm-context";
import { ToggleWidget } from "@/components/ui/toggle-widget";

export function GradientWidget() {
	const { params, updateParams, algorithm, isSaving } = useAlgorithm();

	const handleParamChange = (param: string, value: number) => {
		updateParams({ [param]: value });
	};

	return (
		<ToggleWidget
			title="Gradient Controls"
			icon={<Palette size={14} />}
			className="w-full"
			defaultOpen={true}
		>
			<div className="p-4 space-y-5">
				{/* Info message */}
				<p className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
					Animated gradient shader with interactive controls.
				</p>

				{/* Animation Speed */}
				<div className="space-y-2.5">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Clock size={14} className="opacity-60" />
							<label className="text-xs font-mono tracking-tight">
								Animation Speed
							</label>
						</div>
						<span className="text-xs font-mono bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md min-w-[2.5rem] text-center">
							{params.speed || 50}%
						</span>
					</div>
					<Slider
						value={[params.speed || 50]}
						onValueChange={(value) =>
							handleParamChange("speed", value[0])
						}
						min={0}
						max={100}
						step={1}
						disabled={isSaving}
						className={`[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-black [&_[role=slider]]:dark:bg-white ${
							isSaving ? "opacity-50" : ""
						}`}
					/>
				</div>

				{/* Gradient Info */}
				<div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
					<p className="text-xs font-mono tracking-tight">
						INTERACTIVE FEATURES
					</p>

					<div className="space-y-2">
						<div className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5">
							<div className="flex items-center gap-2">
								<MousePointer
									size={14}
									className="opacity-60"
								/>
								<span className="text-xs font-mono">
									Colors from palette
								</span>
							</div>
						</div>

						<div className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5">
							<div className="flex items-center gap-2">
								<Clock size={14} className="opacity-60" />
								<span className="text-xs font-mono">
									Time-based animation
								</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</ToggleWidget>
	);
}
