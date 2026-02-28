import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { highlightElement } from '../highlight';

function CodeBlock({ code, language }: { code: string; language?: string }) {
    return (
        <div className="code-block bg-white-subtle mb-3">
            <div className="code-block-header d-flex justify-content-between rounded-top">
                {language ? (
                    <div className="code-block-title mx-5 my-auto">
                        <CodeIcon fontSize="small" />
                        <strong className="ms-2">{language}</strong>
                    </div>
                ) : (
                    <div />
                )}
                <button
                    type="button"
                    className="btn btn-sm btn-dark"
                    onClick={() => {
                        navigator.clipboard.writeText(code);
                    }}>
                    <ContentCopyIcon fontSize="small" />
                    <span className="ms-2">copy</span>
                </button>
            </div>
            <div className="code-block-body bg-body-secondary p-2 rounded-bottom">
                <pre
                    className={`language-${language ?? 'text'}`}
                    ref={(e) => {
                        if (!e || e.hasAttribute('data-highlighted')) return;
                        highlightElement(e);
                    }}>
                    {code}
                </pre>
            </div>
        </div>
    );
}

export default CodeBlock;
