import { cn } from "@/lib/utils";
import type { PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";

export function H1Element(props: PlateElementProps) {
  return (
    <PlateElement as="h1" className={cn("mt-[1.6em] mb-1 pb-1 font-bold text-4xl")} {...props}>
      {props.children}
    </PlateElement>
  );
}

export function H2Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h2"
      className={cn("mt-[1.4em] mb-1 pb-px font-semibold text-2xl tracking-tight")}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}

export function H3Element(props: PlateElementProps) {
  return (
    <PlateElement
      as="h3"
      className={cn("mt-[1em] mb-1 pb-px font-semibold text-xl tracking-tight")}
      {...props}
    >
      {props.children}
    </PlateElement>
  );
}
