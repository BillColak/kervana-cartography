import type { PlateLeafProps } from "platejs/react";
import { PlateLeaf } from "platejs/react";

export function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="bg-yellow-200/50 dark:bg-yellow-500/30 text-inherit">
      {props.children}
    </PlateLeaf>
  );
}
