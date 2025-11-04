import { render, waitFor } from '@testing-library/react';
import { mermaidParse, mermaidRender, resetRenderMocks } from '../__tests__/test-utils';
import MermaidChart from './MermaidChart';

describe('MermaidChart', () => {
    beforeEach(() => {
        resetRenderMocks();
    });

    it('renders a mermaid definition when parsing succeeds', async () => {
        const { container } = render(<MermaidChart definition={['graph TD', '  A --> B'].join('\n')} />);

        await waitFor(() => {
            expect(mermaidParse).toHaveBeenCalledWith('graph TD\n  A --> B');
            expect(mermaidRender).toHaveBeenCalled();
        });

        const diagram = container.querySelector('[data-testid="mermaid-diagram"]');
        expect(diagram).not.toBeNull();
    });

    it('skips rendering when the mermaid definition fails to parse', async () => {
        mermaidParse.mockResolvedValueOnce(false);

        const { container } = render(<MermaidChart definition={'flowchart LR\n  X --> Y'} />);

        await waitFor(() => {
            expect(mermaidParse).toHaveBeenCalled();
        });

        expect(mermaidRender).not.toHaveBeenCalled();
        expect(container.querySelector('[data-testid="mermaid-diagram"]')).toBeNull();
    });
});
