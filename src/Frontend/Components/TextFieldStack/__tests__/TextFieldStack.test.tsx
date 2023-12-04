// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
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

    renderComponentWithStore(
      <TextFieldStack isEditable={isEditable} comments={comments} />,
    );
    comments.forEach((comment, index) => {
      expect(screen.getByLabelText(`Comment ${index + 1}`));
      expect(screen.getByDisplayValue(comment));
    });
  });
});
