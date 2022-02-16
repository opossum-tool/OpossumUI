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
  test('renders CommentIcon', () => {
    render(<CommentIcon />);

    expect(screen.getByLabelText('Comment icon'));
  });

  test('renders ExcludeFromNoticeIcon', () => {
    render(<ExcludeFromNoticeIcon />);

    expect(screen.getByLabelText('Exclude from notice icon'));
  });

  test('renders FollowUpIcon', () => {
    render(<FollowUpIcon />);

    expect(screen.getByLabelText('Follow-up icon'));
  });

  test('renders FirstPartyIcon', () => {
    render(<FirstPartyIcon />);

    expect(screen.getByLabelText('First party icon'));
  });

  test('renders DirectoryIcon', () => {
    render(<DirectoryIcon />);

    expect(screen.getByLabelText('Directory icon'));
  });

  test('renders FileIcon', () => {
    render(<FileIcon />);

    expect(screen.getByLabelText('File icon'));
  });
});
