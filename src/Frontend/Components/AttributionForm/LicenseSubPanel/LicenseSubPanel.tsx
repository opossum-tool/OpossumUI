// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiBox from '@mui/material/Box';
import MuiInputAdornment from '@mui/material/InputAdornment';
import { sortBy } from 'lodash';
import { useMemo, useState } from 'react';

import { PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../../state/selectors/resource-selectors';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../../TextBox/TextBox';
import { AttributionFormConfig } from '../AttributionForm';
import { attributionColumnClasses } from '../AttributionForm.style';
import { PackageAutocomplete } from '../PackageAutocomplete/PackageAutocomplete';

const classes = {
  ...attributionColumnClasses,
  expansionPanel: {
    backgroundColor: 'transparent',
    '&.MuiAccordion-expanded': {
      margin: '0px 0px 6px 0px !important',
    },
  },
  expansionPanelSummary: {
    minHeight: '36px',
    padding: '0px',
    '& div.MuiAccordionSummary-content': {
      margin: '0px',
    },
    '& div.MuiAccordionSummary-expandIcon': {
      padding: '0px',
    },
  },
  expansionPanelDetails: {
    padding: '0px',
    width: 'calc(100% - 36px)',
  },
  expansionPanelDetailsDiffView: {
    padding: '0px',
  },
  expandMoreIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '36px',
    width: '36px',
  },
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
  expanded: expandedOverride,
  hidden,
  config,
}: LicenseSubPanelProps) {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(expandedOverride);
  const frequentLicensesNames = useAppSelector(getFrequentLicensesNameOrder);
  const defaultLicenses = useMemo(
    () =>
      sortBy(
        frequentLicensesNames.map<PackageInfo>(({ fullName, shortName }) => ({
          id: shortName,
          licenseName: fullName,
          source: {
            name: text.attributionColumn.commonLicenses,
          },
          suffix: `(${shortName})`,
        })),
        ({ licenseName }) => licenseName?.toLowerCase(),
      ),
    [frequentLicensesNames],
  );
  const label = useMemo(
    () =>
      packageInfo.licenseName &&
      frequentLicensesNames
        .map((licenseNames) => [
          licenseNames.shortName.toLowerCase(),
          licenseNames.fullName.toLowerCase(),
        ])
        .flat()
        .includes(packageInfo.licenseName.toLowerCase())
        ? `Standard license text implied. ${
            !!onEdit ? 'Insert notice text if necessary.' : ''
          }`
        : 'License Text (to appear in attribution document)',
    [frequentLicensesNames, onEdit, packageInfo.licenseName],
  );

  return hidden ? null : (
    <MuiBox sx={classes.panel}>
      <MuiAccordion
        sx={classes.expansionPanel}
        elevation={0}
        key={'License'}
        disableGutters
        expanded={expanded}
        square
      >
        <MuiAccordionSummary
          sx={classes.expansionPanelSummary}
          expandIcon={
            expandedOverride ? null : (
              <MuiBox
                sx={classes.expandMoreIcon}
                onClick={() => setExpanded((prev) => !prev)}
              >
                <ExpandMoreIcon aria-label={'license text toggle'} />
              </MuiBox>
            )
          }
        >
          <PackageAutocomplete
            attribute={'licenseName'}
            title={text.attributionColumn.licenseName}
            packageInfo={packageInfo}
            readOnly={!onEdit}
            showHighlight={showHighlight}
            onEdit={onEdit}
            endAdornment={
              config?.licenseName?.endIcon ||
              (packageInfo.licenseText ? (
                <MuiInputAdornment position="end" sx={classes.endAdornment}>
                  {text.attributionColumn.licenseTextModified}
                </MuiInputAdornment>
              ) : undefined)
            }
            defaults={defaultLicenses}
            color={config?.licenseName?.color}
            focused={config?.licenseName?.focused}
          />
        </MuiAccordionSummary>
        <MuiAccordionDetails
          sx={
            expandedOverride
              ? classes.expansionPanelDetailsDiffView
              : classes.expansionPanelDetails
          }
        >
          <TextBox
            readOnly={!onEdit}
            sx={classes.licenseText}
            maxRows={7}
            minRows={3}
            color={config?.licenseText?.color}
            focused={config?.licenseText?.focused}
            multiline
            expanded={expandedOverride}
            title={label}
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
        </MuiAccordionDetails>
      </MuiAccordion>
    </MuiBox>
  );
}
