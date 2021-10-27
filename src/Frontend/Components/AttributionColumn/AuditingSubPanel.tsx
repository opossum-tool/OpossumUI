// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import MuiPaper from '@material-ui/core/Paper';
import { makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import React, { ChangeEvent, ReactElement } from 'react';
import { PackageInfo } from '../../../shared/shared-types';
import { DiscreteConfidence } from '../../enums/enums';
import { doNothing } from '../../util/do-nothing';
import { prettifySource } from '../../util/prettify-source';
import { Checkbox } from '../Checkbox/Checkbox';
import { Dropdown } from '../InputElements/Dropdown';
import { NumberBox } from '../InputElements/NumberBox';
import { TextBox } from '../InputElements/TextBox';
import { useAttributionColumnStyles } from './shared-attribution-column-styles';
import { getExternalAttributionSources } from '../../state/selectors/all-views-resource-selectors';
import { useAppSelector } from '../../state/hooks';

const useStyles = makeStyles({
  confidenceDropDown: {
    flex: 0,
    flexBasis: 100,
    marginBottom: 4,
  },
  sourceField: {
    marginBottom: 4,
    flex: 0.5,
  },
});

interface AuditingSubPanelProps {
  isEditable: boolean;
  displayPackageInfo: PackageInfo;
  showManualAttributionData: boolean;
  commentRows: number;
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
}

export function AuditingSubPanel(props: AuditingSubPanelProps): ReactElement {
  const classes = { ...useAttributionColumnStyles(), ...useStyles() };
  const attributionSources = useAppSelector(getExternalAttributionSources);

  return (
    <MuiPaper className={classes.panel} elevation={0} square={true}>
      <div className={classes.displayRow}>
        <Checkbox
          className={classes.checkBox}
          label={'1st Party'}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.firstParty)}
          onChange={props.firstPartyChangeHandler}
        />
        <Checkbox
          className={classes.checkBox}
          label={'Follow-up'}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.followUp)}
          onChange={props.followUpChangeHandler}
        />
        <Checkbox
          className={classes.checkBox}
          label={'Exclude From Notice'}
          disabled={!props.isEditable}
          checked={Boolean(props.displayPackageInfo.excludeFromNotice)}
          onChange={props.excludeFromNoticeChangeHandler}
        />
        {props.showManualAttributionData ? (
          <Dropdown
            className={classes.confidenceDropDown}
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
            className={classes.confidenceDropDown}
            title={'Confidence'}
            handleChange={props.setUpdateTemporaryPackageInfoFor(
              'attributionConfidence'
            )}
            isEditable={props.isEditable}
            step={1}
            min={0}
            max={100}
            value={props.displayPackageInfo.attributionConfidence}
          />
        )}
        {props.displayPackageInfo.source ? (
          <TextBox
            isEditable={false}
            className={clsx(classes.sourceField, classes.rightTextBox)}
            title={'Source'}
            text={prettifySource(
              props.displayPackageInfo.source.name,
              attributionSources
            )}
            maxRows={1}
            handleChange={doNothing}
          />
        ) : null}
      </div>
      <TextBox
        isEditable={props.isEditable}
        className={classes.textBox}
        title={'Comment'}
        text={props.displayPackageInfo.comment}
        minRows={props.commentRows}
        maxRows={props.commentRows}
        handleChange={props.setUpdateTemporaryPackageInfoFor('comment')}
      />
    </MuiPaper>
  );
}
