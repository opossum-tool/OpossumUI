// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfied from '@mui/icons-material/SentimentSatisfied';
import MuiBadge, { type BadgeProps } from '@mui/material/Badge';
import MuiIconButton from '@mui/material/IconButton';
import MuiTooltip from '@mui/material/Tooltip';
import { useCallback, useMemo, useState } from 'react';

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
import { ClearMenuIcon } from './FilterButton.style';
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

export interface FilterButtonTriggerProps {
  content: React.ReactElement;
  disabled: boolean;
  isSomeFilterActive: boolean;
  onClick: React.MouseEventHandler<HTMLElement>;
}

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  useFilteredData: UseAttributionFilters;
  availableFilters: Array<Filter>;
  disabled?: boolean;
  emptyAttributions?: boolean;
  badgeColor?: BadgeProps['color'];
  mode: FilterPropsMode;
  renderTrigger?: (props: FilterButtonTriggerProps) => React.ReactNode;
}

export const FilterButton: React.FC<Props> = ({
  anchorArrow,
  anchorPosition,
  availableFilters,
  useFilteredData,
  disabled,
  emptyAttributions,
  badgeColor = 'primary',
  mode,
  renderTrigger,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [{ filters, selectedLicense }, setFilteredAttributions] =
    useFilteredData();
  const isSomeFilterActive = !!filters.length || !!selectedLicense;
  const isDisabled = !!(disabled || (emptyAttributions && !isSomeFilterActive));

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

  const triggerProps: Omit<FilterButtonTriggerProps, 'content'> = {
    disabled: isDisabled,
    isSomeFilterActive,
    onClick: (event) => setAnchorEl(event.currentTarget),
  };

  return (
    <>
      {renderTrigger?.({
        ...triggerProps,
        content: renderFilterButtonContent({ badgeColor, isSomeFilterActive }),
      }) ??
        renderDefaultTrigger({
          ...triggerProps,
          content: renderFilterButtonContent({
            badgeColor,
            isSomeFilterActive,
          }),
        })}
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

function renderDefaultTrigger({
  content,
  disabled,
  isSomeFilterActive,
  onClick,
}: FilterButtonTriggerProps) {
  return (
    <MuiIconButton
      aria-label={'filter button'}
      onClick={onClick}
      disabled={disabled}
      size={'small'}
      color={isSomeFilterActive ? 'primary' : undefined}
    >
      {content}
    </MuiIconButton>
  );
}

function renderFilterButtonContent({
  badgeColor,
  isSomeFilterActive,
}: Pick<FilterButtonTriggerProps, 'isSomeFilterActive'> & {
  badgeColor: BadgeProps['color'];
}) {
  return (
    <MuiBadge
      color={badgeColor}
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
          },
        },
      }}
    >
      <MuiTooltip
        title={text.buttons.filter}
        disableInteractive
        placement={'top'}
      >
        <FilterAltIcon />
      </MuiTooltip>
    </MuiBadge>
  );
}
