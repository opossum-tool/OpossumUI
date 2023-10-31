// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';

interface CopyrightSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: DisplayPackageInfo;
  copyrightRows: number;
  showHighlight?: boolean;
}

export function CopyrightSubPanel(props: CopyrightSubPanelProps): ReactElement {
  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiPaper sx={attributionColumnClasses.panel} elevation={0} square={true}>
      <MuiBox sx={attributionColumnClasses.displayRow}>
        <TextBox
          isEditable={props.isEditable}
          sx={attributionColumnClasses.textBox}
          title={'Copyright'}
          text={props.displayPackageInfo.copyright}
          minRows={props.copyrightRows}
          maxRows={props.copyrightRows}
          multiline={true}
          handleChange={handleChange('copyright')}
          isHighlighted={
            props.showHighlight &&
            isImportantAttributionInformationMissing(
              'copyright',
              props.displayPackageInfo,
            )
          }
        />
      </MuiBox>
    </MuiPaper>
  );
}
