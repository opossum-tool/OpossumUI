// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { ListWithAttributesItem } from '../../types/types';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';
import { PackageInfo } from '../../../shared/shared-types';
import { generatePurlFromPackageInfo } from '../../util/handle-purl';

const PURL_HEIGHT = 45;

const classes = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  },
  purl: {
    border: 1,
    padding: '0px 3px',
    marginTop: '5px',
    marginBottom: '10px',
  },
  listBox: {
    display: 'flex',
    maxHeight: `calc(100% - ${PURL_HEIGHT}px)`,
  },
};
interface AttributionWizardVersionStepProps {
  attributedPackageVersions: Array<ListWithAttributesItem>;
  highlightedPackageNameIds: Array<string>;
  selectedPackageInfo: PackageInfo;
  selectedPackageVersionId: string;
  handlePackageVersionListItemClick: (id: string) => void;
}

export function AttributionWizardVersionStep(
  props: AttributionWizardVersionStepProps
): ReactElement {
  const temporaryPackagePurl = generatePurlFromPackageInfo(
    props.selectedPackageInfo
  );

  return (
    <MuiBox sx={classes.root}>
      <MuiTypography variant={'subtitle1'} sx={classes.purl}>
        {temporaryPackagePurl}
      </MuiTypography>
      <MuiBox sx={classes.listBox}>
        <ListWithAttributes
          listItems={props.attributedPackageVersions}
          selectedListItemId={props.selectedPackageVersionId}
          highlightedAttributeIds={props.highlightedPackageNameIds}
          handleListItemClick={props.handlePackageVersionListItemClick}
          showAddNewInput={false}
          title={'Package version'}
          listItemSx={{ maxWidth: '400px' }}
        />
      </MuiBox>
    </MuiBox>
  );
}
