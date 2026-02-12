import { FloatingToolbar } from "@/features/editor/editor-toolbar";
import { createPlatePlugin } from "platejs/react";

export const FloatingToolbarKit = [
  createPlatePlugin({
    key: "floating-toolbar",
    render: {
      afterEditable: () => <FloatingToolbar />,
    },
  }),
];
