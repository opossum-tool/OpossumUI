// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { attributionColumnClasses } from '../AttributionColumn/shared-attribution-column-styles';
import { TextBox } from '../InputElements/TextBox';

interface TextFieldStackProps {
  isEditable: boolean;
  comments: Array<string>;
  showHighlight?: boolean;
}

export function TextFieldStack(props: TextFieldStackProps): ReactElement {
  const handleChange = usePackageInfoChangeHandler();
  const filteredComments = props.comments.filter(
    (comment) => comment.replace(/\s/g, '') !== '',
  );

  if (filteredComments.length === 0) {
    filteredComments.push('');
  }

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      {filteredComments.map((comment, index) => (
        <TextBox
          key={index}
          isEditable={props.isEditable}
          title={`Comment ${
            filteredComments.length === 1 ? '' : index + 1
          }`.trim()}
          text={comment}
          minRows={3}
          maxRows={10}
          multiline={true}
          handleChange={handleChange('comments')}
        />
      ))}
    </MuiBox>
  );
}
