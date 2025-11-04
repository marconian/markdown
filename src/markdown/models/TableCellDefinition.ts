interface TableCellDefinition {
    id: string;
    header: boolean;
    align: 'center' | 'left' | 'right' | null;
    content: string;
    containsHtml: boolean;
}

export default TableCellDefinition;
