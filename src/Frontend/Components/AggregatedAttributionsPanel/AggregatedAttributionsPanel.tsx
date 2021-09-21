// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiAccordion from '@material-ui/core/Accordion';
import MuiAccordionDetails from '@material-ui/core/AccordionDetails';
import MuiAccordionSummary from '@material-ui/core/AccordionSummary';
import { makeStyles } from '@material-ui/core/styles';
import MuiTypography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import clsx from 'clsx';
import React, { ReactElement, useCallback, useEffect } from 'react';
import { AttributionIdWithCount } from '../../../shared/shared-types';
import { PackagePanel } from '../PackagePanel/PackagePanel';
import { PanelData } from '../ResourceDetailsTabs/resource-details-tabs-helpers';

const useStyles = makeStyles({
  expansionPanelExpanded: {
    margin: '0px !important',
  },
  expansionPanelSummary: {
    minHeight: '24px !important',
    '& div.MuiAccordionSummary-content': {
      margin: 0,
    },
    '& div.MuiAccordionSummary-expandIcon': {
      padding: '6px 12px',
    },
    padding: '0 12px',
  },
  disabledAccordion: {},
  expansionPanelDetails: { height: '100%', padding: '0 12px 16px' },
});

interface AggregatedAttributionsPanelProps {
  panelData: Array<PanelData>;
  isAddToPackageEnabled: boolean;
}

export function AggregatedAttributionsPanel(
  props: AggregatedAttributionsPanelProps
): ReactElement {
  const classes = useStyles();

  const [expanded, setExpanded] = React.useState<Array<string>>([]);

  const openPopulatedPanels = useCallback(() => {
    const openPanels = props.panelData
      .filter(
        (panelData: PanelData) => !isDisabled(panelData.attributionIdsWithCount)
      )
      .map((panelPackage: PanelData) => panelPackage.title);
    setExpanded(openPanels);
  }, [props.panelData]);
  useEffect(() => openPopulatedPanels(), [openPopulatedPanels]);

  const handleChange =
    (panel: string) =>
    (event: React.ChangeEvent<unknown>, isExpanded: boolean): void => {
      setExpanded(
        isExpanded
          ? expanded.concat(panel)
          : expanded.filter((panelName) => panel !== panelName)
      );
    };

  function isDisabled(
    attributionIdsWithCount: Array<AttributionIdWithCount>
  ): boolean {
    return (
      attributionIdsWithCount === undefined ||
      (attributionIdsWithCount && attributionIdsWithCount.length === 0)
    );
  }

  function isExpanded(panelPackage: PanelData): boolean {
    return expanded.includes(panelPackage.title);
  }

  return (
    <>
      {props.panelData.map((panelData: PanelData) => (
        <MuiAccordion
          className={clsx(
            isDisabled(panelData.attributionIdsWithCount)
              ? classes.disabledAccordion
              : null
          )}
          classes={{ expanded: classes.expansionPanelExpanded }}
          elevation={0}
          square={true}
          key={`PackagePanel-${panelData.title}`}
          expanded={isExpanded(panelData)}
          onChange={handleChange(panelData.title)}
          disabled={isDisabled(panelData.attributionIdsWithCount)}
        >
          <MuiAccordionSummary
            classes={{ root: classes.expansionPanelSummary }}
            expandIcon={<ExpandMoreIcon />}
          >
            <MuiTypography>{panelData.title}</MuiTypography>
          </MuiAccordionSummary>
          <MuiAccordionDetails
            classes={{ root: classes.expansionPanelDetails }}
          >
            <PackagePanel
              title={panelData.title}
              attributionIdsWithCount={panelData.attributionIdsWithCount}
              attributions={panelData.attributions}
              isAddToPackageEnabled={props.isAddToPackageEnabled}
            />
          </MuiAccordionDetails>
        </MuiAccordion>
      ))}
    </>
  );
}
