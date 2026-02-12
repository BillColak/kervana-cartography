import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";
import { cn } from "@/lib/utils";

export function BlockquoteElement(props: PlateElementProps) {
	return (
		<PlateElement
			as="blockquote"
			className={cn("my-1 border-l-2 border-gray-300 pl-4 italic text-gray-600")}
			{...props}
		>
			{props.children}
		</PlateElement>
	);
}
