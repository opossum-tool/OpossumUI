// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';
import { doNothing } from '../../../util/do-nothing';
import {
  AddIcon,
  ClosedFolderIcon,
  CommentIcon,
  DirectoryIcon,
  EditIcon,
  ExcludeFromNoticeIcon,
  FileIcon,
  FirstPartyIcon,
  FolderIcon,
  FollowUpIcon,
  GoToLinkIcon,
  OpenFileIcon,
  OpenFolderIcon,
} from '../Icons';

describe('The Icons', () => {
  test('renders FolderIcon', () => {
    render(<FolderIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('show resources'));
  });

  test('renders OpenFile', () => {
    render(<OpenFileIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('open file'));
  });

  test('renders AddIcon', () => {
    render(<AddIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('add test_label'));
  });

  test('renders EditIcon', () => {
    render(<EditIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('edit test_label'));
  });

  test('renders ClosedFolderIcon', () => {
    render(<ClosedFolderIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('closed folder test_label'));
  });

  test('renders OpenFolderIcon', () => {
    render(<OpenFolderIcon onClick={doNothing} label={'test_label'} />);

    expect(screen.getByLabelText('open folder test_label'));
  });

  test('renders GoToLinkIcon', () => {
    render(
      <GoToLinkIcon
        onClick={doNothing}
        linkIsLocal={false}
        label={'test_label'}
      />
    );

    expect(screen.getByLabelText('open link'));
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
