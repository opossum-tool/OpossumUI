// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react';

import { Criticality } from '../../../../shared/shared-types';
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

describe('The Icons', () => {
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

  it('does not render ClassificationIcon for classification 0', () => {
    render(<ClassificationIcon classification={0} />);

    expect(
      screen.queryByLabelText('Classification icon'),
    ).not.toBeInTheDocument();
  });

  it('renders ClassificationIcon', () => {
    render(
      <ClassificationIcon
        classification={1}
        classification_mapping={{ 1: 'Test' }}
      />,
    );

    expect(screen.getByLabelText('Classification icon')).toBeInTheDocument();
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
  jest.useFakeTimers();
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
