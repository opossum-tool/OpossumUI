// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../InputElements/TextBox';
import { PanelVariantProp } from './AttributionForm';
import { attributionColumnClasses } from './shared-attribution-column-styles';

interface CopyrightSubPanelProps {
  displayPackageInfo: DisplayPackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  variant?: PanelVariantProp;
}

export function CopyrightSubPanel({
  displayPackageInfo,
  onEdit,
  showHighlight,
  variant,
}: CopyrightSubPanelProps) {
  const dispatch = useAppDispatch();

  return variant === 'hidden' ? null : (
    <MuiBox
      sx={{
        ...attributionColumnClasses.panel,
        ...(variant === 'expanded-invisible' ? { visibility: 'hidden' } : {}),
      }}
    >
      <TextBox
        isEditable={!!onEdit}
        sx={attributionColumnClasses.textBox}
        title={'Copyright'}
        text={displayPackageInfo.copyright}
        {...(variant === 'expanded' || variant === 'expanded-invisible'
          ? { rows: 7 }
          : { minRows: 3, maxRows: 10 })}
        multiline={true}
        handleChange={({ target: { value } }) =>
          onEdit?.(() =>
            dispatch(
              setTemporaryDisplayPackageInfo({
                ...displayPackageInfo,
                copyright: value,
                wasPreferred: undefined,
              }),
            ),
          )
        }
        isHighlighted={
          showHighlight &&
          isImportantAttributionInformationMissing(
            'copyright',
            displayPackageInfo,
          )
        }
      />
    </MuiBox>
  );
}
