// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import NotesIcon from '@mui/icons-material/Notes';
import { Badge, ToggleButton } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { useState } from 'react';

import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
} from '../../../state/selectors/resource-selectors';
import { validateSpdxExpression } from '../../../util/validateSpdx';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import { AttributionFormConfig } from '../AttributionForm';
import { LicenseSubPanelAutocomplete } from './LicenseSubPanelAutocomplete';
import { SpdxValidationErrorDisplay } from './SpdxValidationErrorDisplay';

const classes = {
  licenseText: {
    marginTop: '12px',
  },
  endAdornment: {
    paddingRight: '6px',
    paddingTop: '2px',
  },
};

interface LicenseSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  expanded?: boolean;
  hidden?: boolean;
  config?: AttributionFormConfig;
}

export function LicenseSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
  expanded,
  hidden,
  config,
}: LicenseSubPanelProps) {
  const [showLicenseText, setShowLicenseText] = useState(false);
  const dispatch = useAppDispatch();
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const frequentLicensesNames = useAppSelector(getFrequentLicensesNameOrder);
  const defaultLicenseText = packageInfo.licenseText
    ? undefined
    : frequentLicenseTexts[packageInfo.licenseName || ''];

  const validationResult = validateSpdxExpression(
    packageInfo.licenseName ?? '',
    new Set(frequentLicensesNames.map((n) => n.shortName)),
  );

  const handleApplyFix = (newExpression: string) => {
    dispatch(
      setTemporaryDisplayPackageInfo({
        ...packageInfo,
        licenseName: newExpression,
        wasPreferred: undefined,
      }),
    );
  };

  return hidden ? null : (
    <MuiBox>
      <MuiBox display={'flex'} alignItems={'center'} gap={'8px'}>
        <LicenseSubPanelAutocomplete
          packageInfo={packageInfo}
          showHighlight={showHighlight}
          onEdit={onEdit}
          config={config}
          forceTop={true}
        />
        {!expanded && (
          <ToggleButton
            value={'license-text'}
            selected={showLicenseText}
            onChange={() => setShowLicenseText((prev) => !prev)}
            size={'small'}
            aria-label="license-text-toggle-button"
          >
            <Badge
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              color={'info'}
              variant={'dot'}
              invisible={!packageInfo.licenseText}
            >
              <NotesIcon />
            </Badge>
          </ToggleButton>
        )}
      </MuiBox>
      {!!onEdit && (
        <SpdxValidationErrorDisplay
          validationResult={validationResult}
          onApplyFix={handleApplyFix}
        />
      )}
      {(showLicenseText || expanded) && (
        <TextBox
          readOnly={!onEdit}
          placeholder={defaultLicenseText}
          sx={classes.licenseText}
          maxRows={8}
          minRows={3}
          color={config?.licenseText?.color}
          focused={config?.licenseText?.focused}
          multiline
          expanded={expanded}
          title={
            defaultLicenseText
              ? text.attributionColumn.licenseTextDefault
              : text.attributionColumn.licenseText
          }
          text={packageInfo.licenseText}
          handleChange={({ target: { value } }) =>
            onEdit?.(() =>
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  licenseText: value,
                  wasPreferred: undefined,
                }),
              ),
            )
          }
          endIcon={config?.licenseText?.endIcon}
        />
      )}
    </MuiBox>
  );
}
