// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

interface AttributionWizardVersionStepProps {
  selectedPackageVersionId: string;
  handlePackageVersionListItemClick: (id: string) => void;
}

// TODO: Add Text with selected package namespace and name to the second step
// TODO: Provide selected Ids (or names) from both lists of the first step to the second step

export function AttributionWizardVersionStep(
  props: AttributionWizardVersionStepProps
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
    <ListWithAttributes
      listItems={items}
      selectedListItemId={props.selectedPackageVersionId}
      highlightedAttributeIds={highlightedAttributeIds}
      handleListItemClick={props.handlePackageVersionListItemClick}
      showAddNewInput={false}
      title={'Package version'}
    />
  );
}
