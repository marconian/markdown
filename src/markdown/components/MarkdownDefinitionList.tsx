import { Fragment } from 'react';
import getCryptoHash from '@/markdown/utils/getCryptoHash';
import { MarkdownElement } from './MarkdownElement';

export interface DefinitionListItem {
    term: string;
    definitions: string[];
}

function MarkdownDefinitionList({ items }: { items: DefinitionListItem[] }) {
    return (
        <dl className="markdown-definition-list">
            {items.map((item, index) => (
                <Fragment key={`definition-${index}-${getCryptoHash(item.term)}`}>
                    <dt>{item.term}</dt>
                    {item.definitions.map((definition, defIndex) => (
                        <dd key={`definition-${index}-${defIndex}-${getCryptoHash(definition)}`}>
                            <MarkdownElement>{definition}</MarkdownElement>
                        </dd>
                    ))}
                </Fragment>
            ))}
        </dl>
    );
}

export default MarkdownDefinitionList;
