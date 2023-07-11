// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { render, screen } from '@testing-library/react';
import React from 'react';
import { doNothing } from '../../../util/do-nothing';
import { TextFieldStack } from '../TextFieldStack';

describe('The TextFieldStack', () => {
  it('renders comment TextBoxes with right titles and content', () => {
    const isEditable = false;
    const comments = [
      'This is the first comment',
      'This is the second comment',
      'This is the third comment',
      'This is the forth comment',
    ];
    const isCollapsed = false;
    const commentBoxHeight = 300;

    render(
      <TextFieldStack
        isEditable={isEditable}
        comments={comments}
        isCollapsed={isCollapsed}
        commentBoxHeight={commentBoxHeight}
        handleChange={(): (() => void) => doNothing}
      />,
    );
    comments.forEach((comment, index) => {
      expect(screen.getByLabelText(`Comment ${index + 1}`));
      expect(screen.getByDisplayValue(comment));
    });
  });

  it('renders number of comments if collapsed', () => {
    const isEditable = false;
    const comments = [
      'This is the first comment',
      'This is the second comment',
      'This is the third comment',
      'This is the forth comment',
    ];
    const isCollapsed = true;
    const commentBoxHeight = 300;

    render(
      <TextFieldStack
        isEditable={isEditable}
        comments={comments}
        isCollapsed={isCollapsed}
        commentBoxHeight={commentBoxHeight}
        handleChange={(): (() => void) => doNothing}
      />,
    );
    expect(screen.getByLabelText('4 comments (collapsed)'));
  });

  it('renders correct message in case of one comment', () => {
    const isEditable = false;
    const comments = ['This is the first comment'];
    const isCollapsed = true;
    const commentBoxHeight = 300;

    render(
      <TextFieldStack
        isEditable={isEditable}
        comments={comments}
        isCollapsed={isCollapsed}
        commentBoxHeight={commentBoxHeight}
        handleChange={(): (() => void) => doNothing}
      />,
    );
    expect(screen.getByLabelText('1 comment (collapsed)'));
  });

  it('renders correct message in case of no comment', () => {
    const isEditable = false;
    const comments: string[] = [];
    const isCollapsed = true;
    const commentBoxHeight = 300;

    render(
      <TextFieldStack
        isEditable={isEditable}
        comments={comments}
        isCollapsed={isCollapsed}
        commentBoxHeight={commentBoxHeight}
        handleChange={(): (() => void) => doNothing}
      />,
    );
    expect(screen.getByLabelText('No comments'));
  });
});
