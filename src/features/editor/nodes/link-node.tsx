import { cn } from "@/lib/utils";
import { getLinkAttributes } from "@platejs/link";
import type { TLinkElement } from "platejs";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  return (
    <PlateElement
      {...props}
      as="a"
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
        onMouseOver: (e: React.MouseEvent) => {
          e.stopPropagation();
        },
      }}
      className={cn("font-medium text-blue-600 underline decoration-blue-600 underline-offset-4")}
    >
      {props.children}
    </PlateElement>
  );
}
