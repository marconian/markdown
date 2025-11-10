import { vi } from 'vitest';

const highlightMocks = vi.hoisted(() => ({
    highlightElement: vi.fn(),
}));

export const { highlightElement } = highlightMocks;

const mermaidMocks = vi.hoisted(() => ({
    mermaidParse: vi.fn().mockResolvedValue(true),
    mermaidRender: vi.fn().mockResolvedValue({
        svg: '<svg data-testid="mermaid-diagram"></svg>',
        bindFunctions: vi.fn(),
    }),
}));

export const { mermaidParse, mermaidRender } = mermaidMocks;

import '@testing-library/jest-dom/vitest';
import type { ReactNode } from 'react';

vi.mock('../highlight', () => ({
    highlightElement,
    configureHighlight: vi.fn(),
    getHighlightInstance: vi.fn(() => ({ highlightElement })),
    defaultHighlightLanguages: [],
}));

vi.mock('@mui/x-data-grid/esm/index.css', () => ({}));

type DataGridColumn = {
    field: string;
    headerName: string;
    renderHeader?: (params: { colDef: Record<string, unknown> }) => ReactNode;
    renderCell?: (params: { value: unknown; row: Record<string, unknown>; colDef: Record<string, unknown> }) => ReactNode;
};

type DataGridProps = {
    rows: Array<Record<string, unknown>>;
    columns: Array<DataGridColumn>;
};

vi.mock('@mui/x-data-grid', () => ({
    DataGrid: ({ rows, columns }: DataGridProps) => (
        <table data-testid="mock-data-grid">
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th key={col.field} scope="col">
                            {col.renderHeader ? col.renderHeader({ colDef: col }) : col.headerName}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr key={(row.id as string) ?? JSON.stringify(row)}>
                        {columns.map((col) => (
                            <td key={col.field}>
                                {col.renderCell
                                    ? col.renderCell({
                                          value: row[col.field],
                                          row,
                                          colDef: col,
                                      })
                                    : (row[col.field] as ReactNode)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    ),
}));

vi.mock('mermaid', () => ({
    default: {
        parse: mermaidParse,
        render: mermaidRender,
    },
}));

export function resetRenderMocks() {
    highlightElement.mockClear();
    mermaidParse.mockClear();
    mermaidRender.mockClear();
}
