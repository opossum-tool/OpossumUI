// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  CommentIcon,
  DirectoryIcon,
  ExcludeFromNoticeIcon,
  FileIcon,
  FirstPartyIcon,
  FollowUpIcon,
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
});
