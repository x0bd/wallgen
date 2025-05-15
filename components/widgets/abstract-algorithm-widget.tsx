"use client";

import { Layers } from "lucide-react";
import { ToggleWidget } from "@/components/ui/toggle-widget";
import { useAlgorithm } from "@/context/algorithm-context";
import { AbstractSubAlgorithmType } from "@/context/algorithm-context";

export function AbstractAlgorithmWidget() {
	const { params, updateParams, isSaving } = useAlgorithm();

	// Available abstract algorithms with descriptions
	const abstractAlgorithms: {
		id: AbstractSubAlgorithmType;
		name: string;
		description: string;
	}[] = [
		{
			id: "mondriomaton",
			name: "Mondriomaton",
			description:
				"Cellular automaton inspired by Piet Mondrian's De Stijl art movement with dynamic grid patterns.",
		},
		{
			id: "generativeMondrian",
			name: "Generative Mondrian",
			description:
				"Recursive divisions creating Mondrian-style compositions with colorful rectangles.",
		},
		{
			id: "circuitBoard",
			name: "Circuit Board",
			description:
				"Abstract electronic circuit patterns with connecting pathways.",
		},
	];

	// Handler for algorithm selection
	const handleAlgorithmChange = (algorithmId: AbstractSubAlgorithmType) => {
		updateParams({ abstractAlgorithm: algorithmId });
	};

	return (
		<ToggleWidget
			title="Abstract Algorithm"
			icon={<Layers size={14} />}
			className="w-full"
			defaultOpen={true}
		>
			<div className="p-4 space-y-4">
				<p className="text-xs opacity-70 font-mono bg-black/5 dark:bg-white/5 p-2 rounded">
					Select an abstract algorithm style to generate different
					types of patterns
				</p>

				<div className="space-y-2">
					{abstractAlgorithms.map((algo) => (
						<div
							key={algo.id}
							onClick={() =>
								!isSaving && handleAlgorithmChange(algo.id)
							}
							className={`
                cursor-pointer p-3 rounded-md border 
                ${
					params.abstractAlgorithm === algo.id
						? "border-black dark:border-white bg-black/5 dark:bg-white/5"
						: "border-black/10 dark:border-white/10 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
				}
                ${isSaving ? "opacity-50 pointer-events-none" : ""}
                transition-colors
              `}
						>
							<div className="flex items-center justify-between">
								<h3 className="text-sm font-medium font-mono">
									{algo.name}
								</h3>
								{params.abstractAlgorithm === algo.id && (
									<div className="h-2 w-2 rounded-full bg-black dark:bg-white"></div>
								)}
							</div>
							<p className="text-xs opacity-70 mt-1">
								{algo.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</ToggleWidget>
	);
}
