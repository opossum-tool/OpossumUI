// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Criticality } from '../../../../shared/shared-types';
import { faker } from '../../../../testing/Faker';
import {
  BreakpointIcon,
  ClassificationIcon,
  CriticalityIcon,
  DirectoryIcon,
  ExcludeFromNoticeIcon,
  FileIcon,
  FirstPartyIcon,
  FollowUpIcon,
  NeedsReviewIcon,
  PreSelectedIcon,
} from '../Icons';

async function hoverOverIcon(testid: string) {
  await userEvent.hover(screen.getByTestId(testid), {
    advanceTimers: vi.runOnlyPendingTimersAsync,
  });
}

describe('The Icons', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });
  it('renders ExcludeFromNoticeIcon', () => {
    render(<ExcludeFromNoticeIcon />);

    expect(
      screen.getByLabelText('Exclude from notice icon'),
    ).toBeInTheDocument();
  });

  it('renders FollowUpIcon', () => {
    render(<FollowUpIcon />);

    expect(screen.getByLabelText('Follow-up icon')).toBeInTheDocument();
  });

  it('renders NeedsReviewIcon', () => {
    render(<NeedsReviewIcon />);

    expect(screen.getByLabelText('Needs-review icon')).toBeInTheDocument();
  });

  it('renders FirstPartyIcon', () => {
    render(<FirstPartyIcon />);

    expect(screen.getByLabelText('First party icon')).toBeInTheDocument();
  });

  it('renders DirectoryIcon', () => {
    render(<DirectoryIcon />);

    expect(screen.getByLabelText('Directory icon')).toBeInTheDocument();
  });

  it('renders FileIcon', () => {
    render(<FileIcon />);

    expect(screen.getByLabelText('File icon')).toBeInTheDocument();
  });

  it('renders CriticalityIcon', () => {
    render(<CriticalityIcon criticality={Criticality.High} />);

    expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
  });
  describe('classification icon', () => {
    it('does not render CriticalClassificationIcon for classification 0', () => {
      render(<ClassificationIcon classification={0} />);

      expect(
        screen.queryByLabelText('Classification icon'),
      ).not.toBeInTheDocument();
    });

    it('renders CriticalClassificationIcon for larger classifications', async () => {
      render(
        <ClassificationIcon
          classification={1}
          classificationsConfig={{
            1: faker.opossum.classificationEntry({ description: 'Test' }),
          }}
        />,
      );

      expect(screen.getByLabelText('Classification icon')).toBeInTheDocument();

      await hoverOverIcon('classification-tooltip');

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Test');
    });

    it('does not show tooltip if deactivated', async () => {
      render(<ClassificationIcon classification={1} noTooltip />);

      expect(screen.getByLabelText('Classification icon')).toBeInTheDocument();

      await hoverOverIcon('classification-tooltip');

      const tooltip = screen.queryByRole('tooltip');
      expect(tooltip).not.toBeInTheDocument();
    });
  });

  it('renders BreakpointIcon', () => {
    render(<BreakpointIcon />);

    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });

  it('renders PreSelectedIcon', () => {
    render(<PreSelectedIcon />);

    expect(screen.getByLabelText('Pre-selected icon')).toBeInTheDocument();
  });
});

describe('The SignalIcon', () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  it('renders high criticality SignalIcon', () => {
    render(<CriticalityIcon criticality={Criticality.High} />);

    expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
  });

  it('renders medium criticality SignalIcon', () => {
    render(<CriticalityIcon criticality={Criticality.Medium} />);

    expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
  });

  it('renders no criticality SignalIcon', () => {
    render(<CriticalityIcon criticality={Criticality.None} />);

    expect(screen.queryByLabelText('Criticality icon')).not.toBeInTheDocument();
  });
});
