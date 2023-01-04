// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement, useState } from 'react';
import MuiBox from '@mui/material/Box';
import { doNothing } from '../../util/do-nothing';
import { OpossumColors } from '../../shared-styles';
import { NotificationPopup } from '../NotificationPopup/NotificationPopup';
import { ButtonText } from '../../enums/enums';
import { useAppDispatch } from '../../state/hooks';
import { closePopup } from '../../state/actions/view-actions/view-actions';
import { PathBar } from '../PathBar/PathBar';
import { ListWithAttributes } from '../ListWithAttributes/ListWithAttributes';

// const POPUP_CONTENT_PADDING = 48; // TODO: monitored in upcoming tickets
const attributionWizardPopupHeader = 'Attribution Wizard';

const classes = {
  dialogContent: {
    // TODO: required later
  },
  dialogHeader: {
    whiteSpace: 'nowrap',
    // width: `calc(100% - ${POPUP_CONTENT_PADDING}px)`, // TODO: monitored in upcoming tickets
  },
  mainContent: {
    borderRadius: 2,
    paddingTop: '0px',
    background: OpossumColors.white,
  },
  mainContentBox: {
    key: 'mainContent',
    display: 'flex',
    gap: '30px',
    width: 'fit-content',
    marginTop: '8px',
    maxHeight: '70vh',
    minWidth: '60vh',
  },
  pathBar: {
    paddingLeft: '5px',
    paddingRight: '5px',
    paddingTop: '1px',
    paddingBottom: '1px',
  },
  pathBarBox: {
    padding: '4px',
    background: OpossumColors.lightBlue,
  },
};

export function AttributionWizardPopup(): ReactElement {
  const dispatch = useAppDispatch();

  function closeAttributionWizardPopup(): void {
    dispatch(closePopup());
  }

  // TODO: const selectedAttributionId = useAppSelector(getPopupAttributionId);  for later
  // TODO: const selectedResourceId = useSelector(getSelectedResourceId);  for later
  const nextButtonConfig = {
    buttonText: ButtonText.Next,
    onClick: doNothing,
    isDisabled: true,
  };
  const closeButtonConfig = {
    buttonText: ButtonText.Cancel,
    onClick: closeAttributionWizardPopup,
    isDisabled: false,
  };

  // TODO: streamline and integrate this logic later
  const [selectedIdList1, setSelectedIdList1] = useState<string>('');
  const [selectedIdList2, setSelectedIdList2] = useState<string>('');
  const handleListItemClickList1 = (id: string): void => {
    setSelectedIdList1(id);
  };
  const handleListItemClickList2 = (id: string): void => {
    setSelectedIdList2(id);
  };

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
    <NotificationPopup
      header={attributionWizardPopupHeader}
      leftButtonConfig={nextButtonConfig}
      rightButtonConfig={closeButtonConfig}
      onBackdropClick={closeAttributionWizardPopup}
      onEscapeKeyDown={closeAttributionWizardPopup}
      isOpen={true}
      fullWidth={false}
      headerSx={classes.dialogHeader}
      content={
        <>
          <MuiBox sx={classes.pathBarBox}>
            <PathBar sx={classes.pathBar} />
          </MuiBox>
          <MuiBox sx={classes.mainContentBox}>
            <ListWithAttributes
              listItems={items}
              selectedListItemId={selectedIdList1}
              highlightedAttributeIds={highlightedAttributeIds}
              handleListItemClick={handleListItemClickList1}
              showAddNewInput={false}
            />
            <ListWithAttributes
              listItems={items}
              selectedListItemId={selectedIdList2}
              highlightedAttributeIds={highlightedAttributeIds}
              handleListItemClick={handleListItemClickList2}
              showAddNewInput={false}
            />
          </MuiBox>
        </>
      }
    />
  );
}
