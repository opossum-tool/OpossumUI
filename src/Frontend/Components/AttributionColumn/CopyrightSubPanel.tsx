// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import { ReactElement } from 'react';

import { DisplayPackageInfo } from '../../../shared/shared-types';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { usePackageInfoChangeHandler } from '../../util/use-package-info-change-handler';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';

interface CopyrightSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: DisplayPackageInfo;
  showHighlight?: boolean;
}

export function CopyrightSubPanel(props: CopyrightSubPanelProps): ReactElement {
  const handleChange = usePackageInfoChangeHandler();

  return (
    <MuiBox sx={attributionColumnClasses.panel}>
      <TextBox
        isEditable={props.isEditable}
        sx={attributionColumnClasses.textBox}
        title={'Copyright'}
        text={props.displayPackageInfo.copyright}
        minRows={3}
        maxRows={10}
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
  );
}
