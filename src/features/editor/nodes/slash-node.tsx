import {
  Code2,
  ChevronRightIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  LightbulbIcon,
  ListIcon,
  ListOrdered,
  MinusIcon,
  PilcrowIcon,
  Quote,
  Square,
  Table,
} from "lucide-react";
import { KEYS, type TComboboxInputElement } from "platejs";
import type { PlateEditor, PlateElementProps } from "platejs/react";
import { PlateElement } from "platejs/react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface SlashItem {
  icon: React.ReactNode;
  label: string;
  value: string;
  keywords?: string[];
}

const SLASH_ITEMS: SlashItem[] = [
  { icon: <PilcrowIcon className="w-4 h-4" />, label: "Text", value: KEYS.p, keywords: ["paragraph"] },
  { icon: <Heading1Icon className="w-4 h-4" />, label: "Heading 1", value: KEYS.h1, keywords: ["title", "h1"] },
  { icon: <Heading2Icon className="w-4 h-4" />, label: "Heading 2", value: KEYS.h2, keywords: ["subtitle", "h2"] },
  { icon: <Heading3Icon className="w-4 h-4" />, label: "Heading 3", value: KEYS.h3, keywords: ["h3"] },
  { icon: <ListIcon className="w-4 h-4" />, label: "Bulleted List", value: KEYS.ul, keywords: ["unordered", "ul"] },
  { icon: <ListOrdered className="w-4 h-4" />, label: "Numbered List", value: KEYS.ol, keywords: ["ordered", "ol"] },
  { icon: <Square className="w-4 h-4" />, label: "To-do List", value: KEYS.listTodo, keywords: ["checklist", "checkbox", "task"] },
  { icon: <Quote className="w-4 h-4" />, label: "Blockquote", value: KEYS.blockquote, keywords: ["quote"] },
  { icon: <Code2 className="w-4 h-4" />, label: "Code Block", value: KEYS.codeBlock, keywords: ["code", "```"] },
  { icon: <Table className="w-4 h-4" />, label: "Table", value: KEYS.table },
  { icon: <ChevronRightIcon className="w-4 h-4" />, label: "Toggle", value: KEYS.toggle, keywords: ["collapsible", "expandable"] },
  { icon: <LightbulbIcon className="w-4 h-4" />, label: "Callout", value: KEYS.callout, keywords: ["note", "info"] },
  { icon: <MinusIcon className="w-4 h-4" />, label: "Divider", value: KEYS.hr, keywords: ["separator", "line"] },
];

function insertBlock(editor: PlateEditor, type: string) {
  // Remove the slash command input
  editor.tf.deleteBackward("block");

  if (type === KEYS.table) {
    editor.tf.insertNodes(
      {
        type: KEYS.table,
        children: [
          {
            type: KEYS.tr,
            children: [
              { type: KEYS.th, children: [{ type: KEYS.p, children: [{ text: "" }] }] },
              { type: KEYS.th, children: [{ type: KEYS.p, children: [{ text: "" }] }] },
            ],
          },
          {
            type: KEYS.tr,
            children: [
              { type: KEYS.td, children: [{ type: KEYS.p, children: [{ text: "" }] }] },
              { type: KEYS.td, children: [{ type: KEYS.p, children: [{ text: "" }] }] },
            ],
          },
        ],
      },
    );
    return;
  }

  if (type === KEYS.codeBlock) {
    editor.tf.insertNodes({
      type: KEYS.codeBlock,
      lang: "plaintext",
      children: [{ type: KEYS.codeLine, children: [{ text: "" }] }],
    });
    return;
  }

  editor.tf.setNodes({ type });
}

export function SlashInputElement(props: PlateElementProps<TComboboxInputElement>) {
  const { editor, element } = props;
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return SLASH_ITEMS;
    const lower = search.toLowerCase();
    return SLASH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(lower) ||
        item.keywords?.some((k) => k.includes(lower)),
    );
  }, [search]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filtered.length]);

  const selectItem = useCallback(
    (item: SlashItem) => {
      insertBlock(editor, item.value);
    },
    [editor],
  );

  // Track input changes through the element's text
  useEffect(() => {
    const text = element.children?.[0]?.text as string || "";
    setSearch(text);
  }, [element.children]);

  return (
    <PlateElement {...props} as="span">
      <span className="text-gray-400">/</span>
      <span
        ref={inputRef}
        className="outline-none"
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && filtered[selectedIndex]) {
            e.preventDefault();
            selectItem(filtered[selectedIndex]);
          } else if (e.key === "Escape") {
            e.preventDefault();
            editor.tf.deleteBackward("block");
          }
        }}
      >
        {props.children}
      </span>

      <span contentEditable={false} className="relative">
        <div
          ref={listRef}
          className="absolute left-0 top-6 z-50 w-56 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No results</div>
          ) : (
            <div className="max-h-64 overflow-y-auto py-1">
              {filtered.map((item, i) => (
                <button
                  key={item.value}
                  type="button"
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                    i === selectedIndex
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectItem(item);
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                >
                  <span className="text-gray-400 dark:text-gray-500">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </span>
    </PlateElement>
  );
}
