// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

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

export function Comment({ packageInfo, onEdit }: Props) {
  const dispatch = useAppDispatch();

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <TextBox
        readOnly={!onEdit}
        title={'Comment'}
        text={packageInfo.comment}
        minRows={3}
        maxRows={10}
        multiline={true}
        handleChange={(event) =>
          onEdit?.(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                comment: event.target.value,
                wasPreferred: undefined,
              }),
            ),
          )
        }
      />
    </MuiBox>
  );
}
