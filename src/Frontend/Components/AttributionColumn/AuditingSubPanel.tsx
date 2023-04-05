// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@mui/material/Paper';
import React, { ChangeEvent, ReactElement } from 'react';
import {
  DiscreteConfidence,
  isMergedPackageInfo,
  MergedPackageInfo,
  PackageInfo,
} from '../../../shared/shared-types';
import { CheckboxLabel } from '../../enums/enums';
import { doNothing } from '../../util/do-nothing';
import { prettifySource } from '../../util/prettify-source';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dropdown } from '../InputElements/Dropdown';
import { NumberBox } from '../InputElements/NumberBox';
import { TextBox } from '../InputElements/TextBox';
import { attributionColumnClasses } from './shared-attribution-column-styles';
import { getExternalAttributionSources } from '../../state/selectors/all-views-resource-selectors';
import { useAppSelector } from '../../state/hooks';
import { checkboxClass } from '../../shared-styles';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import MuiBox from '@mui/material/Box';
import { TextFieldStack } from '../TextFieldStack/TextFieldStack';

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
  displayPackageInfo: PackageInfo | MergedPackageInfo;
  showManualAttributionData: boolean;
  isCommentsBoxCollapsed: boolean;
  commentBoxHeight: number;
  followUpChangeHandler(event: React.ChangeEvent<HTMLInputElement>): void;
  excludeFromNoticeChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>
  ): void;
  discreteConfidenceChangeHandler(
    event: React.ChangeEvent<HTMLInputElement>
  ): void;
  firstPartyChangeHandler(event: React.ChangeEvent<HTMLInputElement>): void;
  setUpdateTemporaryPackageInfoFor(
    propertyToUpdate: string
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  showHighlight?: boolean;
}

export function AuditingSubPanel(props: AuditingSubPanelProps): ReactElement {
  const attributionSources = useAppSelector(getExternalAttributionSources);

  let comments: Array<string>;
  if (isMergedPackageInfo(props.displayPackageInfo)) {
    comments = props.displayPackageInfo.comments || [];
  } else {
    comments = props.displayPackageInfo.comment
      ? [props.displayPackageInfo.comment]
      : [];
  }

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
        {props.showManualAttributionData ? (
          <Dropdown
            sx={classes.confidenceDropDown}
            isEditable={props.isEditable}
            title={'Confidence'}
            handleChange={props.discreteConfidenceChangeHandler}
            value={
              props.displayPackageInfo.attributionConfidence ||
              DiscreteConfidence.High
            }
            menuItems={[
              {
                value: DiscreteConfidence.High,
                name: `High (${DiscreteConfidence.High})`,
              },
              {
                value: DiscreteConfidence.Low,
                name: `Low (${DiscreteConfidence.Low})`,
              },
            ]}
          />
        ) : (
          <NumberBox
            sx={classes.confidenceDropDown}
            title={'Confidence'}
            handleChange={props.setUpdateTemporaryPackageInfoFor(
              'attributionConfidence'
            )}
            isEditable={props.isEditable}
            step={1}
            min={0}
            max={100}
            value={props.displayPackageInfo.attributionConfidence}
            isHighlighted={
              props.showHighlight &&
              isImportantAttributionInformationMissing(
                'attributionConfidence',
                props.displayPackageInfo
              )
            }
          />
        )}
        {props.displayPackageInfo.source ? (
          <TextBox
            isEditable={false}
            sx={{ ...classes.sourceField, ...classes.rightTextBox }}
            title={'Source'}
            text={prettifySource(
              props.displayPackageInfo.source.name,
              attributionSources
            )}
            handleChange={doNothing}
          />
        ) : null}
      </MuiBox>
      <TextFieldStack
        isEditable={props.isEditable}
        comments={comments}
        isCollapsed={props.isCommentsBoxCollapsed}
        commentBoxHeight={props.commentBoxHeight}
        handleChange={props.setUpdateTemporaryPackageInfoFor}
      />
    </MuiPaper>
  );
}
