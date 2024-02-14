// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { PackageInfo } from '../../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../../state/hooks';
import { isImportantAttributionInformationMissing } from '../../../util/is-important-attribution-information-missing';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import { AttributeConfig } from '../AttributionForm';
import { attributionColumnClasses } from '../AttributionForm.style';

interface CopyrightSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  expanded?: boolean;
  hidden?: boolean;
  config?: AttributeConfig;
}

export function CopyrightSubPanel({
  packageInfo,
  onEdit,
  showHighlight,
  expanded,
  hidden,
  config,
}: CopyrightSubPanelProps) {
  const dispatch = useAppDispatch();

  return hidden ? null : (
    <MuiBox sx={attributionColumnClasses.panel}>
      <TextBox
        readOnly={!onEdit}
        sx={attributionColumnClasses.textBox}
        title={'Copyright'}
        text={packageInfo.copyright}
        minRows={3}
        maxRows={7}
        color={config?.color}
        focused={config?.focused}
        multiline
        expanded={expanded}
        handleChange={({ target: { value } }) =>
          onEdit?.(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...packageInfo,
                copyright: value,
                wasPreferred: undefined,
              }),
            ),
          )
        }
        error={
          showHighlight &&
          isImportantAttributionInformationMissing('copyright', packageInfo)
        }
        endIcon={config?.endIcon}
      />
    </MuiBox>
  );
}
