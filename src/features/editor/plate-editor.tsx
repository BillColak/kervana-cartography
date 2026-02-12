import { deserializeMd, serializeMd } from "@platejs/markdown";
import type { TElement } from "platejs";
import { createSlateEditor } from "platejs";
import { Plate, usePlateEditor } from "platejs/react";
import { useCallback, useMemo } from "react";

import { EditorKit } from "@/features/editor/kits/editor-kit";
import { Editor, EditorContainer } from "@/features/editor/nodes/editor";

interface PlateEditorProps {
  nodeId: string;
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}

const EMPTY_VALUE: TElement[] = [{ type: "p", children: [{ text: "" }] }];

function markdownToValue(markdown: string): TElement[] {
  if (!markdown.trim()) return EMPTY_VALUE;

  try {
    const tempEditor = createSlateEditor({ plugins: EditorKit });
    const value = deserializeMd(tempEditor, markdown);
    return value && value.length > 0 ? (value as TElement[]) : EMPTY_VALUE;
  } catch {
    return EMPTY_VALUE;
  }
}

export function PlateEditorWrapper({ nodeId, initialMarkdown, onChange }: PlateEditorProps) {
  return <PlateEditorInner key={nodeId} initialMarkdown={initialMarkdown} onChange={onChange} />;
}

function PlateEditorInner({
  initialMarkdown,
  onChange,
}: {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
}) {
  const initialValue = useMemo(() => markdownToValue(initialMarkdown), [initialMarkdown]);

  const editor = usePlateEditor({
    plugins: EditorKit,
    value: initialValue,
  });

  const handleChange = useCallback(
    ({ value }: { value: TElement[] }) => {
      try {
        const md = serializeMd(editor, { value });
        onChange(md);
      } catch {
        // Don't break the editor if serialization fails
      }
    },
    [editor, onChange],
  );

  return (
    <Plate editor={editor} onChange={handleChange}>
      <EditorContainer>
        <Editor placeholder="Start writing notes..." />
      </EditorContainer>
    </Plate>
  );
}
