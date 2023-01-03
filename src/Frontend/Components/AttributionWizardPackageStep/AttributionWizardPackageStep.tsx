// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

interface AttributionWizardPackageStepProps {
  selectedPackageNamespaceId: string;
  selectedPackageNameId: string;
  handlePackageNamespaceListItemClick: (id: string) => void;
  handlePackageNameListItemClick: (id: string) => void;
}

export function AttributionWizardPackageStep(
  props: AttributionWizardPackageStepProps
): ReactElement {
  // create dummy data
  const N = 15;
  const items = [];
  const highlightedAttributeIds = [];
  for (let i = 0; i < N; i++) {
    items.push({
      text: `package${i}`,
      id: `testItemId${i}`,
      attributes: [
        {
          text: `attrib${4 * i}`,
          id: `testAttributeId${4 * i}`,
        },
        {
          text: `attrib${4 * i + 1}`,
          id: `testAttributeId${4 * i + 1}`,
        },
        {
          text: `attrib${4 * i + 2}`,
          id: `testAttributeId${4 * i + 2}`,
        },
        {
          text: `attrib${4 * i + 3}`,
          id: `testAttributeId${4 * i + 3}`,
        },
      ],
    });
    highlightedAttributeIds.push(`testAttributeId${4 * i + (i % 4)}`);
  }

  return (
    <>
      <ListWithAttributes
        listItems={items}
        selectedListItemId={props.selectedPackageNamespaceId}
        highlightedAttributeIds={highlightedAttributeIds}
        handleListItemClick={props.handlePackageNamespaceListItemClick}
        showAddNewInput={false}
        title={'Package namespace'}
      />
      <ListWithAttributes
        listItems={items}
        selectedListItemId={props.selectedPackageNameId}
        highlightedAttributeIds={highlightedAttributeIds}
        handleListItemClick={props.handlePackageNameListItemClick}
        showAddNewInput={false}
        title={'Package name'}
      />
    </>
  );
}
