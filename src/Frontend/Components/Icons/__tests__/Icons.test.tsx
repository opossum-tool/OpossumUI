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

    expect(screen.getByLabelText('Comment icon'));
  });

  it('renders ExcludeFromNoticeIcon', () => {
    render(<ExcludeFromNoticeIcon />);

    expect(screen.getByLabelText('Exclude from notice icon'));
  });

  it('renders FollowUpIcon', () => {
    render(<FollowUpIcon />);

    expect(screen.getByLabelText('Follow-up icon'));
  });

  it('renders NeedsReviewIcon', () => {
    render(<NeedsReviewIcon />);

    expect(screen.getByLabelText('Needs-review icon'));
  });

  it('renders FirstPartyIcon', () => {
    render(<FirstPartyIcon />);

    expect(screen.getByLabelText('First party icon'));
  });

  it('renders DirectoryIcon', () => {
    render(<DirectoryIcon />);

    expect(screen.getByLabelText('Directory icon'));
  });

  it('renders FileIcon', () => {
    render(<FileIcon />);

    expect(screen.getByLabelText('File icon'));
  });

  it('renders SignalIcon', () => {
    render(<SignalIcon />);

    expect(screen.getByLabelText('Signal icon'));
  });

  it('renders BreakpointIcon', () => {
    render(<BreakpointIcon />);

    expect(screen.getByLabelText('Breakpoint icon'));
  });

  it('renders IncompletePackagesIcon', () => {
    render(<IncompleteAttributionsIcon />);

    expect(screen.getByLabelText('Incomplete icon'));
  });

  it('renders PreSelectedIcon', () => {
    render(<PreSelectedIcon />);

    expect(screen.getByLabelText('Pre-selected icon'));
  });

  it('renders SearchPackagesIcon', () => {
    render(<SearchPackagesIcon />);

    expect(screen.getByLabelText('Search packages icon'));
  });

  it('renders LocateSignalsIconWithTooltip', () => {
    render(<LocateSignalsIconWithTooltip />);

    expect(screen.getByLabelText('locate signals icon'));
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
    screen.getByText('has high criticality signals');
  });

  it('renders medium criticality SignalIcon', () => {
    render(<SignalIcon criticality={Criticality.Medium} />);

    const icon = screen.getByLabelText('Signal icon');
    fireEvent.mouseOver(icon);
    act(() => {
      jest.runAllTimers();
    });
    screen.getByText('has medium criticality signals');
  });

  it('renders no criticality SignalIcon', () => {
    render(<SignalIcon criticality={undefined} />);

    const icon = screen.getByLabelText('Signal icon');
    fireEvent.mouseOver(icon);
    act(() => {
      jest.runAllTimers();
    });
    screen.getByText('has signals');
  });
});
