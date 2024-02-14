// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const OpossumColors = {
  white: 'hsl(0, 0%, 100%)',
  whiteOnHover: 'hsl(220, 41%, 65%)',
  almostWhiteBlue: 'hsl(220, 41%, 97%)',
  lightestBlue: 'hsl(220, 41%, 92%)',
  lightestBlueOnHover: 'hsl(220, 41%, 75%)',
  lighterBlue: 'hsl(220, 41%, 87%)',
  lightBlue: 'hsl(220, 41%, 85%)',
  lightBlueOnHover: 'hsl(220, 41%, 75%)',
  middleBlue: 'hsl(220, 41%, 70%)',
  middleBlueOnHover: 'hsl(220, 41%, 60%)',
  darkBlue: 'hsl(220, 41%, 41%)',
  darkBlueOnHover: 'hsl(220, 41%, 65%)',
  disabledButtonGrey: 'hsla(0, 0%, 0%, 0.13)',
  disabledGrey: 'hsla(0, 0%, 0%, 0.26)',
  grey: 'hsla(0, 0%, 0%, 0.52)',
  lightGrey: 'hsla(0, 0%, 0%, 0.09)',
  mediumGrey: 'hsla(0, 0%, 0%, 0.36)',
  darkGrey: 'hsla(0, 0%, 0%, 0.7)',
  black: 'hsl(0, 0%, 0%)',
  pastelLightGreen: 'hsl(146, 50%, 80%)',
  pastelMiddleGreen: 'hsl(146, 50%, 68%)',
  pastelDarkGreen: 'hsl(146, 50%, 55%)',
  green: 'hsl(146, 50%, 45%)',
  lightOrange: 'hsl(27, 100%, 94%)',
  lightOrangeOnHover: 'hsl(27, 100%, 89%)',
  mediumOrange: 'hsl(20, 100%, 72%)',
  orange: 'hsl(16, 100%, 50%)',
  pastelRed: 'hsl(0, 70%, 70%)',
  darkOrange: 'hsl(20, 80%, 78%)',
  darkOrangeOnHover: 'hsl(20, 80%, 65%)',
  red: 'hsl(0, 100%, 45%)',
  brown: 'hsl(33, 55%, 44%)',
};

export const criticalityColor = {
  high: OpossumColors.orange,
  medium: OpossumColors.mediumOrange,
};

export const baseIcon = {
  width: '15px',
  height: '15px',
  padding: '2px',
  margin: '0 2px',
};

export const clickableIcon = {
  ...baseIcon,
  color: OpossumColors.darkBlue,
  '&:hover': {
    background: OpossumColors.middleBlue,
  },
};

export const disabledIcon = {
  ...baseIcon,
  color: OpossumColors.disabledButtonGrey,
};

export const tableClasses = {
  head: {
    fontSize: 13,
    background: OpossumColors.darkBlue,
    color: OpossumColors.white,
  },
  body: {
    fontSize: 11,
    background: OpossumColors.lightestBlue,
    maxWidth: '200px',
    overflow: 'auto',
    color: OpossumColors.black,
  },
  footer: {
    fontWeight: 'bold',
    fontSize: 12,
    background: OpossumColors.lightBlue,
    position: 'sticky',
    bottom: 0,
    color: OpossumColors.black,
  },
};

export const TREE_ROOT_FOLDER_LABEL = '';

export const treeItemClasses = {
  labelRoot: {
    display: 'flex',
    alignItems: 'center',
  },
  text: {
    paddingRight: '5px',
  },
  breakpoint: {
    fontWeight: 'bold',
    color: OpossumColors.grey,
  },
  hasSignal: {
    color: OpossumColors.pastelRed,
  },
  hasAttribution: {
    color: OpossumColors.green,
  },
  hasParentWithManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsManualAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
  containsManualAndExternalAttribution: {
    color: OpossumColors.middleBlue,
  },
  resourceWithoutInformation: {
    color: OpossumColors.disabledGrey,
  },
  notContainsResourcesWithOnlyExternalAttribution: {
    color: OpossumColors.pastelMiddleGreen,
  },
};

export const TRANSITION = 'all 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms';
