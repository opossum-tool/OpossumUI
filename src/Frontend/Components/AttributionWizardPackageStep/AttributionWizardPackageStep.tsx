// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { SxProps } from '@mui/system';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import {
  ATTRIBUTION_WIZARD_PURL_TOTAL_HEIGHT,
  attributionWizardStepClasses,
} from '../../shared-styles';
import { ListWithAttributesItem } from '../../types/types';
import { doNothing } from '../../util/do-nothing';
import { generatePurlFromDisplayPackageInfo } from '../../util/handle-purl';
import { TextBox } from '../InputElements/TextBox';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';
import { sortAttributedPackageItems } from './attribution-wizard-package-step-helpers';

const classes = {
  listBox: {
    display: 'flex',
    gap: '25px',
    maxHeight: `calc(100% - ${ATTRIBUTION_WIZARD_PURL_TOTAL_HEIGHT}px)`,
  },
};
interface AttributionWizardPackageStepProps {
  attributedPackageNamespaces: Array<ListWithAttributesItem>;
  attributedPackageNames: Array<ListWithAttributesItem>;
  selectedDisplayPackageInfo: DisplayPackageInfo;
  selectedPackageNamespaceId: string;
  selectedPackageNameId: string;
  handlePackageNamespaceListItemClick: (id: string) => void;
  handlePackageNameListItemClick: (id: string) => void;
  addPackageNamespace(namespace: string): void;
  addPackageName(name: string): void;
  listBoxSx?: SxProps;
  listSx?: SxProps;
}

export function AttributionWizardPackageStep(
  props: AttributionWizardPackageStepProps,
): ReactElement {
  const selectedPackageInfoWithoutVersion = {
    ...props.selectedDisplayPackageInfo,
    packageVersion: undefined,
  };
  const temporaryPurl = generatePurlFromDisplayPackageInfo(
    selectedPackageInfoWithoutVersion,
  );

  return (
    <MuiBox sx={attributionWizardStepClasses.root}>
      <TextBox
        title={'PURL'}
        isEditable={false}
        text={temporaryPurl}
        isHighlighted={false}
        handleChange={doNothing}
        sx={attributionWizardStepClasses.purlRoot}
        textFieldInputSx={attributionWizardStepClasses.purlText}
      />
      <MuiBox sx={{ ...classes.listBox, ...props.listBoxSx }}>
        <ListWithAttributes
          listItems={props.attributedPackageNamespaces}
          selectedListItemId={props.selectedPackageNamespaceId}
          handleListItemClick={props.handlePackageNamespaceListItemClick}
          showChipsForAttributes={false}
          showAddNewListItem={true}
          setManuallyAddedListItems={props.addPackageNamespace}
          title={'Package namespace'}
          listSx={props.listSx}
          sortList={sortAttributedPackageItems}
        />
        <ListWithAttributes
          listItems={props.attributedPackageNames}
          selectedListItemId={props.selectedPackageNameId}
          handleListItemClick={props.handlePackageNameListItemClick}
          showChipsForAttributes={false}
          showAddNewListItem={true}
          setManuallyAddedListItems={props.addPackageName}
          title={'Package name'}
          listSx={props.listSx}
          sortList={sortAttributedPackageItems}
        />
      </MuiBox>
    </MuiBox>
  );
}
