import { cn } from "@/lib/utils";
import type { PlateContentProps } from "platejs/react";
import { PlateContainer, PlateContent } from "platejs/react";

export function EditorContainer({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <PlateContainer
      className={cn(
        "relative w-full cursor-text select-text overflow-y-auto caret-primary selection:bg-blue-100 focus-visible:outline-none h-full",
        className,
      )}
      {...props}
    />
  );
}

export function Editor({ className, disabled, ...props }: PlateContentProps) {
  return (
    <PlateContent
      className={cn(
        "relative w-full cursor-text select-text overflow-x-hidden whitespace-pre-wrap break-words",
        "rounded-md ring-offset-background focus-visible:outline-none",
        "placeholder:text-muted-foreground/80",
        "size-full px-4 py-3 text-sm",
        className,
      )}
      disableDefaultStyles
      disabled={disabled}
      {...props}
    />
  );
}
