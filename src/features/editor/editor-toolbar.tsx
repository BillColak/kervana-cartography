import { cn } from "@/lib/utils";
import {
  type FloatingToolbarState,
  flip,
  offset,
  useFloatingToolbar,
  useFloatingToolbarState,
} from "@platejs/floating";
import {
  Bold,
  Code2,
  Highlighter,
  Italic,
  Strikethrough,
  Subscript,
  Superscript,
  Underline,
} from "lucide-react";
import { KEYS } from "platejs";
import {
  useEditorId,
  useEditorReadOnly,
  useEventEditorValue,
  useMarkToolbarButton,
  useMarkToolbarButtonState,
} from "platejs/react";

function MarkButton({
  nodeType,
  children,
  tooltip,
}: {
  nodeType: string;
  children: React.ReactNode;
  tooltip: string;
}) {
  const state = useMarkToolbarButtonState({ nodeType });
  const { props } = useMarkToolbarButton(state);

  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-md p-1.5 text-sm transition-colors",
        "hover:bg-gray-200 dark:hover:bg-gray-600",
        props.pressed && "bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100",
        !props.pressed && "text-gray-600 dark:text-gray-400",
      )}
      title={tooltip}
      onMouseDown={(e) => {
        e.preventDefault();
        props.onClick?.();
      }}
    >
      {children}
    </button>
  );
}

export function FloatingToolbar({
  state,
}: {
  state?: FloatingToolbarState;
}) {
  const editorId = useEditorId();
  const focusedEditorId = useEventEditorValue("focus");
  const readOnly = useEditorReadOnly();

  const floatingToolbarState = useFloatingToolbarState({
    editorId,
    focusedEditorId,
    floatingOptions: {
      middleware: [
        offset(12),
        flip({
          fallbackPlacements: ["top-start", "top-end", "bottom-start", "bottom-end"],
          padding: 12,
        }),
      ],
      placement: "top",
      ...state?.floatingOptions,
    },
    ...state,
  });

  const {
    clickOutsideRef,
    hidden,
    props: rootProps,
    ref: floatingRef,
  } = useFloatingToolbar(floatingToolbarState);

  if (hidden || readOnly) return null;

  return (
    <div ref={clickOutsideRef}>
      <div
        {...rootProps}
        ref={floatingRef}
        className={cn(
          "absolute z-50 flex items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-lg border border-gray-200 dark:border-border bg-white dark:cosmic-panel dark:cosmic-glow p-1 shadow-lg",
          "max-w-[80vw]",
        )}
      >
        <MarkButton nodeType={KEYS.bold} tooltip="Bold (Ctrl+B)">
          <Bold className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.italic} tooltip="Italic (Ctrl+I)">
          <Italic className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.underline} tooltip="Underline (Ctrl+U)">
          <Underline className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.strikethrough} tooltip="Strikethrough (Ctrl+Shift+X)">
          <Strikethrough className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.code} tooltip="Code (Ctrl+E)">
          <Code2 className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.highlight} tooltip="Highlight (Ctrl+Shift+H)">
          <Highlighter className="h-4 w-4" />
        </MarkButton>

        <div className="mx-0.5 h-5 w-px bg-gray-200 dark:bg-gray-600" />

        <MarkButton nodeType={KEYS.sub} tooltip="Subscript (Ctrl+,)">
          <Subscript className="h-4 w-4" />
        </MarkButton>
        <MarkButton nodeType={KEYS.sup} tooltip="Superscript (Ctrl+.)">
          <Superscript className="h-4 w-4" />
        </MarkButton>
      </div>
    </div>
  );
}
