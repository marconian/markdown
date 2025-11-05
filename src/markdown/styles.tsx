import { Global, css } from '@emotion/react';
import githubLightTheme from 'highlight.js/styles/github.css?inline';
import githubDarkTheme from 'highlight.js/styles/github-dark.css?inline';
import katexTheme from 'katex/dist/katex.min.css?inline';


const baseStyles = css`
    ${githubLightTheme}

    ${katexTheme}

    .markdown-paper {
        .markdown-img-download {
            position: absolute;
            bottom: 0;
            right: 0;
        }

        .MuiToolbar-root {
            background-color: var(--bs-light);
        }

        .MuiDataGrid-cell:focus-within {
            outline: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
        }

        .MuiDataGrid-cell {
            column-gap: 0.35rem;
        }

        .markdown-table-header,
        .markdown-table-cell {
            display: inline-flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.25rem;
            white-space: normal;
        }

        .hljs {
            background: unset !important;
        }

        .code-block {
            border: var(--light) 1px solid;

            .code-block-header {
                color: var(--bs-light);
                background-color: var(--bs-dark);
                border: var(--light) 1px solid;
            }
        }

        .emoji {
            font-family: 'Noto Color Emoji', sans-serif;
        }

        .markdown-admonition {
            border-left: 4px solid var(--bs-primary);
            background-color: var(--bs-light);
            border-radius: var(--bs-border-radius);
            padding: 1rem;
            margin-bottom: 1rem;

            &.note {
                border-left-color: var(--bs-info);
            }

            &.tip,
            &.info {
                border-left-color: var(--bs-success);
            }

            &.important {
                border-left-color: var(--bs-primary);
            }

            &.warning,
            &.caution,
            &.danger {
                border-left-color: var(--bs-warning);
            }

            strong {
                display: block;
                font-size: 0.95rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                margin-bottom: 0.5rem;
            }
        }

        .markdown-spoiler {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;

            &[data-hidden='true'] .markdown-spoiler__content {
                filter: blur(0.4rem);
                transition: filter 0.2s ease;
            }

            &[data-hidden='false'] .markdown-spoiler__content {
                filter: none;
            }
        }

        .markdown-inline-math {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            margin: 0 0.1rem;

            .katex {
                font-size: 0.95em;
            }
        }

        .markdown-math-block {
            margin: 1rem 0;
            overflow: visible;

            .katex-display {
                display: inline-block;
                width: auto;
            }

            .katex-display > .katex-html {
                display: block;
            }

            .katex-display,
            .katex-display > .katex {
                margin: 0;
            }
        }
    }

    .markdown-tooltip {
        a {
            color: var(--bs-light);
        }
    }
`;

const darkModeStyles = css`
    :where([data-bs-theme='dark']) {
        ${githubDarkTheme}

        .markdown-paper {
            .MuiToolbar-root {
                background-color: var(--bs-dark);
            }

            .code-block {
                border: var(--bs-primary-bg-subtle) 1px solid;

                .code-block-header {
                    background-color: var(--bs-primary-bg-subtle);
                    border: var(--dark) 1px solid;
                }
            }

            .markdown-admonition {
                background-color: var(--bs-dark-bg-subtle);

                strong {
                    color: var(--bs-light);
                }
            }

            .markdown-spoiler button {
                color: var(--bs-light);
            }

            .markdown-inline-math .katex {
                color: var(--bs-light);
            }
        }

        .markdown-footnote-link {
            a {
                color: var(--bs-dark);
            }
        }
    }

    @media (prefers-color-scheme: dark) {
        :root:not([data-bs-theme]) {
            ${githubDarkTheme}

            .markdown-paper {
                .MuiToolbar-root {
                    background-color: var(--bs-dark);
                }

                .code-block {
                    border: var(--bs-primary-bg-subtle) 1px solid;

                    .code-block-header {
                        background-color: var(--bs-primary-bg-subtle);
                        border: var(--dark) 1px solid;
                    }
                }

                .markdown-admonition {
                    background-color: var(--bs-dark-bg-subtle);

                    strong {
                        color: var(--bs-light);
                    }
                }

                .markdown-spoiler button {
                    color: var(--bs-light);
                }

                .markdown-inline-math .katex {
                    color: var(--bs-light);
                }
            }

            .markdown-footnote-link {
                a {
                    color: var(--bs-dark);
                }
            }
        }
    }
`;

export function MarkdownGlobalStyles() {
    return <Global styles={[baseStyles, darkModeStyles]} />;
}

export default MarkdownGlobalStyles;
