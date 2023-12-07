// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiBox from '@mui/material/Box';
import { ReactElement, useState } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { OpossumColors } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getFrequentLicensesNameOrder } from '../../state/selectors/all-views-resource-selectors';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { TextBox } from '../InputElements/TextBox';
import { getLicenseTextLabelText } from './attribution-column-helpers';
import { LicenseField } from './LicenseField';
import { attributionColumnClasses } from './shared-attribution-column-styles';

const classes = {
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
};

interface LicenseSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: DisplayPackageInfo;
  showHighlight?: boolean;
}

export function LicenseSubPanel(props: LicenseSubPanelProps): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const licenseSubPanelClasses = { ...attributionColumnClasses, ...classes };

  const frequentLicensesNameOrder = useAppSelector(
    getFrequentLicensesNameOrder,
  );

  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiBox sx={licenseSubPanelClasses.panel}>
      <MuiAccordion
        sx={licenseSubPanelClasses.expansionPanel}
        elevation={0}
        key={'License'}
        disableGutters
        expanded={expanded}
      >
        <MuiAccordionSummary
          sx={licenseSubPanelClasses.expansionPanelSummary}
          expandIcon={
            <MuiBox
              sx={licenseSubPanelClasses.expandMoreIcon}
              onClick={() => setExpanded((prev) => !prev)}
            >
              <ExpandMoreIcon aria-label={'license text toggle'} />
            </MuiBox>
          }
        >
          <LicenseField
            isEditable={props.isEditable}
            title={'License Name'}
            text={props.displayPackageInfo.licenseName}
            frequentLicenseNames={frequentLicensesNameOrder}
            handleChange={handleChange('licenseName')}
            endAdornmentText={
              props.displayPackageInfo.licenseText && '(License text modified)'
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
            sx={licenseSubPanelClasses.licenseText}
            minRows={3}
            maxRows={10}
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
    </MuiBox>
  );
}
