// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiTypography from '@mui/material/Typography';
import { useQuery } from '@tanstack/react-query';
import MuiSkeleton from '@mui/material/Skeleton';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordion from '@mui/material/Accordion';
import { IconButton } from '../IconButton/IconButton';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlusIcon from '@mui/icons-material/Add';
import { setTemporaryPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { fetchFromClearlyDefined } from './fetch-from-clearly-defined';
import { Alert } from '../Alert/Alert';
import { baseIcon } from '../../shared-styles';
import MuiBox from '@mui/material/Box';
import { EMPTY_DISPLAY_PACKAGE_INFO } from '../../shared-constants';

interface ClearlyDefinedPackageCardProps {
  coordinate: string;
}

const classes = {
  baseIcon,
  copyrightHolders: {
    whiteSpace: 'pre-wrap',
  },
  text: {
    textOverflow: 'ellipsis',
    overflow: 'overflow',
    whiteSpace: 'nowrap',
    width: '25%',
  },
  accordionSummary: {
    width: '100%',
  },
  accordionSummaryContent: {
    width: 'calc( 100% - 24px)',
  },
};

export function ClearlyDefinedPackageCard(
  props: ClearlyDefinedPackageCardProps
): ReactElement {
  const dispatch = useAppDispatch();

  const [expanded, setExpanded] = useState<boolean>(false);
  const { isLoading, data, isError, error } = useQuery(
    ['clearlyDefinedDefinition', props.coordinate],
    () => fetchFromClearlyDefined(props.coordinate),
    { refetchOnWindowFocus: false }
  );

  function handleExpansion(): void {
    if (data?.copyright) {
      setExpanded((prev) => !prev);
    }
  }

  return (
    <MuiAccordion square={true} expanded={expanded} onChange={handleExpansion}>
      <MuiAccordionSummary
        expandIcon={
          <ExpandMoreIcon
            aria-label={'expand accordion'}
            color={data?.copyright ? 'primary' : 'disabled'}
          />
        }
        sx={{
          '&.MuiAccordionSummary-root': classes.accordionSummary,
          '& div.MuiAccordionSummary-content': classes.accordionSummaryContent,
        }}
      >
        {!isError ? (
          <>
            {isLoading ? (
              <>
                <MuiBox sx={classes.text}>
                  <MuiSkeleton width="60px" />
                </MuiBox>
                <MuiTypography noWrap sx={classes.text}>
                  {props.coordinate}
                </MuiTypography>
                <MuiBox sx={classes.text}>
                  <MuiSkeleton width="60px" />
                </MuiBox>
                <MuiBox sx={classes.text}>
                  <MuiSkeleton width="60px" />
                </MuiBox>
              </>
            ) : (
              <>
                <MuiTypography noWrap sx={classes.text}>
                  {data?.packageName} - {data?.packageVersion}
                </MuiTypography>
                <MuiTypography noWrap sx={classes.text}>
                  {props.coordinate}
                </MuiTypography>
                <MuiTypography noWrap color="text.secondary" sx={classes.text}>
                  {data?.licenseName ?? ''}
                </MuiTypography>
                <MuiTypography noWrap sx={classes.text}>
                  {data?.url ?? ''}
                </MuiTypography>
              </>
            )}
            <IconButton
              tooltipTitle={'Add'}
              tooltipPlacement={'right'}
              disabled={!Boolean(data)}
              onClick={(): void => {
                dispatch(
                  setTemporaryPackageInfo(data ?? EMPTY_DISPLAY_PACKAGE_INFO)
                );
                dispatch(closePopup());
              }}
              icon={<PlusIcon sx={classes.baseIcon} />}
            />
          </>
        ) : (
          <Alert
            errorMessage={`Failed while fetching data for ${props.coordinate}${
              error instanceof Error ? `: ${error.message}` : ''
            }`}
          />
        )}
      </MuiAccordionSummary>
      <MuiAccordionDetails>
        <MuiTypography sx={classes.copyrightHolders} variant={'body1'}>
          {data?.copyright ?? ''}
        </MuiTypography>
      </MuiAccordionDetails>
    </MuiAccordion>
  );
}
