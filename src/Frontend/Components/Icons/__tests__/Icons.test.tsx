// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, render, screen } from '@testing-library/react';

import { Criticality } from '../../../../shared/shared-types';
import {
  BreakpointIcon,
  CommentIcon,
  DirectoryIcon,
  ExcludeFromNoticeIcon,
  FileIcon,
  FirstPartyIcon,
  FollowUpIcon,
  IncompleteAttributionsIcon,
  LocateSignalsIconWithTooltip,
  NeedsReviewIcon,
  PreSelectedIcon,
  SearchPackagesIcon,
  SignalIcon,
} from '../Icons';

describe('The Icons', () => {
  it('renders CommentIcon', () => {
    render(<CommentIcon />);

    expect(screen.getByLabelText('Comment icon')).toBeInTheDocument();
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

  it('renders SignalIcon', () => {
    render(<SignalIcon />);

    expect(screen.getByLabelText('Signal icon')).toBeInTheDocument();
  });

  it('renders BreakpointIcon', () => {
    render(<BreakpointIcon />);

    expect(screen.getByLabelText('Breakpoint icon')).toBeInTheDocument();
  });

  it('renders IncompletePackagesIcon', () => {
    render(<IncompleteAttributionsIcon />);

    expect(screen.getByLabelText('Incomplete icon')).toBeInTheDocument();
  });

  it('renders PreSelectedIcon', () => {
    render(<PreSelectedIcon />);

    expect(screen.getByLabelText('Pre-selected icon')).toBeInTheDocument();
  });

  it('renders SearchPackagesIcon', () => {
    render(<SearchPackagesIcon />);

    expect(screen.getByLabelText('Search packages icon')).toBeInTheDocument();
  });

  it('renders LocateSignalsIconWithTooltip', () => {
    render(<LocateSignalsIconWithTooltip />);

    expect(screen.getByLabelText('locate signals icon')).toBeInTheDocument();
  });
});

describe('The SignalIcon', () => {
  jest.useFakeTimers();
  it('renders high criticality SignalIcon', () => {
    render(<SignalIcon criticality={Criticality.High} />);

    const icon = screen.getByLabelText('Signal icon');
    fireEvent.mouseOver(icon);
    act(() => {
      jest.runAllTimers();
    });
    expect(
      screen.getByText('has high criticality signals'),
    ).toBeInTheDocument();
  });

  it('renders medium criticality SignalIcon', () => {
    render(<SignalIcon criticality={Criticality.Medium} />);

    const icon = screen.getByLabelText('Signal icon');
    fireEvent.mouseOver(icon);
    act(() => {
      jest.runAllTimers();
    });
    expect(
      screen.getByText('has medium criticality signals'),
    ).toBeInTheDocument();
  });

  it('renders no criticality SignalIcon', () => {
    render(<SignalIcon criticality={undefined} />);

    const icon = screen.getByLabelText('Signal icon');
    fireEvent.mouseOver(icon);
    act(() => {
      jest.runAllTimers();
    });
    expect(screen.getByText('has signals')).toBeInTheDocument();
  });
});
