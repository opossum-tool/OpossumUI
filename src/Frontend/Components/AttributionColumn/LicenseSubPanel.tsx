// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { PackageInfo } from '../../../shared/shared-types';
import { getFrequentLicensesNameOrder } from '../../state/selectors/all-views-resource-selectors';
import { doNothing } from '../../util/do-nothing';
import { TextBox } from '../InputElements/TextBox';
import { OpossumColors } from '../../shared-styles';
import { AutoComplete } from '../InputElements/AutoComplete';
import { getLicenseTextLabelText } from './attribution-column-helpers';
import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import { useAttributionColumnStyles } from './shared-attribution-column-styles';
import { useAppSelector } from '../../state/hooks';

const useStyles = makeStyles({
  expansionPanel: {
    backgroundColor: OpossumColors.lighterBlue,
  },
  expansionPanelExpanded: {
    margin: '0px 0px 6px 0px !important',
  },
  expansionPanelSummary: {
    minHeight: '12px !important',
    padding: 0,
    paddingRight: 12,
    '& div.MuiAccordionSummary-content': {
      margin: 0,
    },
    '& div.MuiAccordionSummary-expandIcon': {
      padding: 0,
    },
  },
  expansionPanelDetails: { height: '100%', padding: 0 },
  expandMoreIcon: {
    height: 37,
  },
  licenseTextBox: {
    flex: 1,
  },
  licenseText: {
    marginTop: 11,
  },
});

interface LicenseSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: PackageInfo;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isLicenseTextShown: boolean;
  licenseTextRows: number;
  setIsLicenseTextShown(isLicenseTextShown: boolean): void;
}

export function LicenseSubPanel(props: LicenseSubPanelProps): ReactElement {
  const classes = { ...useAttributionColumnStyles(), ...useStyles() };

  const frequentLicensesNameOrder = useAppSelector(
    getFrequentLicensesNameOrder
  );

  function toggleIsLicenseTextShown(): void {
    props.setIsLicenseTextShown(!props.isLicenseTextShown);
  }

  return (
    <MuiPaper className={clsx(classes.panel)} elevation={0} square={true}>
      <MuiAccordion
        className={clsx(classes.textBox, classes.expansionPanel)}
        classes={{ expanded: classes.expansionPanelExpanded }}
        elevation={0}
        key={'License'}
        expanded={props.isLicenseTextShown}
        onChange={doNothing}
      >
        <MuiAccordionSummary
          classes={{ root: classes.expansionPanelSummary }}
          expandIcon={
            // This div is needed to fix the Firefox warning.
            <div className={classes.expandMoreIcon}>
              <ExpandMoreIcon
                className={classes.expandMoreIcon}
                onClick={toggleIsLicenseTextShown}
              />
            </div>
          }
        >
          <AutoComplete
            isEditable={props.isEditable}
            className={clsx(classes.licenseTextBox)}
            title={'License Name'}
            text={props.displayPackageInfo.licenseName}
            options={frequentLicensesNameOrder}
            handleChange={props.setUpdateTemporaryPackageInfoFor('licenseName')}
            endAdornmentText={
              props.displayPackageInfo.licenseText
                ? '(Licence text modified)'
                : ''
            }
          />
        </MuiAccordionSummary>
        <MuiAccordionDetails classes={{ root: classes.expansionPanelDetails }}>
          <TextBox
            isEditable={props.isEditable}
            className={clsx(classes.licenseTextBox, classes.licenseText)}
            minRows={props.licenseTextRows}
            maxRows={props.licenseTextRows}
            multiline={true}
            title={getLicenseTextLabelText(
              props.displayPackageInfo.licenseName,
              props.isEditable,
              frequentLicensesNameOrder
            )}
            text={props.displayPackageInfo.licenseText}
            handleChange={props.setUpdateTemporaryPackageInfoFor('licenseText')}
          />
        </MuiAccordionDetails>
      </MuiAccordion>
    </MuiPaper>
  );
}
