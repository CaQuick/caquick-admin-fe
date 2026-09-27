import { render, screen } from '@testing-library/react';

import { StatusPill } from './status-pill';

describe('StatusPill', () => {
  it.each(['primary', 'positive', 'caution', 'negative', 'neutral'] as const)(
    '%s 톤을 렌더한다',
    (tone) => {
      render(<StatusPill tone={tone}>상태</StatusPill>);
      expect(screen.getByText('상태')).toBeInTheDocument();
    },
  );
});
