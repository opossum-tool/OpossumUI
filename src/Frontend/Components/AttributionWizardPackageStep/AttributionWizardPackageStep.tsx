// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import MuiBox from '@mui/material/Box';
import MuiTypography from '@mui/material/Typography';
import { PackageInfo } from '../../../shared/shared-types';
import { ListWithAttributesItem } from '../../types/types';
import { generatePurlFromPackageInfo } from '../../util/handle-purl';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

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
    gap: '30px',
    maxHeight: `calc(100% - ${PURL_HEIGHT}px)`,
  },
};
interface AttributionWizardPackageStepProps {
  attributedPackageNamespaces: Array<ListWithAttributesItem>;
  attributedPackageNames: Array<ListWithAttributesItem>;
  temporaryPackageInfo: PackageInfo;
  selectedPackageNamespaceId: string;
  selectedPackageNameId: string;
  handlePackageNamespaceListItemClick: (id: string) => void;
  handlePackageNameListItemClick: (id: string) => void;
}

export function AttributionWizardPackageStep(
  props: AttributionWizardPackageStepProps
): ReactElement {
  const temporaryPackagePurl = generatePurlFromPackageInfo(
    props.temporaryPackageInfo
  );
  return (
    <MuiBox sx={classes.root}>
      <MuiTypography variant={'subtitle1'} sx={classes.purl}>
        {temporaryPackagePurl}
      </MuiTypography>
      <MuiBox sx={classes.listBox}>
        <ListWithAttributes
          listItems={props.attributedPackageNamespaces}
          selectedListItemId={props.selectedPackageNamespaceId}
          handleListItemClick={props.handlePackageNamespaceListItemClick}
          showAddNewInput={false}
          title={'Package namespace'}
        />
        <ListWithAttributes
          listItems={props.attributedPackageNames}
          selectedListItemId={props.selectedPackageNameId}
          handleListItemClick={props.handlePackageNameListItemClick}
          showAddNewInput={false}
          title={'Package name'}
        />
      </MuiBox>
    </MuiBox>
  );
}
