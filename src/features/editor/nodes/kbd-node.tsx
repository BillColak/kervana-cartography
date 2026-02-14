import type { PlateLeafProps } from "platejs/react";
import { PlateLeaf } from "platejs/react";
import { cn } from "@/lib/utils";

export function KbdLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="kbd"
      className={cn(
        "rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.8em] shadow-[0_2px_0_1px] shadow-border",
      )}
    >
      {props.children}
    </PlateLeaf>
  );
}
