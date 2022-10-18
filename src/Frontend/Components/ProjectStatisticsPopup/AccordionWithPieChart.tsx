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
import { CustomizedPieChart } from './CustomizedPieChart';
import { PieChartData } from './project-statistics-popup-helpers';
import { projectStatisticsPopupClasses } from './shared-project-statistics-popup-styles';

interface AccordionProps {
  data: Array<PieChartData>;
  title: string;
}

export function AccordionWithPieChart(
  props: AccordionProps
): ReactElement | null {
  if (props.data.length === 0) {
    return null;
  }

  return (
    <MuiAccordion sx={projectStatisticsPopupClasses.accordion} disableGutters>
      <MuiAccordionSummary
        sx={projectStatisticsPopupClasses.accordionSummary}
        expandIcon={
          <ExpandMoreIcon sx={projectStatisticsPopupClasses.accordionTitle} />
        }
      >
        <MuiTypography sx={projectStatisticsPopupClasses.accordionTitle}>
          {props.title}
        </MuiTypography>
      </MuiAccordionSummary>
      <MuiAccordionDetails sx={projectStatisticsPopupClasses.accordionDetails}>
        <CustomizedPieChart data={props.data} title={props.title} />
      </MuiAccordionDetails>
    </MuiAccordion>
  );
}
