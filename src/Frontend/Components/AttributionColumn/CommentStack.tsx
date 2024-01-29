// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { PackageInfo } from '../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';

interface Props {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
}

export function CommentStack({ packageInfo, onEdit }: Props): ReactElement {
  const dispatch = useAppDispatch();
  const comments = packageInfo.comments?.length ? packageInfo.comments : [''];

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      {comments.map((comment, index) => (
        <TextBox
          key={index}
          title={`Comment ${comments.length === 1 ? '' : index + 1}`.trim()}
          readOnly={!onEdit}
          text={comment}
          minRows={3}
          maxRows={10}
          multiline={true}
          handleChange={({ target: { value } }) =>
            onEdit?.(() =>
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
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
