"use client";

import { Sliders, Palette, MousePointer } from "lucide-react";
import { ToggleWidget } from "@/components/ui/toggle-widget";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Slider } from "@/components/ui/slider";
import { useAlgorithm } from "@/context/algorithm-context";

export function GradientWidget() {
	const { params, updateParams, algorithm, isSaving } = useAlgorithm();

	// Only render if the algorithm is "gradient"
	if (algorithm !== "gradient") {
		return null;
	}

	// Handle slider changes
	const handleParamChange = (param: keyof typeof params, value: number) => {
		updateParams({ [param]: value });
	};

	// Handle toggle changes
	const handleToggleChange = (param: keyof typeof params, value: boolean) => {
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
					High-quality gradient with gamma correction and
					anti-banding. Move your mouse over the canvas to change the
					gradient direction.
				</p>

				{/* Color Controls */}
				<div className="space-y-2.5">
					<div className="flex items-center justify-between">
						<label className="text-xs font-mono tracking-tight">
							Interaction
						</label>
						<div className="flex items-center gap-2">
							<MousePointer size={14} className="opacity-60" />
							<span className="text-xs font-mono opacity-70">
								Mouse controlled
							</span>
						</div>
					</div>
				</div>

				{/* When we add more gradient types */}
				<div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
					<p className="text-xs font-mono tracking-tight">
						GRADIENT OPTIONS
					</p>

					<div className="flex items-center justify-between p-2 rounded-md bg-black/5 dark:bg-white/5 text-center">
						<span className="text-xs font-mono w-full">
							More gradient types coming soon!
						</span>
					</div>
				</div>
			</div>
		</ToggleWidget>
	);
}
