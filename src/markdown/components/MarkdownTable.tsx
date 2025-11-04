import { DataGrid, GridColDef } from '@mui/x-data-grid';
import TableCellDefinition from '../models/TableCellDefinition';
import { snakeCase, sortBy, sortedUniq } from 'lodash';
import { v4 as uuid } from 'uuid';
import { MarkdownElement } from './MarkdownElement';
import MarkdownHtmlContent from './MarkdownHtmlContent';

function splitTableRow(row: string) {
    const normalized = row.replace(/[\r\n]+$/g, '');

    const cells: string[] = [];
    let current = '';

    for (let i = 0; i < normalized.length; i++) {
        const char = normalized[i];

        if (char === '\\' && i + 1 < normalized.length) {
            const next = normalized[i + 1];
            if (next === '|' || next === '\\') {
                current += next;
                i++;
                continue;
            }
        }

        if (char === '|') {
            cells.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    cells.push(current.trim());

    return cells;
}

function mergeContinuationRows(rows: string[][], headerRowCount: number) {
    const merged: string[][] = [];
    let lastDataRowIndex = -1;

    rows.forEach((row, index) => {
        const clone = [...row];
        const isHeaderRow = index < headerRowCount;

        if (isHeaderRow) {
            merged.push(clone);
            return;
        }

        if (clone[0] === '' && lastDataRowIndex !== -1 && clone.some((cell) => cell.length > 0)) {
            const target = [...merged[lastDataRowIndex]];
            const maxLength = Math.max(target.length, clone.length);
            for (let i = 0; i < maxLength; i++) {
                const addition = clone[i] ?? '';
                if (!addition) continue;
                const base = target[i] ?? '';
                target[i] = base.length > 0 ? `${base}\n${addition}` : addition;
            }
            merged[lastDataRowIndex] = target;
            return;
        }

        merged.push(clone);
        lastDataRowIndex = merged.length - 1;
    });

    return merged;
}

function MarkdownTable({ rows }: { rows: string[] }) {
    const rowCellSplits = rows.map(splitTableRow);

    const headerSplit = rowCellSplits.findIndex((x) => x.every((c) => c.match(/^:?-*:?$/g)));
    const processedRows = [...rowCellSplits];
    const columns = headerSplit !== -1 ? processedRows.splice(headerSplit, 1)[0] : null;
    const headerRowCount = headerSplit !== -1 ? headerSplit : 0;

    const mergedRows = mergeContinuationRows(processedRows, headerRowCount);

    const cellDefs = mergedRows
        .map(
            (row, i) =>
                row
                    .map((x, j) => {
                        const column = columns?.[j] ?? '';
                        const trimmed = x.trim();
                        const cellDef: TableCellDefinition = {
                            align: column.startsWith(':') && column.endsWith(':') ? 'center' : column.endsWith(':') ? 'right' : 'left',
                            content: x,
                            containsHtml: /<\/?[a-z]/i.test(trimmed),
                            header: headerSplit !== -1 ? i < headerSplit : false,
                            id: uuid(),
                        };
                        return cellDef;
                    })
                    .filter(Boolean) as TableCellDefinition[],
        )
        .filter((row) => row.length > 0);

    if (!cellDefs.length) {
        return (
            <span className="mb-3 d-block">
                <MarkdownElement>{rows.join('\n')}</MarkdownElement>
            </span>
        );
    }

    const headerRow = cellDefs.find((row) => row[0]?.header);
    const templateRow = headerRow ?? cellDefs[0];

    const columnDefs = templateRow.map((columnCell, index) => {
        const headerContent = headerRow ? columnCell.content : `Column ${index + 1}`;
        const fieldBase = headerRow ? columnCell.content : `column_${index + 1}`;
        const field = snakeCase(fieldBase) || `column_${index + 1}`;

        return {
            field,
            headerName: headerContent,
            headerClassName: 'text-bg-dark',
            headerAlign: columnCell.align ?? undefined,
            align: columnCell.align ?? undefined,
            renderHeader: ({ colDef }) => (
                <span className="markdown-table-header">
                    <MarkdownElement>{colDef.headerName}</MarkdownElement>
                </span>
            ),
            renderCell: ({ value }) => {
                const payload = (value as { content?: string; containsHtml?: boolean }) ?? { content: '' };
                const content = payload.content ?? '';
                const containsHtml = payload.containsHtml ?? false;

                return (
                    <div className="markdown-table-cell">{containsHtml ? <MarkdownHtmlContent>{content}</MarkdownHtmlContent> : <MarkdownElement>{content}</MarkdownElement>}</div>
                );
            },
            minWidth: 100,
            flex: 1,
        } as GridColDef;
    });

    const rowDefs = cellDefs
        .filter((row) => !row[0]?.header)
        .map((values) => {
            const mapped: Record<string, unknown> = {};
            values.forEach((value, index) => {
                const column = columnDefs[index];
                if (!column) return;
                mapped[column.field] = { content: value.content, containsHtml: value.containsHtml };
            });
            return { id: uuid(), ...mapped };
        });

    const rowCount = rowDefs.length;
    const defaultPageSize = Math.min(Math.max(rowCount, 1), 20);
    const pageSizes = rowCount
        ? sortedUniq(
              sortBy(
                  [defaultPageSize, 5, 10, 25, 50, 100].filter((size) => size <= rowCount),
                  (x) => x,
              ),
          )
        : [defaultPageSize];

    return (
        <DataGrid
            rowHeight={38}
            className="mb-3"
            rows={rowDefs}
            columns={columnDefs}
            initialState={{
                pagination: {
                    paginationModel: { page: 0, pageSize: defaultPageSize },
                },
            }}
            disableRowSelectionOnClick
            disableAutosize
            disableMultipleRowSelection
            pageSizeOptions={pageSizes}
        />
    );
}

export default MarkdownTable;
