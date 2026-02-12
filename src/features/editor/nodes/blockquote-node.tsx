import { cn } from "@/lib/utils";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

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
