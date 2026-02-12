import { LinkElement } from "@/features/editor/nodes/link-node";
import { LinkPlugin } from "@platejs/link/react";

export const LinkKit = [
  LinkPlugin.configure({
    render: {
      node: LinkElement,
    },
  }),
];
