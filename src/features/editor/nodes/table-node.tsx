import {
  TablePlugin,
  useTableCellElement,
  useTableElement,
} from "@platejs/table/react";
import type { TTableCellElement, TTableElement, TTableRowElement } from "platejs";
import {
  PlateElement,
  type PlateElementProps,
  useEditorPlugin,
} from "platejs/react";
import { cn } from "@/lib/utils";

export function TableElement({ children, ...props }: PlateElementProps<TTableElement>) {
  const { marginLeft, props: tableProps } = useTableElement();

  return (
    <PlateElement {...props} className="overflow-x-auto py-3" style={{ paddingLeft: marginLeft }}>
      <div className="w-fit">
        <table
          className="mr-0 ml-px table h-px table-fixed border-collapse"
          {...tableProps}
        >
          <tbody className="min-w-full">{children}</tbody>
        </table>
      </div>
    </PlateElement>
  );
}

export function TableRowElement({ children, ...props }: PlateElementProps<TTableRowElement>) {
  return (
    <PlateElement {...props} as="tr">
      {children}
    </PlateElement>
  );
}

export function TableCellElement({
  isHeader,
  ...props
}: PlateElementProps<TTableCellElement> & { isHeader?: boolean }) {
  const { api } = useEditorPlugin(TablePlugin);
  const element = props.element;
  const { selected, width, minHeight } = useTableCellElement();

  return (
    <PlateElement
      {...props}
      as={isHeader ? "th" : "td"}
      attributes={{
        ...props.attributes,
        colSpan: api.table.getColSpan(element),
        rowSpan: api.table.getRowSpan(element),
      }}
      className={cn(
        "relative h-full overflow-visible border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 p-0",
        isHeader && "bg-gray-50 dark:bg-gray-800 font-semibold text-left",
        selected && "bg-blue-50 dark:bg-blue-950/30",
      )}
      style={{
        maxWidth: width || 240,
        minWidth: width || 120,
      }}
    >
      <div className="relative z-20 box-border h-full px-3 py-2" style={{ minHeight }}>
        {props.children}
      </div>
    </PlateElement>
  );
}

export function TableCellHeaderElement(
  props: React.ComponentProps<typeof TableCellElement>,
) {
  return <TableCellElement {...props} isHeader />;
}
