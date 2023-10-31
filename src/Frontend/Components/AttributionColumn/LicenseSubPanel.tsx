// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../state/selectors/all-views-resource-selectors';
import { doNothing } from '../../util/do-nothing';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { TextBox } from '../InputElements/TextBox';
import { getLicenseTextLabelText } from './attribution-column-helpers';
import { LicenseField } from './LicenseField';
import { attributionColumnClasses } from './shared-attribution-column-styles';

const classes = {
  expansionPanel: {
    backgroundColor: OpossumColors.lighterBlue,
  },
  expansionPanelExpanded: {
    '&.MuiAccordion-expanded': {
      margin: '0px 0px 6px 0px !important',
    },
  },
  expansionPanelSummary: {
    minHeight: '12px !important',
    padding: '0px',
    paddingRight: '12px',
    '& div.MuiAccordionSummary-content': {
      margin: '0px',
    },
    '& div.MuiAccordionSummary-expandIcon': {
      padding: '0px',
    },
  },
  expansionPanelDetails: {
    height: '100%',
    padding: '0px',
  },
  expandMoreIcon: {
    height: '37px',
  },
  licenseTextBox: {
    flex: 1,
  },
  licenseText: {
    marginTop: '11px',
  },
};

interface LicenseSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: DisplayPackageInfo;
  isLicenseTextShown: boolean;
  licenseTextRows: number;
  showHighlight?: boolean;
  setIsLicenseTextShown(isLicenseTextShown: boolean): void;
}

export function LicenseSubPanel(props: LicenseSubPanelProps): ReactElement {
  const licenseSubPanelClasses = { ...attributionColumnClasses, ...classes };

  const frequentLicensesNameOrder = useAppSelector(
    getFrequentLicensesNameOrder,
  );

  function toggleIsLicenseTextShown(): void {
    props.setIsLicenseTextShown(!props.isLicenseTextShown);
  }

  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiPaper sx={licenseSubPanelClasses.panel} elevation={0} square={true}>
      <MuiAccordion
        sx={{
          ...licenseSubPanelClasses.expansionPanelExpanded,
          ...licenseSubPanelClasses.textBox,
          ...licenseSubPanelClasses.expansionPanel,
        }}
        elevation={0}
        key={'License'}
        expanded={props.isLicenseTextShown}
        onChange={doNothing}
      >
        <MuiAccordionSummary
          sx={licenseSubPanelClasses.expansionPanelSummary}
          expandIcon={
            // This div is needed to fix the Firefox warning.
            <MuiBox sx={licenseSubPanelClasses.expandMoreIcon}>
              <ExpandMoreIcon
                sx={licenseSubPanelClasses.expandMoreIcon}
                onClick={toggleIsLicenseTextShown}
              />
            </MuiBox>
          }
        >
          <LicenseField
            isEditable={props.isEditable}
            sx={licenseSubPanelClasses.licenseTextBox}
            title={'License Name'}
            text={props.displayPackageInfo.licenseName}
            frequentLicenseNames={frequentLicensesNameOrder}
            handleChange={handleChange('licenseName')}
            endAdornmentText={
              props.displayPackageInfo.licenseText
                ? '(Licence text modified)'
                : ''
            }
            isHighlighted={
              props.showHighlight &&
              isImportantAttributionInformationMissing(
                'licenseName',
                props.displayPackageInfo,
              )
            }
          />
        </MuiAccordionSummary>
        <MuiAccordionDetails sx={licenseSubPanelClasses.expansionPanelDetails}>
          <TextBox
            isEditable={props.isEditable}
            sx={{
              ...licenseSubPanelClasses.licenseTextBox,
              ...licenseSubPanelClasses.licenseText,
            }}
            minRows={props.licenseTextRows}
            maxRows={props.licenseTextRows}
            multiline={true}
            title={getLicenseTextLabelText(
              props.displayPackageInfo.licenseName,
              props.isEditable,
              frequentLicensesNameOrder,
            )}
            text={props.displayPackageInfo.licenseText}
            handleChange={handleChange('licenseText')}
          />
        </MuiAccordionDetails>
      </MuiAccordion>
    </MuiPaper>
  );
}
