import { useToggleButton, useToggleButtonState } from "@platejs/toggle/react";
import { ChevronRight } from "lucide-react";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function ToggleElement(props: PlateElementProps) {
  const element = props.element;
  const state = useToggleButtonState(element.id as string);
  const { buttonProps, open } = useToggleButton(state);

  return (
    <PlateElement {...props} className="pl-6 relative">
      <button
        type="button"
        className="absolute top-0.5 -left-0.5 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
        contentEditable={false}
        {...buttonProps}
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform duration-75 ${open ? "rotate-90" : "rotate-0"}`}
        />
      </button>
      {props.children}
    </PlateElement>
  );
}
