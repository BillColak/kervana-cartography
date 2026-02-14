import { TrailingBlockPlugin } from "platejs";

import { AutoformatKit } from "@/features/editor/kits/autoformat-kit";
import { BasicBlocksKit } from "@/features/editor/kits/basic-blocks-kit";
import { BasicMarksKit } from "@/features/editor/kits/basic-marks-kit";
import { CalloutKit } from "@/features/editor/kits/callout-kit";
import { CodeBlockKit } from "@/features/editor/kits/code-block-kit";
import { ExitBreakKit } from "@/features/editor/kits/exit-break-kit";
import { FloatingToolbarKit } from "@/features/editor/kits/floating-toolbar-kit";
import { LinkKit } from "@/features/editor/kits/link-kit";
import { ListKit } from "@/features/editor/kits/list-kit";
import { MarkdownKit } from "@/features/editor/kits/markdown-kit";
import { SlashKit } from "@/features/editor/kits/slash-kit";
import { TableKit } from "@/features/editor/kits/table-kit";
import { ToggleKit } from "@/features/editor/kits/toggle-kit";

export const EditorKit = [
  // Elements
  ...BasicBlocksKit,
  ...CodeBlockKit,
  ...TableKit,
  ...ToggleKit,
  ...CalloutKit,
  ...LinkKit,

  // Marks
  ...BasicMarksKit,

  // Block Style
  ...ListKit,

  // Editing
  ...SlashKit,
  ...AutoformatKit,
  ...ExitBreakKit,
  TrailingBlockPlugin,

  // Parsers
  ...MarkdownKit,

  // UI
  ...FloatingToolbarKit,
];
