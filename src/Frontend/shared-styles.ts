// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { SxProps } from '@mui/material';
import {
  MUI_BREAKPOINTS_TO_PIXELS_MAPPING,
  POPUP_MAX_WIDTH_BREAKPOINT,
} from './shared-constants';

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
  red: 'hsl(0, 100%, 45%)',
  brown: 'hsl(33, 55%, 44%)',
};

export const criticalityColor = {
  high: OpossumColors.orange,
  medium: OpossumColors.mediumOrange,
  undefined: OpossumColors.darkBlue,
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

export const treeClasses = {
  header: (popupContentPadding: number): SxProps => {
    return {
      whiteSpace: 'nowrap',
      width: `calc(100% - ${popupContentPadding}px)`,
    };
  },
  treeContainer: (
    verticalSpaceBetweenTreeAndViewportEdges: number
  ): SxProps => {
    return {
      overflow: 'hidden',
      height: `calc(100vh - ${verticalSpaceBetweenTreeAndViewportEdges}px)`,
    };
  },
  tree: (
    treeLocation: 'popup' | 'browser',
    horizontalSpaceBetweenTreeAndViewportEdges?: number,
    popupContentPadding?: number
  ): SxProps => {
    function shouldNotBeCalled(treeLocation: never): never {
      throw Error(
        `Unknown treeLocation: ${treeLocation}. Possible values are 'browser' and 'popup'.`
      );
    }
    switch (treeLocation) {
      case 'browser': {
        return {
          width: resourceBrowserWidthInPixels,
          padding: '4px 0',
          background: OpossumColors.white,
          height: '100%',
        };
      }
      case 'popup': {
        const popupMaxWidth =
          MUI_BREAKPOINTS_TO_PIXELS_MAPPING[POPUP_MAX_WIDTH_BREAKPOINT];
        if (
          horizontalSpaceBetweenTreeAndViewportEdges !== undefined &&
          popupContentPadding !== undefined
        ) {
          return {
            width: `calc(100vw - ${horizontalSpaceBetweenTreeAndViewportEdges}px)`,
            maxWidth: `calc(${popupMaxWidth}px - ${popupContentPadding}px)`,
            background: OpossumColors.white,
          };
        } else {
          throw Error(
            "horizontalSpaceBetweenTreeAndViewportEdges and popupContentPadding have to be provided if treeLocation='popup'"
          );
        }
      }
      default: {
        shouldNotBeCalled(treeLocation);
      }
    }
  },
  treeItemLabel: {
    height: '19px',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover}`,
      cursor: 'pointer',
    },
  },
  treeItemLabelChildrenOfSelected: {
    backgroundColor: `${OpossumColors.lightestBlue}`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
  },
  treeItemLabelSelected: {
    backgroundColor: `${OpossumColors.lightestBlue} !important`,
    borderBottom: `1px ${OpossumColors.lightestBlue} solid`,
    '&:hover': {
      backgroundColor: `${OpossumColors.lightBlueOnHover} !important`,
    },
  },
  treeExpandIcon: {
    width: '16px',
    height: '20px',
    padding: '0px',
    margin: '0px',
    color: OpossumColors.darkBlue,
    '&:hover': {
      background: OpossumColors.middleBlue,
    },
  },
};
