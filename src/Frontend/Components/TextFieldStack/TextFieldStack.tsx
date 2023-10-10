// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { ChangeEvent, ReactElement } from 'react';
import { TextBox } from '../InputElements/TextBox';
import MuiBox from '@mui/material/Box';

const classes = {
  textBox: {
    width: '100%',
    margin: 'normal',
  },
  textBoxPanel: {
    overflow: 'auto',
  },
};

interface TextFieldStackProps {
  isCollapsed: boolean;
  isEditable: boolean;
  comments: string[];
  handleChange(
    propertyToUpdate: string,
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  showHighlight?: boolean;
  commentBoxHeight: number;
}

export function TextFieldStack(props: TextFieldStackProps): ReactElement {
  const filteredComments = props.comments.filter(
    (comment) => comment.replace(/\s/g, '') != '',
  );
  if (filteredComments.length == 0) {
    filteredComments.push('');
  }

  return props.isCollapsed ? (
    <MuiBox>
      <TextBox
        isEditable={false}
        sx={classes.textBox}
        title={getCollapsedCommentText(filteredComments)}
        text={''}
        minRows={1}
        maxRows={1}
        handleChange={props.handleChange('comments')}
      />
    </MuiBox>
  ) : (
    <MuiBox sx={{ ...classes.textBoxPanel, height: props.commentBoxHeight }}>
      {filteredComments.map((comment, index) => {
        const numLines = Math.max(comment.split('\n').length, 1);
        return (
          <MuiBox key={index} marginTop={1}>
            <TextBox
              isEditable={props.isEditable}
              sx={classes.textBox}
              title={`Comment ${filteredComments.length == 1 ? '' : index + 1}`}
              text={comment}
              minRows={numLines}
              maxRows={numLines}
              multiline={true}
              handleChange={props.handleChange('comments')}
            />
          </MuiBox>
        );
      })}
    </MuiBox>
  );
}

export function getCollapsedCommentText(filteredComments: string[]): string {
  if (filteredComments.length == 1) {
    return filteredComments[0] == '' ? 'No comments' : '1 comment (collapsed)';
  } else {
    return `${filteredComments.length} comments (collapsed)`;
  }
}
