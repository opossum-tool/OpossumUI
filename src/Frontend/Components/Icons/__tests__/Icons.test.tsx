// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Criticality } from '../../../../shared/shared-types';
import { OpossumColors } from '../../../shared-styles';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
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
  SplitIcon,
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
    it('renders a grey classification icon for classification 0', async () => {
      await renderComponent(<ClassificationIcon classification={0} />, {
        data: getParsedInputFileEnrichedWithTestData({
          config: { classifications: { 0: 'GOOD' } },
        }),
      });

      expect(screen.getByLabelText('Classification icon')).toBeVisible();
      expect(screen.getByLabelText('Classification icon')).toHaveStyle({
        color: OpossumColors.grey,
      });
    });

    it('renders CriticalClassificationIcon for larger classifications', async () => {
      await renderComponent(<ClassificationIcon classification={1} />, {
        data: getParsedInputFileEnrichedWithTestData({
          config: { classifications: { 1: 'Test' } },
        }),
      });

      expect(
        await screen.findByLabelText('Classification icon'),
      ).toBeInTheDocument();

      await hoverOverIcon('classification-tooltip');

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip).toHaveTextContent('Test');
    });

    it('does not show tooltip if deactivated', async () => {
      await renderComponent(
        <ClassificationIcon classification={1} noTooltip />,
        {
          data: getParsedInputFileEnrichedWithTestData({
            config: { classifications: { 1: 'Test' } },
          }),
        },
      );

      expect(
        await screen.findByLabelText('Classification icon'),
      ).toBeInTheDocument();

      await hoverOverIcon('classification-tooltip');

      const tooltip = screen.queryByRole('tooltip');
      expect(tooltip).not.toBeInTheDocument();
    });
  });

  it('renders BreakpointIcon', () => {
    render(<BreakpointIcon />);

    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });

  it('renders SplitIcon', () => {
    render(<SplitIcon />);

    expect(screen.getByLabelText('Split icon')).toBeInTheDocument();
  });

  it('renders PreSelectedIcon', () => {
    render(<PreSelectedIcon />);

    expect(screen.getByLabelText('Pre-selected icon')).toBeInTheDocument();
  });
});

describe('CriticalityIcon', () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  it.each([Criticality.High, Criticality.Medium, Criticality.None])(
    'renders criticality %s',
    (criticality) => {
      render(<CriticalityIcon criticality={criticality} />);

      expect(screen.getByLabelText('Criticality icon')).toBeInTheDocument();
    },
  );
});
