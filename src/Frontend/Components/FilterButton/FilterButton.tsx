// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfied from '@mui/icons-material/SentimentSatisfied';
import type { SxProps } from '@mui/material';
import MuiBadge from '@mui/material/Badge';
import MuiTooltip from '@mui/material/Tooltip';
import { type CSSProperties, useCallback, useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import type { Filter } from '../../shared-constants';
import { baseIcon, OpossumColors } from '../../shared-styles';
import type { UseAttributionFilters } from '../../state/variables/use-filters';
import {
  type FilterPropsMode,
  useFilterProperties,
} from '../../util/use-filter-properties';
import {
  ExcludeFromNoticeIcon,
  FirstPartyIcon,
  FollowUpIcon,
  IncompleteIcon,
  ModifiedPreferredIcon,
  NeedsReviewIcon,
  PreferredIcon,
  PreSelectedIcon,
  WasPreferredIcon,
} from '../Icons/Icons';
import {
  SelectMenu,
  type SelectMenuOption,
  type SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { ClearMenuIcon, IconButton } from './FilterButton.style';
import { LicenseAutocomplete } from './LicenseAutocomplete/LicenseAutocomplete';

const FILTER_ICONS: Record<Filter, React.ReactElement<unknown>> = {
  [text.filters.currentlyPreferred]: <PreferredIcon noTooltip />,
  [text.filters.excludedFromNotice]: <ExcludeFromNoticeIcon noTooltip />,
  [text.filters.notExcludedFromNotice]: <ExcludeFromNoticeIcon noTooltip />,
  [text.filters.firstParty]: <FirstPartyIcon noTooltip />,
  [text.filters.incompleteCoordinates]: <IncompleteIcon noTooltip />,
  [text.filters.incompleteLegal]: <IncompleteIcon noTooltip />,
  [text.filters.lowConfidence]: (
    <SentimentDissatisfiedIcon color={'error'} sx={baseIcon} />
  ),
  [text.filters.highConfidence]: (
    <SentimentSatisfied color={'success'} sx={baseIcon} />
  ),
  [text.filters.needsFollowUp]: <FollowUpIcon noTooltip />,
  [text.filters.needsReview]: <NeedsReviewIcon noTooltip />,
  [text.filters.preSelected]: <PreSelectedIcon noTooltip />,
  [text.filters.notPreSelected]: <PreSelectedIcon noTooltip />,
  [text.filters.previouslyPreferred]: <WasPreferredIcon noTooltip />,
  [text.filters.thirdParty]: (
    <Filter3Icon sx={{ ...baseIcon, color: OpossumColors.darkBlue }} />
  ),
  [text.filters.modifiedPreferred]: <ModifiedPreferredIcon noTooltip />,
};

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  useFilteredData: UseAttributionFilters;
  availableFilters: Array<Filter>;
  disabled?: boolean;
  emptyAttributions?: boolean;
  activeIconSx?: SxProps;
  activeBadgeStyle?: CSSProperties;
  iconSx?: SxProps;
  mode: FilterPropsMode;
}

export const FilterButton: React.FC<Props> = ({
  anchorArrow,
  anchorPosition,
  availableFilters,
  useFilteredData,
  disabled,
  emptyAttributions,
  activeIconSx,
  activeBadgeStyle,
  iconSx,
  mode,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [{ filters, selectedLicense }, setFilteredAttributions] =
    useFilteredData();
  const isSomeFilterActive = !!filters.length || !!selectedLicense;

  const clearFilters = useCallback(() => {
    setFilteredAttributions((prev) => ({
      ...prev,
      filters: [],
      selectedLicense: '',
    }));
  }, [setFilteredAttributions]);

  const { filterProps } = useFilterProperties({ mode, enabled: !!anchorEl });

  const filterOptions = useMemo(
    () =>
      availableFilters
        .map<SelectMenuOption>((option) => ({
          selected: filters.includes(option),
          faded: !filterProps?.[option],
          id: option,
          label:
            filterProps?.[option] !== undefined
              ? `${option} (${new Intl.NumberFormat().format(filterProps[option] ?? 0)})`
              : option,
          icon: FILTER_ICONS[option],
          onAdd: () =>
            setFilteredAttributions((prev) => ({
              ...prev,
              filters: [...prev.filters, option],
            })),
          onDelete: () =>
            setFilteredAttributions((prev) => ({
              ...prev,
              filters: prev.filters.filter((filter) => filter !== option),
            })),
        }))
        .concat({
          selected: false,
          id: 'license',
          label: (
            <LicenseAutocomplete
              licenses={filterProps?.licenses ?? []}
              selectedLicense={selectedLicense}
              setSelectedLicense={(license) =>
                setFilteredAttributions((prev) => ({
                  ...prev,
                  selectedLicense: license || '',
                }))
              }
            />
          ),
        })
        .concat(
          isSomeFilterActive
            ? {
                selected: false,
                id: 'clear-filters',
                label: text.packageLists.clearFilters,
                icon: <ClearMenuIcon />,
                onAdd: () => clearFilters(),
              }
            : [],
        ),
    [
      availableFilters,
      clearFilters,
      isSomeFilterActive,
      selectedLicense,
      filters,
      filterProps,
      setFilteredAttributions,
    ],
  );

  return (
    <>
      <IconButton
        aria-label={'filter button'}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={disabled || (emptyAttributions && !isSomeFilterActive)}
        size={'small'}
        color={iconSx ? undefined : isSomeFilterActive ? 'primary' : undefined}
      >
        <MuiBadge
          color={'primary'}
          variant={'dot'}
          invisible={!isSomeFilterActive}
          anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
          slotProps={{
            badge: {
              style: {
                minWidth: '8px',
                width: '8px',
                height: '8px',
                top: '4px',
                right: '4px',
                ...activeBadgeStyle,
              },
            },
          }}
        >
          <MuiTooltip
            title={text.buttons.filter}
            disableInteractive
            placement={'top'}
          >
            <FilterAltIcon
              sx={isSomeFilterActive ? (activeIconSx ?? iconSx) : iconSx}
            />
          </MuiTooltip>
        </MuiBadge>
      </IconButton>
      <SelectMenu
        anchorArrow={anchorArrow}
        anchorEl={anchorEl}
        anchorPosition={anchorPosition}
        multiple
        options={filterOptions}
        setAnchorEl={setAnchorEl}
        width={336}
      />
    </>
  );
};
