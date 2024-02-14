// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import { compact, uniq } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { ROOT_PATH } from '../../shared-constants';
import {
  clickableIcon,
  disabledIcon,
  OpossumColors,
} from '../../shared-styles';
import { setSelectedResourceIdOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { setExpandedIds } from '../../state/actions/resource-actions/audit-view-simple-actions';
import { getParents } from '../../state/helpers/get-parents';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getExpandedIds,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { usePrevious } from '../../util/use-previous';
import { GoToLinkButton } from '../GoToLinkButton/GoToLinkButton';
import { IconButton } from '../IconButton/IconButton';

const classes = {
  root: {
    zIndex: 4,
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    minHeight: '24px',
    gap: '8px',
    background: OpossumColors.white,
  },
};

export function PathBar() {
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const expandedIds = useAppSelector(getExpandedIds);
  const dispatch = useAppDispatch();
  const [history, setHistory] = useState({
    stack: [selectedResourceId],
    activeIndex: 0,
  });
  const activeResourceId = history.stack[history.activeIndex] as
    | string
    | undefined;
  const previousActiveResourceId = usePrevious(activeResourceId);
  const isGoBackEnabled = !!history.activeIndex;
  const isGoForwardEnabled = history.activeIndex !== history.stack.length - 1;

  const pathElements = compact(selectedResourceId.split('/'));

  const cmdOrCtrl = useMemo(
    () => (window.navigator.platform.match(/^Mac/) ? '⌘' : 'Ctrl'),
    [],
  );

  const handleGoBack = useCallback(() => {
    if (history.activeIndex > 0) {
      setHistory((prev) => ({ ...prev, activeIndex: prev.activeIndex - 1 }));
      dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup(
          history.stack[history.activeIndex - 1],
        ),
      );
    }
  }, [dispatch, history.activeIndex, history.stack]);

  const handleGoForward = useCallback(() => {
    if (history.activeIndex < history.stack.length - 1) {
      setHistory((prev) => ({ ...prev, activeIndex: prev.activeIndex + 1 }));
      dispatch(
        setSelectedResourceIdOrOpenUnsavedPopup(
          history.stack[history.activeIndex + 1],
        ),
      );
    }
  }, [dispatch, history.activeIndex, history.stack]);

  useHotkeys('mod+ArrowLeft', handleGoBack, { enabled: isGoBackEnabled }, [
    history.activeIndex,
    history,
  ]);

  useHotkeys(
    'mod+ArrowRight',
    handleGoForward,
    { enabled: isGoForwardEnabled },
    [history.activeIndex, history],
  );

  useEffect(() => {
    if (selectedResourceId && activeResourceId !== selectedResourceId) {
      setHistory((prev) => ({
        stack: prev.stack
          .slice(0, prev.activeIndex + 1)
          .concat(selectedResourceId),
        activeIndex: prev.activeIndex + 1,
      }));
    }
  }, [activeResourceId, selectedResourceId]);

  useEffect(() => {
    if (
      activeResourceId !== previousActiveResourceId &&
      activeResourceId &&
      !expandedIds.includes(activeResourceId)
    ) {
      dispatch(
        setExpandedIds(
          uniq([
            ...expandedIds,
            ...getParents(activeResourceId),
            activeResourceId,
          ]),
        ),
      );
    }
  }, [activeResourceId, dispatch, expandedIds, previousActiveResourceId]);

  return (
    <Paper square elevation={3} aria-label={'path bar'} sx={classes.root}>
      {renderActions()}
      {renderBreadcrumbs()}
    </Paper>
  );

  function renderActions() {
    return (
      <div>
        <IconButton
          icon={
            <ArrowBackIcon
              aria-label={'go back'}
              sx={isGoBackEnabled ? clickableIcon : disabledIcon}
            />
          }
          onClick={handleGoBack}
          tooltipPlacement={'left'}
          tooltipTitle={`Go back (${cmdOrCtrl} + Left arrow)`}
          disabled={!isGoBackEnabled}
        />
        <IconButton
          icon={
            <ArrowForwardIcon
              aria-label={'go forward'}
              sx={isGoForwardEnabled ? clickableIcon : disabledIcon}
            />
          }
          onClick={handleGoForward}
          tooltipPlacement={'left'}
          tooltipTitle={`Go forward (${cmdOrCtrl} + Right arrow)`}
          disabled={!isGoForwardEnabled}
        />
        <IconButton
          icon={
            <ContentCopyIcon
              aria-label={'copy path'}
              sx={pathElements.length ? clickableIcon : disabledIcon}
            />
          }
          onClick={() => navigator.clipboard.writeText(pathElements.join('/'))}
          tooltipPlacement={'left'}
          tooltipTitle={'Copy path to clipboard'}
          aria-label={'copy path'}
          disabled={!pathElements.length}
        />
        <GoToLinkButton />
      </div>
    );
  }

  function renderBreadcrumbs() {
    const getResourceId = (element: string) => {
      const elements = selectedResourceId.split('/');
      return elements
        .slice(0, elements.indexOf(element) + 1)
        .concat('')
        .join('/');
    };

    return (
      <MuiBreadcrumbs maxItems={10} itemsAfterCollapse={8}>
        {[ROOT_PATH, ...pathElements].map((element, index) => (
          <Chip
            size={'small'}
            key={element}
            variant={'filled'}
            onClick={
              pathElements.length !== index
                ? () => {
                    dispatch(
                      setSelectedResourceIdOrOpenUnsavedPopup(
                        element === ROOT_PATH
                          ? element
                          : getResourceId(element),
                      ),
                    );
                  }
                : undefined
            }
            clickable={pathElements.length !== index}
            label={element === ROOT_PATH ? 'Home' : element}
            icon={
              element === ROOT_PATH ? <HomeIcon fontSize="small" /> : undefined
            }
          />
        ))}
      </MuiBreadcrumbs>
    );
  }
}
