// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';

interface Props {
  displayPackageInfo: DisplayPackageInfo;
  onEdit?: Confirm;
}

export function CommentStack({
  displayPackageInfo,
  onEdit,
}: Props): ReactElement {
  const dispatch = useAppDispatch();
  const filteredComments = (displayPackageInfo.comments || [])?.filter(
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
          isEditable={!!onEdit}
          title={`Comment ${
            filteredComments.length === 1 ? '' : index + 1
          }`.trim()}
          text={comment}
          minRows={3}
          maxRows={10}
          multiline={true}
          handleChange={({ target: { value } }) =>
            onEdit?.(() =>
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...displayPackageInfo,
                  comments: [value],
                  wasPreferred: undefined,
                }),
              ),
            )
          }
        />
      ))}
    </MuiBox>
  );
}
