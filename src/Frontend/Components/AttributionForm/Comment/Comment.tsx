// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { PackageInfo } from '../../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../../state/hooks';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import { AttributeConfig } from '../AttributionForm';
import { attributionColumnClasses } from '../AttributionForm.style';

interface Props {
  packageInfo: PackageInfo;
  onEdit?: Confirm;
  expanded?: boolean;
  config?: AttributeConfig;
}

export function Comment({ packageInfo, onEdit, config, expanded }: Props) {
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
        color={config?.color}
        focused={config?.focused}
        expanded={expanded}
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
        endIcon={config?.endIcon}
      />
    </MuiBox>
  );
}
