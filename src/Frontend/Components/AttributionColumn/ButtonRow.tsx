// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ReactElement } from 'react';

import { DisplayPackageInfo, PackageInfo } from '../../../shared/shared-types';
import { ButtonText, CheckboxLabel } from '../../enums/enums';
import { checkboxClass } from '../../shared-styles';
import { ButtonGroup, MainButtonConfig } from '../ButtonGroup/ButtonGroup';
import { Checkbox } from '../Checkbox/Checkbox';
import { ContextMenuItem } from '../ContextMenu/ContextMenu';
import { ToggleButton } from '../ToggleButton/ToggleButton';

const classes = {
  ...checkboxClass,
  root: {
    marginLeft: '10px',
    marginTop: '5px',
  },
  buttonRow: {
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    marginRight: '8px',
    marginBottom: '16px',
    marginLeft: 'auto',
  },
  resolveButton: {
    marginTop: '0px',
    marginRight: '0px',
  },
  checkboxForPopUp: {
    marginRight: '190px',
    marginBottom: '-8px',
  },
};

interface ButtonRowProps {
  showButtonGroup: boolean;
  areButtonsHidden?: boolean;
  selectedPackageIsResolved: boolean;
  resolvedToggleHandler(): void;
  displayTexts: Array<string>;
  mainButtonConfigs: Array<MainButtonConfig>;
  hamburgerMenuButtonConfigs?: Array<ContextMenuItem>;
  isEditable: boolean;
  displayPackageInfo: PackageInfo | DisplayPackageInfo;
  needsReviewChangeHandler(event: React.ChangeEvent<HTMLInputElement>): void;
  addMarginForNeedsReviewCheckbox?: boolean;
}

export function ButtonRow(props: ButtonRowProps): ReactElement {
  const marginForNeedsReviewCheckbox = props.addMarginForNeedsReviewCheckbox
    ? classes.checkboxForPopUp
    : {};

  return (
    <MuiBox sx={classes.root}>
      {props.displayTexts.map((text, index) => (
        <MuiTypography variant={'subtitle1'} key={`${text}-${index}`}>
          {text}
        </MuiTypography>
      ))}
      <MuiBox sx={classes.buttonRow}>
        {props.showButtonGroup ? (
          <>
            <Checkbox
              sx={{
                ...classes.checkBox,
                ...marginForNeedsReviewCheckbox,
              }}
              label={CheckboxLabel.NeedsReview}
              disabled={!props.isEditable}
              checked={Boolean(props.displayPackageInfo.needsReview)}
              onChange={props.needsReviewChangeHandler}
            />
            <ButtonGroup
              isHidden={props.areButtonsHidden}
              mainButtonConfigs={props.mainButtonConfigs}
              hamburgerMenuButtonConfigs={props.hamburgerMenuButtonConfigs}
            />
          </>
        ) : (
          <ToggleButton
            buttonText={
              props.selectedPackageIsResolved
                ? ButtonText.Unhide
                : ButtonText.Hide
            }
            sx={classes.resolveButton}
            selected={props.selectedPackageIsResolved}
            handleChange={props.resolvedToggleHandler}
            ariaLabel={'resolve attribution'}
          />
        )}
      </MuiBox>
    </MuiBox>
  );
}
