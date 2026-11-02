// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import { Paper, Popper, type SxProps, type Theme } from '@mui/material';
import MuiBadge, { type BadgeProps } from '@mui/material/Badge';
import { useTheme } from '@mui/material/styles';
import MuiTooltip from '@mui/material/Tooltip';
import {
  type CSSProperties,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';

import { text } from '../../../shared/text';
import { Sizing } from '../../shared-styles';
import { MenuContainer } from '../SelectMenu/menu-container';
import {
  type PanelMenuOption,
  renderSelectMenuItems,
  type SelectMenuOption,
  type SelectMenuProps,
} from '../SelectMenu/SelectMenu';
import { ClearMenuIcon, IconButton } from './FilterButton.style';

export type FilterOption =
  | Exclude<SelectMenuOption, PanelMenuOption>
  | (Omit<PanelMenuOption, 'submenu'> & {
      renderPanel: (props: {
        id: string;
        onClose: () => void;
        initialFocusRef: (element: HTMLElement | null) => void;
      }) => React.ReactNode;
    });

interface Props extends Pick<
  SelectMenuProps,
  'anchorArrow' | 'anchorPosition'
> {
  options: Array<FilterOption>;
  isActive: boolean;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  activeIconSx?: SxProps;
  activeBadgeStyle?: CSSProperties;
  badgeColor?: BadgeProps['color'];
  iconSx?: SxProps;
  triggerStyle?: (isActive: boolean) => SxProps<Theme>;
}

export function FilterButton({
  anchorArrow,
  anchorPosition,
  options,
  isActive,
  onClear,
  onOpenChange,
  disabled,
  activeIconSx,
  activeBadgeStyle,
  badgeColor = 'primary',
  iconSx,
  triggerStyle,
}: Props) {
  const theme = useTheme();
  const BADGE_SIZE = theme.spacing(2);
  const BADGE_OFFSET = theme.spacing(1);
  const viewportMargin = parseFloat(theme.spacing(Sizing.Large));
  const [panel, setPanel] = useState<{
    optionId: string;
    anchorEl: HTMLElement;
  }>();
  const focusTargetRef = useRef<HTMLElement | null>(null);
  const initialFocusRef = useCallback((element: HTMLElement | null) => {
    focusTargetRef.current = element;
    element?.focus();
  }, []);
  const submenuId = useId();
  const closePanel = useCallback(() => {
    setPanel(undefined);
    panel?.anchorEl.focus();
  }, [panel]);
  const panelOption = options.find((option) => option.id === panel?.optionId);
  const view =
    panelOption?.kind === 'panel' ? panelOption.renderPanel : undefined;
  const [anchorEl, setAnchorEl] = useState<HTMLElement>();
  const handleSetAnchorEl = (nextAnchorEl: HTMLElement | undefined) => {
    setAnchorEl(nextAnchorEl);
    setPanel(undefined);
    onOpenChange?.(nextAnchorEl !== undefined);
  };
  const menuOptions = useMemo<Array<SelectMenuOption>>(
    () => [
      ...options.map((option) =>
        option.kind === 'panel'
          ? {
              ...option,
              submenu: {
                id: submenuId,
                open: panel?.optionId === option.id,
                onOpen: (anchor: HTMLElement) => {
                  if (panel?.optionId === option.id) {
                    focusTargetRef.current?.focus();
                  } else {
                    setPanel({ optionId: option.id, anchorEl: anchor });
                  }
                },
                onClose: closePanel,
              },
            }
          : option,
      ),
      ...(isActive && onClear
        ? [
            {
              kind: 'toggle' as const,
              id: 'clear-filters',
              selected: false,
              label: text.packageLists.clearFilters,
              icon: <ClearMenuIcon />,
              onAdd: onClear,
            },
          ]
        : []),
    ],
    [isActive, onClear, options, panel, submenuId, closePanel],
  );

  const content = (
    <MuiBadge
      color={badgeColor}
      variant={'dot'}
      invisible={!isActive}
      anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
      slotProps={{
        badge: {
          style: {
            minWidth: BADGE_SIZE,
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            top: BADGE_OFFSET,
            right: BADGE_OFFSET,
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
        <FilterAltIcon sx={isActive ? (activeIconSx ?? iconSx) : iconSx} />
      </MuiTooltip>
    </MuiBadge>
  );

  return (
    <>
      <IconButton
        aria-label={'filter button'}
        onClick={(event) => handleSetAnchorEl(event.currentTarget)}
        disabled={!!disabled}
        size={'small'}
        color={isActive ? 'primary' : undefined}
        sx={triggerStyle?.(isActive)}
      >
        {content}
      </IconButton>
      <MenuContainer
        anchorEl={anchorEl}
        anchorArrow={anchorArrow}
        anchorPosition={anchorPosition}
        onClose={() => handleSetAnchorEl(undefined)}
        width="336px"
        adjacentContent={
          <Popper
            // Reserve the maximum height for positioning so resizing the visible
            // panel never moves its tabs and search field.
            sx={{
              height: `min(480px, calc(100vh - ${theme.spacing(2 * Sizing.Large)}))`,
              pointerEvents: 'none',
            }}
            open={!!view && !!panel}
            anchorEl={panel?.anchorEl}
            placement="right-start"
            disablePortal
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [0, parseFloat(theme.spacing(Sizing.Tiny))],
                },
              },
              {
                name: 'flip',
                options: {
                  fallbackPlacements: ['left-start'],
                  padding: viewportMargin,
                  boundary: [],
                  altBoundary: false,
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  padding: viewportMargin,
                  altAxis: true,
                  tether: false,
                  boundary: [],
                  altBoundary: false,
                },
              },
            ]}
          >
            {view && (
              <Paper
                elevation={2}
                sx={{
                  pointerEvents: 'auto',
                  maxHeight: '100%',
                  display: 'flex',
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation();
                    closePanel();
                  }
                }}
              >
                {view({
                  id: submenuId,
                  onClose: closePanel,
                  initialFocusRef,
                })}
              </Paper>
            )}
          </Popper>
        }
      >
        {renderSelectMenuItems({
          multiple: true,
          onOptionActivate: (id) => {
            if (panel && panel.optionId !== id) {
              setPanel(undefined);
            }
          },
          options: menuOptions,
          setAnchorEl: handleSetAnchorEl,
        })}
      </MenuContainer>
    </>
  );
}
