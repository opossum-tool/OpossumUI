// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';
import { PieChartCriticalityNames } from '../../enums/enums';
import { OpossumColors } from '../../shared-styles';
import { PieChartData } from '../../types/types';
import { PieChart } from '../PieChart/PieChart';

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
  defaultExpanded?: boolean;
}

export function getColorsForPieChart(
  pieChartData: Array<PieChartData>,
  pieChartTitle: string,
): Array<string> | undefined {
  const pieChartColors: Array<string> = [];

  if (
    pieChartTitle ===
    text.projectStatisticsPopup.charts.criticalSignalsCountPieChart
  ) {
    for (const pieChartSegment of pieChartData) {
      switch (pieChartSegment.name) {
        case PieChartCriticalityNames.HighCriticality:
          pieChartColors.push(OpossumColors.orange);
          break;
        case PieChartCriticalityNames.MediumCriticality:
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

export const AccordionWithPieChart: React.FC<AccordionProps> = (props) => {
  if (props.data.length === 0) {
    return null;
  }

  return (
    <MuiAccordion
      sx={classes.accordion}
      disableGutters
      defaultExpanded={props.defaultExpanded}
    >
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
};
