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
import { generatePurl } from '../../util/handle-purl';
import { TextBox } from '../InputElements/TextBox';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';
import { sortAttributedPackageVersions } from './attribution-wizard-verstion-step-helpers';

const classes = {
  listBox: {
    display: 'flex',
    maxHeight: `calc(100% - ${ATTRIBUTION_WIZARD_PURL_TOTAL_HEIGHT}px)`,
  },
};
interface AttributionWizardVersionStepProps {
  attributedPackageVersions: Array<ListWithAttributesItem>;
  highlightedPackageNameId: string;
  selectedDisplayPackageInfo: DisplayPackageInfo;
  selectedPackageVersionId: string;
  handlePackageVersionListItemClick: (id: string) => void;
  addNewPackageVersion(items: string): void;
  listSx?: SxProps;
}

export function AttributionWizardVersionStep(
  props: AttributionWizardVersionStepProps,
): ReactElement {
  const temporaryPurl = generatePurl(props.selectedDisplayPackageInfo);

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
      <MuiBox sx={classes.listBox}>
        <ListWithAttributes
          listItems={props.attributedPackageVersions}
          selectedListItemId={props.selectedPackageVersionId}
          highlightedAttributeIds={[props.highlightedPackageNameId]}
          handleListItemClick={props.handlePackageVersionListItemClick}
          showChipsForAttributes={true}
          showAddNewListItem={true}
          setManuallyAddedListItems={props.addNewPackageVersion}
          title={'Package version'}
          listSx={props.listSx}
          sortList={sortAttributedPackageVersions}
        />
      </MuiBox>
    </MuiBox>
  );
}
