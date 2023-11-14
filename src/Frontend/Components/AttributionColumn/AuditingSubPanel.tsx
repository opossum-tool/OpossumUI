// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/material/Box';
import MuiPaper from '@mui/material/Paper';
import { ReactElement } from 'react';

import {
  DiscreteConfidence,
  DisplayPackageInfo,
} from '../../../shared/shared-types';
import { CheckboxLabel } from '../../enums/enums';
import { checkboxClass } from '../../shared-styles';
import { useAppSelector } from '../../state/hooks';
import { getExternalAttributionSources } from '../../state/selectors/all-views-resource-selectors';
import { doNothing } from '../../util/do-nothing';
import { prettifySource } from '../../util/prettify-source';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dropdown } from '../InputElements/Dropdown';
import { TextBox } from '../InputElements/TextBox';
import { TextFieldStack } from '../TextFieldStack/TextFieldStack';
import { attributionColumnClasses } from './shared-attribution-column-styles';

const classes = {
  ...checkboxClass,
  ...attributionColumnClasses,
  confidenceDropDown: {
    flex: 0,
    flexBasis: 100,
    marginBottom: '4px',
  },
  sourceField: {
    marginBottom: '4px',
    flex: 0.5,
  },
};

interface AuditingSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: DisplayPackageInfo;
  isCommentsBoxCollapsed: boolean;
  commentBoxHeight: number;
  followUpChangeHandler(event: React.ChangeEvent<HTMLInputElement>): void;
  excludeFromNoticeChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void;
  discreteConfidenceChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>,
  ): void;
  firstPartyChangeHandler(event: React.ChangeEvent<HTMLInputElement>): void;
  showHighlight?: boolean;
}

export function AuditingSubPanel(props: AuditingSubPanelProps): ReactElement {
  const attributionSources = useAppSelector(getExternalAttributionSources);

  return (
    <MuiPaper sx={classes.panel} elevation={0} square={true}>
      <MuiBox sx={classes.displayRow}>
        <Checkbox
          sx={classes.checkBox}
          label={CheckboxLabel.FirstParty}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.firstParty)}
          onChange={props.firstPartyChangeHandler}
        />
        <Checkbox
          sx={classes.checkBox}
          label={CheckboxLabel.FollowUp}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.followUp)}
          onChange={props.followUpChangeHandler}
        />
        <Checkbox
          sx={classes.checkBox}
          label={CheckboxLabel.ExcludeFromNotice}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.excludeFromNotice)}
          onChange={props.excludeFromNoticeChangeHandler}
        />
        {
          <Dropdown
            sx={classes.confidenceDropDown}
            isEditable={props.isEditable}
            title={'Confidence'}
            handleChange={props.discreteConfidenceChangeHandler}
            value={(
              props.displayPackageInfo.attributionConfidence ||
              DiscreteConfidence.High
            ).toString()}
            menuItems={[
              {
                value: DiscreteConfidence.High.toString(),
                name: `High (${DiscreteConfidence.High})`,
              },
              {
                value: DiscreteConfidence.Low.toString(),
                name: `Low (${DiscreteConfidence.Low})`,
              },
            ]}
          />
        }
        {props.displayPackageInfo.source ? (
          <TextBox
            isEditable={false}
            sx={classes.sourceField}
            title={'Source'}
            text={prettifySource(
              props.displayPackageInfo.source.name,
              attributionSources,
            )}
            handleChange={doNothing}
          />
        ) : null}
      </MuiBox>
      <TextFieldStack
        isEditable={props.isEditable}
        comments={props.displayPackageInfo.comments || []}
        isCollapsed={props.isCommentsBoxCollapsed}
        commentBoxHeight={props.commentBoxHeight}
      />
    </MuiPaper>
  );
}
