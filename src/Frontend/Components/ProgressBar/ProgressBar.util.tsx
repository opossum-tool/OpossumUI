// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiBox from '@mui/system/Box';
import { CSSProperties } from 'react';

import { criticalityColor, OpossumColors } from '../../shared-styles';
import { navigateToSelectedPathOrOpenUnsavedPopup } from '../../state/actions/popup-actions/popup-actions';
import { useAppDispatch, useAppSelector } from '../../state/hooks';
import {
  getResourceIds,
  getSelectedResourceId,
} from '../../state/selectors/resource-selectors';
import { ProgressBarData } from '../../types/types';
import { moveElementsToEnd } from '../../util/lodash-extension-utils';

export function useOnProgressBarClick(resourceIds: Array<string>) {
  const dispatch = useAppDispatch();
  const selectedResourceId = useAppSelector(getSelectedResourceId);
  const allResourceIds = useAppSelector(getResourceIds);

  return () => {
    if (!resourceIds?.length || !allResourceIds?.length) {
      return;
    }

    dispatch(
      navigateToSelectedPathOrOpenUnsavedPopup(
        moveElementsToEnd(
          allResourceIds,
          allResourceIds.indexOf(selectedResourceId) + 1,
        ).find((resourceId) => resourceIds.includes(resourceId)) ||
          resourceIds[0],
      ),
    );
  };
}

const classes = {
  tooltip: {
    flex: 1,
    background: 'rgba(97, 97, 97, 0.92)',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'Karla Variable, sans-serif',
    padding: 4,
    fontSize: 10,
    margin: 2,
    fontWeight: 500,
    position: 'relative',
    top: 100,
    'z-index': 100,
  } as CSSProperties,
  div: { display: 'flex', 'align-items': 'center' },
  colorBlock: {
    display: 'block',
    width: 12,
    height: 12,
    marginRight: 7,
    marginTop: 2,
    marginLeft: 2,
    marginBottom: 2,
  },
};

export function getProgressBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  return (
    <MuiBox aria-label={'tooltip'} style={classes.tooltip}>
      Number of resources...
      <div style={classes.div}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.pastelDarkGreen,
          }}
        ></span>
        <span>
          ...with attributions:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithManualAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.div}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.pastelMiddleGreen,
          }}
        ></span>
        <span>
          …with only pre-selected attributions:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithOnlyPreSelectedAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.div}>
        <span
          style={{ ...classes.colorBlock, background: OpossumColors.pastelRed }}
        ></span>
        <span>
          …with only signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithOnlyExternalAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.div}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.lightestBlue,
          }}
        ></span>
        <span>
          …without any signal or attribution:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.fileCount -
              (progressBarData.filesWithManualAttributionCount +
                progressBarData.filesWithOnlyPreSelectedAttributionCount +
                progressBarData.filesWithOnlyExternalAttributionCount),
          )}
        </span>
      </div>
    </MuiBox>
  );
}

export function getCriticalityBarTooltipText(
  progressBarData: ProgressBarData,
): React.ReactNode {
  const filesWithNonCriticalExternalAttributions =
    progressBarData.filesWithOnlyExternalAttributionCount -
    progressBarData.filesWithHighlyCriticalExternalAttributionsCount -
    progressBarData.filesWithMediumCriticalExternalAttributionsCount;
  return (
    <MuiBox aria-label={'tooltip'} style={classes.tooltip}>
      Number of resources with signals and no attributions…
      <div style={classes.div} role="tooltip" aria-label="tooltip">
        <span
          style={{ ...classes.colorBlock, background: criticalityColor.high }}
        ></span>
        <span>
          …containing highly critical signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
          )}{' '}
        </span>
      </div>
      <div style={classes.div}>
        <span
          style={{
            ...classes.colorBlock,
            background: criticalityColor.medium,
          }}
        ></span>
        <span>
          …containing medium critical signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithMediumCriticalExternalAttributionsCount,
          )}{' '}
        </span>
      </div>
      <div style={classes.div}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.lightestBlue,
          }}
        ></span>
        <span>
          …containing only non-critical signals:{' '}
          {new Intl.NumberFormat().format(
            filesWithNonCriticalExternalAttributions,
          )}
        </span>
      </div>
    </MuiBox>
  );
}
