import { cn } from "@/lib/utils";
import type { PlateLeafProps } from "platejs/react";
import { PlateLeaf } from "platejs/react";

export function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className={cn("rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800")}
    >
      {props.children}
    </PlateLeaf>
  );
}
