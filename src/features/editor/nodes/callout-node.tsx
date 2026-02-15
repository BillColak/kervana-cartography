import { PlateElement } from "platejs/react";
import type { PlateElementProps } from "platejs/react";
import { cn } from "@/lib/utils";

export function CalloutElement({ className, ...props }: PlateElementProps) {
  const icon = (props.element.icon as string) || "💡";

  return (
    <PlateElement
      className={cn("my-1 flex rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 pl-3", className)}
      {...props}
    >
      <div className="flex w-full gap-3 rounded-md">
        <span
          className="select-none text-lg leading-none mt-0.5"
          contentEditable={false}
          style={{
            fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"',
          }}
        >
          {icon}
        </span>
        <div className="w-full min-w-0">{props.children}</div>
      </div>
    </PlateElement>
  );
}
