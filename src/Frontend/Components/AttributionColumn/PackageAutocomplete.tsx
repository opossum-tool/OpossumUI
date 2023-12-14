// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import AddIcon from '@mui/icons-material/Add';
import ExploreIcon from '@mui/icons-material/Explore';
import StarIcon from '@mui/icons-material/Star';
import { styled } from '@mui/material';
import MuiBadge from '@mui/material/Badge';
import MuiChip from '@mui/material/Chip';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { compact } from 'lodash';
import { useMemo } from 'react';

import { AutocompleteSignal, PackageInfo } from '../../../shared/shared-types';
import { text } from '../../../shared/text';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { setTemporaryDisplayPackageInfo } from '../../state/actions/resource-actions/all-views-simple-actions';
import { savePackageInfo } from '../../state/actions/resource-actions/save-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getAttributionIdOfDisplayedPackageInManualPanel,
  getExternalAttributionSources,
  getTemporaryDisplayPackageInfo,
} from '../../state/selectors/all-views-resource-selectors';
import { getSelectedResourceId } from '../../state/selectors/audit-view-resource-selectors';
import { isAuditViewSelected } from '../../state/selectors/view-selector';
import { generatePurl } from '../../util/handle-purl';
import { isImportantAttributionInformationMissing } from '../../util/is-important-attribution-information-missing';
import { maybePluralize } from '../../util/maybe-pluralize';
import { PackageSearchHooks } from '../../util/package-search-hooks';
import { useAutocompleteSignals } from '../../web-workers/use-signals-worker';
import { Autocomplete } from '../Autocomplete/Autocomplete';

type AutocompleteAttribute = Extract<
  keyof PackageInfo,
  | 'packageType'
  | 'packageNamespace'
  | 'packageName'
  | 'packageVersion'
  | 'url'
  | 'licenseName'
>;

interface Props {
  title: string;
  attribute: AutocompleteAttribute;
  highlight?: 'default' | 'dark';
  endAdornment?: React.ReactElement;
  defaults?: Array<AutocompleteSignal>;
  disabled: boolean;
  showHighlight: boolean | undefined;
}

const Badge = styled(MuiBadge)({
  '& .MuiBadge-badge': {
    top: '1px',
    right: '14px',
    zIndex: 0,
  },
});

export function PackageAutocomplete({
  attribute,
  title,
  highlight,
  endAdornment,
  defaults = [],
  disabled,
  showHighlight,
}: Props) {
  const dispatch = useAppDispatch();
  const temporaryPackageInfo = useAppSelector(getTemporaryDisplayPackageInfo);
  const resourceId = useAppSelector(getSelectedResourceId);
  const attributionIdOfSelectedPackageInManualPanel = useAppSelector(
    getAttributionIdOfDisplayedPackageInManualPanel,
  );
  const sources = useAppSelector(getExternalAttributionSources);
  const isAuditView = useAppSelector(isAuditViewSelected);

  const { getPackageVersion } = PackageSearchHooks.usePackageVersion();

  const autocompleteSignals = useAutocompleteSignals();
  const filteredSignals = useMemo(
    () =>
      isAuditView
        ? autocompleteSignals
            .filter((signal) => !['', undefined].includes(signal[attribute]))
            .concat(defaults)
        : defaults,
    [isAuditView, autocompleteSignals, defaults, attribute],
  );

  return (
    <Autocomplete
      title={title}
      disabled={disabled}
      autoHighlight
      disableClearable
      freeSolo
      highlight={
        showHighlight &&
        isImportantAttributionInformationMissing(
          attribute,
          temporaryPackageInfo,
        )
          ? highlight
          : undefined
      }
      options={filteredSignals}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option[attribute] || ''
      }
      getOptionKey={(option) =>
        typeof option === 'string'
          ? option
          : compact([
              option.copyright,
              option.licenseName,
              option[attribute],
              generatePurl(option),
            ]).join()
      }
      renderOptionStartIcon={renderOptionStartIcon}
      renderOptionEndIcon={renderOptionEndIcon}
      value={temporaryPackageInfo}
      isOptionEqualToValue={(option, value) =>
        option[attribute] === value[attribute]
      }
      groupBy={(option) =>
        option.source
          ? sources[option.source.name]?.name || option.source.name
          : text.attributionColumn.manualAttributions
      }
      groupIcon={
        <ExploreIcon
          sx={{
            ...baseIcon,
            color: `${OpossumColors.black} !important`,
          }}
        />
      }
      optionText={{
        primary: (option) => {
          if (typeof option === 'string') {
            return option;
          }

          const optionValue = option[attribute];

          if (!optionValue) {
            return '';
          }

          return `${optionValue} ${option.suffix || ''}`.trim();
        },
        secondary: (option) =>
          typeof option === 'string' ? option : generatePurl(option),
      }}
      onInputChange={(_, value) => {
        temporaryPackageInfo[attribute] !== value &&
          dispatch(
            setTemporaryDisplayPackageInfo({
              ...temporaryPackageInfo,
              [attribute]: value,
            }),
          );
      }}
      endAdornment={endAdornment}
    />
  );

  function renderOptionStartIcon(option: AutocompleteSignal) {
    if (!option.count) {
      return null;
    }

    const showStar = option.preferred || option.wasPreferred;
    const baseTitle = `${maybePluralize(
      option.count,
      text.attributionColumn.occurrence,
    )} ${text.attributionColumn.amongSignals}`;

    return (
      <MuiTooltip
        title={
          showStar
            ? `${baseTitle} (${
                option.preferred
                  ? text.auditingOptions.currentlyPreferred
                  : text.auditingOptions.previouslyPreferred
              })`
            : baseTitle
        }
      >
        <Badge
          badgeContent={
            showStar && (
              <StarIcon
                sx={{
                  ...baseIcon,
                  color: option.preferred
                    ? OpossumColors.mediumOrange
                    : OpossumColors.mediumGrey,
                }}
              />
            )
          }
        >
          <MuiChip
            label={option.count}
            size={'small'}
            sx={{ marginRight: '12px' }}
          />
        </Badge>
      </MuiTooltip>
    );
  }

  function renderOptionEndIcon(
    option: AutocompleteSignal,
    { closePopper }: { closePopper: () => void },
  ) {
    if (!option.packageName || !option.packageType) {
      return null;
    }

    return (
      <MuiTooltip
        title={text.attributionColumn.useAutocompleteSuggestion}
        disableInteractive
      >
        <MuiIconButton
          onClick={async (event) => {
            event.stopPropagation();
            const packageVersion =
              !option.url || !option.licenseName
                ? await getPackageVersion(option)
                : undefined;
            dispatch(
              savePackageInfo(
                resourceId,
                attributionIdOfSelectedPackageInManualPanel,
                {
                  ...option,
                  url: option.url || packageVersion?.url,
                  licenseName: option.licenseName || packageVersion?.license,
                },
                undefined,
                true,
              ),
            );
            closePopper();
          }}
          size={'small'}
        >
          <AddIcon fontSize={'inherit'} color={'primary'} />
        </MuiIconButton>
      </MuiTooltip>
    );
  }
}
