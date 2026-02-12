import { TrailingBlockPlugin } from "platejs";

import { AutoformatKit } from "@/features/editor/kits/autoformat-kit";
import { BasicBlocksKit } from "@/features/editor/kits/basic-blocks-kit";
import { BasicMarksKit } from "@/features/editor/kits/basic-marks-kit";
import { FloatingToolbarKit } from "@/features/editor/kits/floating-toolbar-kit";
import { LinkKit } from "@/features/editor/kits/link-kit";
import { ListKit } from "@/features/editor/kits/list-kit";
import { MarkdownKit } from "@/features/editor/kits/markdown-kit";

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,

  // Block Style
  ...ListKit,

  // Editing
  ...AutoformatKit,
  TrailingBlockPlugin,

  // Parsers
  ...MarkdownKit,

  // UI
  ...FloatingToolbarKit,
];
