// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import Filter3Icon from '@mui/icons-material/Filter3';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';
import SentimentSatisfied from '@mui/icons-material/SentimentSatisfied';
import MuiBadge from '@mui/material/Badge';
import MuiTooltip from '@mui/material/Tooltip';
import { useMemo, useState } from 'react';

import { text } from '../../../shared/text';
import { Filter } from '../../shared-constants';
import { baseIcon, OpossumColors } from '../../shared-styles';
import { UseFilteredData } from '../../state/variables/use-filtered-data';
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
  SelectMenuOption,
  SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { ClearButton, IconButton } from './FilterButton.style';
import { LicenseAutocomplete } from './LicenseAutocomplete/LicenseAutocomplete';

const FILTER_ICONS: Record<Filter, React.ReactElement> = {
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
  [text.filters.modifiedPreviouslyPreferred]: (
    <ModifiedPreferredIcon noTooltip />
  ),
  [text.filters.needsFollowUp]: <FollowUpIcon noTooltip />,
  [text.filters.needsReview]: <NeedsReviewIcon noTooltip />,
  [text.filters.preSelected]: <PreSelectedIcon noTooltip />,
  [text.filters.notPreSelected]: <PreSelectedIcon noTooltip />,
  [text.filters.previouslyPreferred]: <WasPreferredIcon noTooltip />,
  [text.filters.thirdParty]: (
    <Filter3Icon sx={{ ...baseIcon, color: OpossumColors.darkBlue }} />
  ),
};

interface Props
  extends Pick<SelectMenuProps, 'anchorArrow' | 'anchorPosition'> {
  useFilteredData: UseFilteredData;
  availableFilters: Array<Filter>;
}

export const FilterButton: React.FC<Props> = ({
  anchorArrow,
  anchorPosition,
  availableFilters,
  useFilteredData,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const [isClearHovered, setIsClearHovered] = useState(false);
  const [
    { attributions, filters, counts, selectedLicense },
    setFilteredAttributions,
  ] = useFilteredData();
  const isSomeFilterActive = !!filters.length || !!selectedLicense;

  const filterOptions = useMemo(
    () =>
      availableFilters
        .map<SelectMenuOption>((option) => ({
          selected: filters.includes(option),
          faded: !counts?.[option],
          id: option,
          label:
            counts?.[option] !== undefined
              ? `${option} (${new Intl.NumberFormat().format(counts[option] ?? 0)})`
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
              attributions={attributions}
              selectedLicense={selectedLicense}
              setSelectedLicense={(license) =>
                setFilteredAttributions((prev) => ({
                  ...prev,
                  selectedLicense: license || '',
                }))
              }
            />
          ),
        }),
    [
      availableFilters,
      attributions,
      selectedLicense,
      filters,
      counts,
      setFilteredAttributions,
    ],
  );

  return (
    <>
      <IconButton
        aria-label={'filter button'}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        disabled={
          !attributions ||
          (!Object.keys(attributions).length && !isSomeFilterActive)
        }
        isClearHovered={isClearHovered}
        size={'small'}
        color={isSomeFilterActive ? 'primary' : undefined}
      >
        <MuiBadge
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          invisible={!isSomeFilterActive}
          componentsProps={{
            badge: {
              style: {
                padding: 0,
                minWidth: 'unset',
                width: 'fit-content',
                height: 'fit-content',
              },
            },
          }}
          badgeContent={renderClearButton()}
        >
          <MuiTooltip
            title={text.buttons.filter}
            disableInteractive
            placement={'top'}
          >
            <FilterAltIcon />
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

  function renderClearButton() {
    return (
      <MuiTooltip
        title={text.packageLists.clearFilters}
        disableInteractive
        placement={'top'}
        enterDelay={500}
        enterNextDelay={500}
      >
        <ClearButton
          color={'error'}
          fontSize={'inherit'}
          onMouseEnter={() => setIsClearHovered(true)}
          onMouseLeave={() => setIsClearHovered(false)}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            setFilteredAttributions((prev) => ({
              ...prev,
              filters: [],
              selectedLicense: '',
            }));
          }}
        />
      </MuiTooltip>
    );
  }
};
