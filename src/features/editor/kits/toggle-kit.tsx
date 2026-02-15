import { TogglePlugin } from "@platejs/toggle/react";
import { IndentKit } from "@/features/editor/kits/indent-kit";
import { ToggleElement } from "@/features/editor/nodes/toggle-node";

export const ToggleKit = [
  ...IndentKit,
  TogglePlugin.withComponent(ToggleElement),
];
