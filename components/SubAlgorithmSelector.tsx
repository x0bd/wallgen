"use client";

import React, { useEffect, useState } from "react";
import {
	useAlgorithm,
	AbstractSubAlgorithmType,
} from "@/context/algorithm-context";

interface SubAlgorithmOption {
	id: AbstractSubAlgorithmType;
	label: string;
	description: string;
}

const subAlgorithmOptions: SubAlgorithmOption[] = [
	{
		id: "mondriomaton",
		label: "Mondriomaton",
		description:
			"Cellular automata inspired by Piet Mondrian's De Stijl movement.",
	},
	{
		id: "futureAbstract1",
		label: "Algorithm 1",
		description: "Coming soon: Another abstract algorithm.",
	},
	{
		id: "futureAbstract2",
		label: "Algorithm 2",
		description: "Coming soon: Yet another abstract algorithm.",
	},
];

const SubAlgorithmSelector: React.FC = () => {
	const { algorithm, subAlgorithm, setSubAlgorithm } = useAlgorithm();
	const [isVisible, setIsVisible] = useState(false);

	// Show the selector only when the abstract algorithm is selected
	useEffect(() => {
		setIsVisible(algorithm === "abstract");
	}, [algorithm]);

	if (!isVisible) return null;

	return (
		<div className="mt-4 p-4 bg-neutral-900/50 rounded-lg">
			<h2 className="text-lg font-medium mb-2">Abstract Style</h2>
			<div className="grid grid-cols-1 md:grid-cols-3 gap-2">
				{subAlgorithmOptions.map((option) => (
					<button
						key={option.id}
						className={`p-3 rounded-md text-left transition-colors ${
							subAlgorithm === option.id
								? "bg-blue-600 text-white"
								: "bg-neutral-800 hover:bg-neutral-700"
						}`}
						onClick={() => setSubAlgorithm(option.id)}
					>
						<div className="font-medium">{option.label}</div>
						<div className="text-xs mt-1 opacity-80">
							{option.description}
						</div>
					</button>
				))}
			</div>
		</div>
	);
};

export default SubAlgorithmSelector;
