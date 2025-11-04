import { faDownload } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { MarkdownElement } from './MarkdownElement';

function normalizeUrlLike(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/^(https?:\/\/)/, '');
}

function MarkdownLink({ url, name, label, isImage = false }: { url: string; name?: string; label?: string; isImage?: boolean }) {
    const shouldRenderPlainText =
        !!name &&
        (() => {
            const trimmedName = name.trim();
            const trimmedUrl = url.trim();
            const lowerName = trimmedName.toLowerCase();
            const lowerUrl = trimmedUrl.toLowerCase();

            if (lowerName === lowerUrl) return true;
            if (lowerUrl.startsWith('mailto:') && lowerUrl.replace('mailto:', '') === lowerName) return true;
            if (normalizeUrlLike(lowerUrl) === normalizeUrlLike(lowerName)) return true;

            return false;
        })();

    return !isImage ? (
        <a target={!url.startsWith('#') ? '_blank' : undefined} href={url} title={label} rel="noreferrer">
            {name ? shouldRenderPlainText ? name : <MarkdownElement>{name}</MarkdownElement> : url}
        </a>
    ) : (
        <div className="d-flex flex-column justify-content-center align-items-center position-relative">
            <div className="">
                <img src={url} title={name} alt={label} className="img-fluid" loading="lazy" />
            </div>
            <div className="markdown-img-download position-absolute">
                <a className="btn btn-outline-secondary btn-sm rounded-pill" target="_blank" href={url} title={label} download={name} rel="noreferrer">
                    <FontAwesomeIcon icon={faDownload} />
                    <strong className="ms-2">Download</strong>
                </a>
            </div>
        </div>
    );
}

export default MarkdownLink;
