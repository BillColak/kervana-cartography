import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function HrElement(props: PlateElementProps) {
  return (
    <PlateElement {...props}>
      <hr className="my-4 border-t border-gray-300" />
      {props.children}
    </PlateElement>
  );
}
