// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

export const OpossumColors = {
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
  white: 'hsl(0, 0%, 100%)',
  whiteOnHover: 'hsl(220, 41%, 65%)',
  black: 'hsl(0, 0%, 0%)',
  blackOnHover: 'hsl(220, 41%, 23%)',
  pastelDarkGreen: 'hsl(146, 50%, 55%)',
  pastelMiddleGreen: 'hsl(146, 50%, 68%)',
  pastelLightGreen: 'hsl(146, 50%, 80%)',
  pastelRed: 'hsl(0, 70%, 70%)',
  lightOrange: 'hsl(27, 100%, 94%)',
  lightOrangeOnHover: 'hsl(27, 100%, 89%)',
  mediumOrange: 'hsl(20, 100%, 72%)',
  orange: 'hsl(16, 100%, 50%)',
  lightGrey: 'hsla(0, 0%, 0%, 0.16)',
  grey: 'hsla(0, 0%, 0%, 0.52)',
  disabledGrey: 'hsla(0, 0%, 0%, 0.26)',
  disabledButtonGrey: 'hsla(0, 0%, 0%, 0.13)',
  red: 'hsl(0, 100%, 45%)',
  green: 'hsl(146, 50%, 45%)',
  brown: 'hsl(25, 76%, 31%)',
  purple: 'hsl(270, 50%, 40%)',
};

export const resourceBrowserWidthInPixels = 420;

export const tooltipStyle = {
  '& tooltip': {
    fontSize: '12px',
  },
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

export const checkboxClass = {
  checkBox: {
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    marginRight: '12px',
    marginLeft: '-2px',
  },
};
