// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiListItemButton from '@mui/material/ListItemButton';
import MuiListItemText from '@mui/material/ListItemText';
import MuiPaper from '@mui/material/Paper';
import MuiTypography from '@mui/material/Typography';
import {
  AutocompleteFreeSoloValueMapping,
  UseAutocompleteRenderedOption,
} from '@mui/material/useAutocomplete';
import { SxProps } from '@mui/system';
import { groupBy as _groupBy } from 'lodash';
import { forwardRef, useMemo, useState } from 'react';
import { GroupedVirtuoso, Virtuoso, VirtuosoHandle } from 'react-virtuoso';

import { GroupContainer, styles } from './Listbox.style';

export type ListboxProps<
  Value,
  FreeSolo extends boolean | undefined,
> = React.HTMLAttributes<HTMLElement> & {
  virtuosoRef: React.RefObject<VirtuosoHandle>;
  options: Array<Value>;
  groupProps?: {
    icon?: React.FC<{ name: string }>;
    action?: React.FC<{ name: string }>;
  };
  closePopper: () => void;
  groupBy?: (option: Value) => string;
  getOptionKey?: (
    option: Value | AutocompleteFreeSoloValueMapping<FreeSolo>,
  ) => string;
  getOptionProps: (
    renderedOption: UseAutocompleteRenderedOption<Value>,
  ) => React.HTMLAttributes<HTMLElement> & React.Attributes;
  renderOptionStartIcon?: (
    option: Value,
    { closePopper }: { closePopper: () => void },
  ) => React.ReactNode;
  renderOptionEndIcon?: (
    option: Value,
    { closePopper }: { closePopper: () => void },
  ) => React.ReactNode;
  optionText: {
    sx?: SxProps;
    primary: (
      option: Value | AutocompleteFreeSoloValueMapping<FreeSolo>,
    ) => React.ReactNode;
    secondary?: (
      option: Value | AutocompleteFreeSoloValueMapping<FreeSolo>,
    ) => React.ReactNode;
  };
};

interface Groups<Value> {
  options: Array<Value>;
  groupNames: Array<string>;
  groupCounts: Array<number>;
  firstSelectedIndex: number;
}

export const Listbox = forwardRef(
  <Value, FreeSolo extends boolean | undefined>(
    {
      virtuosoRef,
      closePopper,
      getOptionKey,
      getOptionProps,
      groupBy,
      groupProps,
      optionText,
      options,
      renderOptionEndIcon,
      renderOptionStartIcon,
      ...listboxProps
    }: ListboxProps<Value, FreeSolo>,
    forwardedRef: React.ForwardedRef<HTMLDivElement>,
  ) => {
    const [height, setHeight] = useState<number>(Number.MAX_SAFE_INTEGER); // will result in max-height

    const groups = useMemo((): Groups<Value> | undefined => {
      if (!groupBy) {
        return undefined;
      }

      const grouped = _groupBy(options, groupBy);
      const flattened = Object.values(grouped).flat();

      return {
        options: flattened,
        groupNames: Object.keys(grouped),
        groupCounts: Object.values(grouped).map((group) => group.length),
        firstSelectedIndex: flattened.findIndex(
          (option, index) =>
            !!getOptionProps({ option, index })['aria-selected'],
        ),
      };
    }, [getOptionProps, groupBy, options]);

    return (
      <MuiPaper
        {...listboxProps}
        ref={forwardedRef}
        elevation={4}
        square
        role={'listbox'}
      >
        {groups ? renderGroupedList(groups) : renderList(options)}
      </MuiPaper>
    );

    function renderGroupedList({
      groupCounts,
      groupNames,
      options,
      firstSelectedIndex,
    }: Groups<Value>) {
      return (
        <GroupedVirtuoso
          ref={virtuosoRef}
          style={{ ...styles.virtuoso, height }}
          increaseViewportBy={20}
          initialTopMostItemIndex={
            ~firstSelectedIndex && {
              index: firstSelectedIndex,
              align: 'center',
            }
          }
          totalListHeightChanged={setHeight}
          groupCounts={groupCounts}
          groupContent={(index) => {
            const IconComp = groupProps?.icon || (() => null);
            const ActionComp = groupProps?.action || (() => null);

            return (
              <GroupContainer role={'group'}>
                <IconComp name={groupNames[index]} />
                <MuiTypography
                  sx={{ ...styles.overflowEllipsis, paddingTop: '2px' }}
                >
                  {groupNames[index]}
                </MuiTypography>
                <ActionComp name={groupNames[index]} />
              </GroupContainer>
            );
          }}
          itemContent={(index) =>
            renderOption({ index, option: options[index] })
          }
        />
      );
    }

    function renderList(options: Array<Value>) {
      return (
        <Virtuoso
          ref={virtuosoRef}
          style={{
            ...styles.virtuoso,
            height,
          }}
          data={options}
          itemContent={(index, option) => renderOption({ option, index })}
          increaseViewportBy={20}
          totalListHeightChanged={setHeight}
        />
      );
    }

    function renderOption({
      index,
      option,
    }: UseAutocompleteRenderedOption<Value>) {
      const { key, ...optionProps } = getOptionProps({
        option,
        index,
      });

      return (
        <MuiListItemButton
          {...optionProps}
          selected={optionProps['aria-selected'] as boolean}
          disabled={optionProps['aria-disabled'] as boolean}
          key={getOptionKey?.(option) ?? key}
          sx={{ gap: '12px', ...optionText.sx }}
          dense
        >
          {renderOptionStartIcon?.(option, { closePopper })}
          <MuiListItemText
            primary={optionText.primary(option)}
            primaryTypographyProps={{
              sx: { ...styles.overflowEllipsis },
            }}
            secondary={optionText.secondary?.(option)}
            secondaryTypographyProps={{
              variant: 'caption',
              sx: styles.overflowEllipsis,
            }}
          />
          {renderOptionEndIcon?.(option, { closePopper })}
        </MuiListItemButton>
      );
    }
  },
);
