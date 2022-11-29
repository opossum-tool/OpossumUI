// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiTypography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { PieChart } from '../PieChart/PieChart';
import { OpossumColors } from '../../shared-styles';
import {
  CriticalityTypes,
  ProjectStatisticsPopupTitle,
} from '../../enums/enums';
import { PieChartData } from '../../types/types';

const classes = {
  accordion: {
    marginBottom: '1px',
    maxWidth: '600px',
  },
  accordionSummary: {
    background: OpossumColors.darkBlue,
  },
  accordionTitle: {
    color: OpossumColors.white,
  },
  accordionDetails: {
    padding: 0,
    background: OpossumColors.lightestBlue,
  },
};

interface AccordionProps {
  data: Array<PieChartData>;
  title: string;
}

export function getColorsForPieChart(
  pieChartData: Array<PieChartData>,
  pieChartTitle: string
): Array<string> | undefined {
  const pieChartColors = [];

  if (
    pieChartTitle === ProjectStatisticsPopupTitle.CriticalSignalsCountPieChart
  ) {
    for (const pieChartSegment of pieChartData) {
      switch (pieChartSegment.name) {
        case CriticalityTypes.HighCriticality:
          pieChartColors.push(OpossumColors.orange);
          break;
        case CriticalityTypes.MediumCriticality:
          pieChartColors.push(OpossumColors.mediumOrange);
          break;
        default:
          pieChartColors.push(OpossumColors.darkBlue);
          break;
      }
    }
  } else {
    return;
  }
  return pieChartColors;
}

export function AccordionWithPieChart(
  props: AccordionProps
): ReactElement | null {
  if (props.data.length === 0) {
    return null;
  }

  return (
    <MuiAccordion sx={classes.accordion} disableGutters>
      <MuiAccordionSummary
        sx={classes.accordionSummary}
        expandIcon={<ExpandMoreIcon sx={classes.accordionTitle} />}
      >
        <MuiTypography sx={classes.accordionTitle}>{props.title}</MuiTypography>
      </MuiAccordionSummary>
      <MuiAccordionDetails sx={classes.accordionDetails}>
        <PieChart
          segments={props.data}
          colors={getColorsForPieChart(props.data, props.title)}
        />
      </MuiAccordionDetails>
    </MuiAccordion>
  );
}
