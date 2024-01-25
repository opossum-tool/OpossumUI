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
import { ReactElement, useMemo, useState } from 'react';

import {
  AutocompleteSignal,
  DisplayPackageInfo,
} from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../state/selectors/all-views-resource-selectors';
import { Confirm } from '../ConfirmationDialog/ConfirmationDialog';
import { TextBox } from '../InputElements/TextBox';
import { getLicenseTextLabelText } from './AttributionColumn.util';
import { PackageAutocomplete } from './PackageAutocomplete';
import { attributionColumnClasses } from './shared-attribution-column-styles';

const classes = {
  ...attributionColumnClasses,
  expansionPanel: {
    backgroundColor: OpossumColors.lightestBlue,
    '&.MuiAccordion-expanded': {
      margin: '0px 0px 6px 0px !important',
    },
  },
  expansionPanelSummary: {
    backgroundColor: `${OpossumColors.lightestBlue} !important`,
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
  displayPackageInfo: DisplayPackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
}

export function LicenseSubPanel({
  displayPackageInfo,
  showHighlight,
  onEdit,
}: LicenseSubPanelProps): ReactElement {
  const dispatch = useAppDispatch();
  const [expanded, setExpanded] = useState(false);
  const frequentLicensesNames = useAppSelector(getFrequentLicensesNameOrder);
  const defaultLicenses = useMemo(
    () =>
      sortBy(
        frequentLicensesNames.map<AutocompleteSignal>(
          ({ fullName, shortName }) => ({
            attributionIds: [],
            default: true,
            licenseName: fullName,
            source: {
              documentConfidence: 100,
              name: text.attributionColumn.commonLicenses,
            },
            suffix: `(${shortName})`,
          }),
        ),
        ({ licenseName }) => licenseName?.toLowerCase(),
      ),
    [frequentLicensesNames],
  );

  return (
    <MuiBox sx={classes.panel}>
      <MuiAccordion
        sx={classes.expansionPanel}
        elevation={0}
        key={'License'}
        disableGutters
        expanded={expanded}
      >
        <MuiAccordionSummary
          sx={classes.expansionPanelSummary}
          expandIcon={
            <MuiBox
              sx={classes.expandMoreIcon}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ExpandMoreIcon aria-label={'license text toggle'} />
            </MuiBox>
          }
        >
          <PackageAutocomplete
            attribute={'licenseName'}
            title={text.attributionColumn.licenseName}
            disabled={!onEdit}
            showHighlight={showHighlight}
            onEdit={onEdit}
            endAdornment={
              displayPackageInfo.licenseText ? (
                <MuiInputAdornment position="end" sx={classes.endAdornment}>
                  {text.attributionColumn.licenseTextModified}
                </MuiInputAdornment>
              ) : undefined
            }
            defaults={defaultLicenses}
          />
        </MuiAccordionSummary>
        <MuiAccordionDetails sx={classes.expansionPanelDetails}>
          <TextBox
            isEditable={!!onEdit}
            sx={classes.licenseText}
            minRows={3}
            maxRows={10}
            multiline={true}
            title={getLicenseTextLabelText(
              displayPackageInfo.licenseName,
              !!onEdit,
              frequentLicensesNames,
            )}
            text={displayPackageInfo.licenseText}
            handleChange={({ target: { value } }) =>
              onEdit?.(() =>
                dispatch(
                  setTemporaryDisplayPackageInfo({
                    ...displayPackageInfo,
                    licenseText: value,
                    wasPreferred: undefined,
                  }),
                ),
              )
            }
          />
        </MuiAccordionDetails>
      </MuiAccordion>
    </MuiBox>
  );
}
