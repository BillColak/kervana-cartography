import { CheckIcon, CopyIcon } from "lucide-react";
import { NodeApi, type TCodeBlockElement, type TCodeSyntaxLeaf } from "platejs";
import {
  PlateElement,
  type PlateElementProps,
  PlateLeaf,
  type PlateLeafProps,
  useElement,
} from "platejs/react";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export function CodeBlockElement(props: PlateElementProps<TCodeBlockElement>) {
  const element = useElement<TCodeBlockElement>();

  return (
    <PlateElement
      className={cn(
        "py-1",
        // Syntax highlighting colors
        "**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-type]:text-[#d73a49] dark:**:[.hljs-keyword,.hljs-doctag,.hljs-template-tag,.hljs-type]:text-[#ee6960]",
        "**:[.hljs-string,.hljs-regexp,.hljs-meta_.hljs-string]:text-[#032f62] dark:**:[.hljs-string,.hljs-regexp,.hljs-meta_.hljs-string]:text-[#3593ff]",
        "**:[.hljs-attr,.hljs-number,.hljs-literal,.hljs-variable]:text-[#005cc5] dark:**:[.hljs-attr,.hljs-number,.hljs-literal,.hljs-variable]:text-[#6596cf]",
        "**:[.hljs-comment,.hljs-code]:text-[#6a737d]",
        "**:[.hljs-title,.hljs-title.function\\\\_]:text-[#6f42c1] dark:**:[.hljs-title,.hljs-title.function\\\\_]:text-[#a77bfa]",
        "**:[.hljs-name,.hljs-selector-tag]:text-[#22863a] dark:**:[.hljs-name,.hljs-selector-tag]:text-[#36a84f]",
        "**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#e36209] dark:**:[.hljs-built\\\\_in,.hljs-symbol]:text-[#c3854e]",
      )}
      {...props}
    >
      <div className="relative rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1" contentEditable={false}>
          {element.lang && element.lang !== "plaintext" && (
            <span className="text-[10px] text-gray-400 font-mono uppercase mr-1">
              {element.lang}
            </span>
          )}
          <CopyButton getValue={() => NodeApi.string(element)} />
        </div>
        <pre className="overflow-x-auto p-4 pr-20 font-mono text-sm leading-relaxed [tab-size:2]">
          <code>{props.children}</code>
        </pre>
      </div>
    </PlateElement>
  );
}

function CopyButton({ getValue }: { getValue: () => string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(getValue());
    setCopied(true);
  }, [getValue]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-colors"
    >
      {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
    </button>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps<TCodeSyntaxLeaf>) {
  return <PlateLeaf className={props.leaf.className as string} {...props} />;
}
