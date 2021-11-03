// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';
import { doNothing } from '../../../util/do-nothing';
import {
  ClosedFolderIcon,
  CommentIcon,
  DirectoryIcon,
  ExcludeFromNoticeIcon,
  FileIcon,
  FirstPartyIcon,
  FollowUpIcon,
  OpenFolderIcon,
} from '../Icons';

describe('The Icons', () => {
  test('renders ClosedFolderIcon', () => {
    render(<ClosedFolderIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('closed folder test_label'));
  });

  test('renders OpenFolderIcon', () => {
    render(<OpenFolderIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('open folder test_label'));
  });

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
