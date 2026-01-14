// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import NotesIcon from '@mui/icons-material/Notes';
import { Badge, ToggleButton } from '@mui/material';
import MuiBox from '@mui/material/Box';
import { groupBy, sortBy } from 'lodash';
import { useCallback, useMemo, useState } from 'react';

import { Attributions, PackageInfo } from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { useAppDispatch, useAppSelector } from '../../../state/hooks';
import {
  getFrequentLicensesNameOrder,
  getFrequentLicensesTexts,
} from '../../../state/selectors/resource-selectors';
import {
  useFilteredAttributions,
  useFilteredSignals,
} from '../../../state/variables/use-filtered-data';
import { Autocomplete } from '../../Autocomplete/Autocomplete';
import { renderOccuranceCount } from '../../Autocomplete/AutocompleteUtil';
import { Confirm } from '../../ConfirmationDialog/ConfirmationDialog';
import { SourceIcon } from '../../Icons/Icons';
import { TextBox } from '../../TextBox/TextBox';
import { AttributionFormConfig } from '../AttributionForm';

const classes = {
  licenseText: {
    marginTop: '12px',
  },
  endAdornment: {
    paddingRight: '6px',
    paddingTop: '2px',
  },
};

interface LicenseSubPanelProps {
  packageInfo: PackageInfo;
  showHighlight?: boolean;
  onEdit?: Confirm;
  expanded?: boolean;
  hidden?: boolean;
  config?: AttributionFormConfig;
}

export function LicenseSubPanel({
  packageInfo,
  showHighlight,
  onEdit,
  expanded,
  hidden,
  config,
}: LicenseSubPanelProps) {
  const [showLicenseText, setShowLicenseText] = useState(false);
  const dispatch = useAppDispatch();
  const frequentLicenseTexts = useAppSelector(getFrequentLicensesTexts);
  const frequentLicensesNames = useAppSelector(getFrequentLicensesNameOrder);

  function splitAtLastWord(expression: string): [string, string] {
    return expression.match(/^(.*?)(\S*)$/)?.slice(1) as [string, string];
  }

  const [{ attributions }] = useFilteredAttributions();
  const [{ attributions: signals }] = useFilteredSignals();

  type LicenseOption = {
    shortName: string;
    fullName: string | undefined;
    attributionCount?: number;
    group: string;
    replaceAll: boolean;
  };

  const attributionsToLicenseOptions = useCallback(
    (
      attributions: Attributions,
      removeUnrelated: boolean,
      group: string,
    ): Array<LicenseOption> => {
      return sortBy(
        Object.entries(
          groupBy(attributions, (attribution) =>
            removeUnrelated && attribution.relation === 'unrelated'
              ? ''
              : attribution.licenseName,
          ),
        )
          .filter(
            ([licenseName]) =>
              !(licenseName === 'undefined' || licenseName === ''),
          )
          .map<LicenseOption>(([attributeValue, attributions]) => ({
            shortName: attributeValue,
            fullName: undefined,
            attributionCount: attributions.length,
            group,
            replaceAll: true,
          })),
        ({ attributionCount }) => -(attributionCount ?? 0),
      );
    },
    [],
  );

  const licenseOptions = useMemo<Array<LicenseOption>>(
    () => [
      ...frequentLicensesNames.map((license) => ({
        fullName: license.fullName,
        shortName: license.shortName,
        group: text.attributionColumn.commonLicenses,
        searchString: `${license.shortName} ${license.fullName}`,
        replaceAll: false,
      })),
      ...attributionsToLicenseOptions(
        attributions ?? {},
        true,
        text.attributionColumn.fromAttributions,
      ),
      ...attributionsToLicenseOptions(
        signals ?? {},
        false,
        text.attributionColumn.fromSignals,
      ),
    ],
    [
      frequentLicensesNames,
      attributionsToLicenseOptions,
      attributions,
      signals,
    ],
  );

  const defaultLicenseText = packageInfo.licenseText
    ? undefined
    : frequentLicenseTexts[packageInfo.licenseName || ''];

  function filterOptions(
    options: Array<LicenseOption>,
    inputValue: string,
  ): Array<LicenseOption> {
    const [beforeLast, lastWord] = splitAtLastWord(inputValue);
    const hasExpressionBeforeLastWord = ['AND', 'OR'].includes(
      splitAtLastWord(beforeLast.trim())[1],
    );
    return options.filter((option) =>
      option.replaceAll
        ? option.shortName.toUpperCase().includes(inputValue.toUpperCase())
        : hasExpressionBeforeLastWord || beforeLast === ''
          ? `${option.shortName} ${option.fullName}`
              .toUpperCase()
              .includes(lastWord.toUpperCase())
          : false,
    );
  }
  return hidden ? null : (
    <MuiBox>
      <MuiBox display={'flex'} alignItems={'center'} gap={'8px'}>
        <Autocomplete<LicenseOption, false, true, true>
          options={licenseOptions}
          title={text.attributionColumn.licenseExpression}
          readOnly={!onEdit}
          highlighting={
            showHighlight && !packageInfo.licenseName ? 'warning' : undefined
          }
          inputValue={packageInfo.licenseName ?? ''}
          getOptionLabel={(option) =>
            typeof option === 'string'
              ? option
              : `${splitAtLastWord(packageInfo.licenseName ?? '')[0]}${option.shortName}`
          }
          getOptionKey={(option) =>
            typeof option === 'string'
              ? option
              : option.group + option.shortName
          }
          renderOptionStartIcon={(option) =>
            renderOccuranceCount(option.attributionCount)
          }
          filterOptions={(options, state) =>
            filterOptions(options, state.inputValue)
          }
          groupBy={(option) => option.group}
          groupProps={{ icon: () => <SourceIcon noTooltip /> }}
          optionText={{
            primary: (option) =>
              typeof option === 'string'
                ? option
                : option.replaceAll ||
                    splitAtLastWord(packageInfo.licenseName ?? '')[0] === ''
                  ? option.shortName
                  : `... ${option.shortName}`,
            secondary: (option) =>
              typeof option === 'string' ? null : option.fullName,
          }}
          onChange={(_, value) =>
            typeof value !== 'string' &&
            onEdit?.(() => {
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  licenseName: value.replaceAll
                    ? value.shortName
                    : `${splitAtLastWord(packageInfo.licenseName ?? '')[0]}${value.shortName}`,
                  licenseText: '',
                  wasPreferred: undefined,
                }),
              );
            })
          }
          onInputChange={(event, value) =>
            event &&
            value.startsWith(packageInfo.licenseText ?? '') &&
            onEdit?.(() => {
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  licenseName: value,
                  wasPreferred: undefined,
                }),
              );
            })
          }
          inputProps={{
            color: config?.licenseName?.color,
            focused: config?.licenseName?.focused,
          }}
          endAdornment={config?.licenseName?.endIcon}
          autoHighlight
          disableClearable
          freeSolo
        />
        {!expanded && (
          <ToggleButton
            value={'license-text'}
            selected={showLicenseText}
            onChange={() => setShowLicenseText((prev) => !prev)}
            size={'small'}
            aria-label="license-text-toggle-button"
          >
            <Badge
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              color={'info'}
              variant={'dot'}
              invisible={!packageInfo.licenseText}
            >
              <NotesIcon />
            </Badge>
          </ToggleButton>
        )}
      </MuiBox>
      {(showLicenseText || expanded) && (
        <TextBox
          readOnly={!onEdit}
          placeholder={defaultLicenseText}
          sx={classes.licenseText}
          maxRows={8}
          minRows={3}
          color={config?.licenseText?.color}
          focused={config?.licenseText?.focused}
          multiline
          expanded={expanded}
          title={
            defaultLicenseText
              ? text.attributionColumn.licenseTextDefault
              : text.attributionColumn.licenseText
          }
          text={packageInfo.licenseText}
          handleChange={({ target: { value } }) =>
            onEdit?.(() =>
              dispatch(
                setTemporaryDisplayPackageInfo({
                  ...packageInfo,
                  licenseText: value,
                  wasPreferred: undefined,
                }),
              ),
            )
          }
          endIcon={config?.licenseText?.endIcon}
        />
      )}
    </MuiBox>
  );
}
