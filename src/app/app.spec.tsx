import { render, screen } from '@testing-library/react';

import { App } from './app';

describe('App', () => {
  it('루트 경로에 초기 화면을 렌더한다', async () => {
    window.history.pushState({}, '', '/');
    render(<App />);
    expect(await screen.findByText('케이퀵 어드민')).toBeInTheDocument();
  });
});
