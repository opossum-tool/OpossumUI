// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import React, { ChangeEvent, ReactElement } from 'react';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';
import MuiBox from '@mui/material/Box';

interface CopyrightSubPanelProps {
  isEditable: boolean;
  copyright?: string;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  copyrightRows: number;
  showHighlight?: boolean;
}

export function CopyrightSubPanel(props: CopyrightSubPanelProps): ReactElement {
  return (
    <MuiPaper sx={attributionColumnClasses.panel} elevation={0} square={true}>
      <MuiBox sx={attributionColumnClasses.displayRow}>
        <TextBox
          isEditable={props.isEditable}
          sx={attributionColumnClasses.textBox}
          title={'Copyright'}
          text={props.copyright}
          minRows={props.copyrightRows}
          maxRows={props.copyrightRows}
          multiline={true}
          handleChange={props.setUpdateTemporaryPackageInfoFor('copyright')}
          isHighlighted={
            props.showHighlight &&
            isImportantAttributionInformationMissing('copyright', {
              copyright: props.copyright,
            })
          }
        />
      </MuiBox>
    </MuiPaper>
  );
}
