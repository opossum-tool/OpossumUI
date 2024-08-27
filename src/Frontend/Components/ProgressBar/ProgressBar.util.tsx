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
    background: 'rgba(97, 97, 97, 0.92)',
    borderRadius: '4px',
    color: 'white',
    fontFamily: 'Karla Variable, sans-serif',
    padding: 8,
    fontSize: 12,
    margin: 2,
    fontWeight: 500,
    position: 'relative',
    top: '200',
  } as CSSProperties,
  tooltipLine: { display: 'flex', 'align-items': 'center', padding: 4 },
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
      <div style={classes.tooltipLine}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.pastelDarkGreen,
          }}
        />
        <span>
          ...with attributions:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithManualAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.tooltipLine}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.pastelMiddleGreen,
          }}
        />
        <span>
          ...with only pre-selected attributions:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithOnlyPreSelectedAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.tooltipLine}>
        <span
          style={{ ...classes.colorBlock, background: OpossumColors.pastelRed }}
        />
        <span>
          ...with only signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithOnlyExternalAttributionCount,
          )}
        </span>
      </div>
      <div style={classes.tooltipLine}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.lightestBlue,
          }}
        />
        <span>
          ...without any signal or attribution:{' '}
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
      Number of resources with signals and no attributions...
      <div style={classes.tooltipLine} role="tooltip" aria-label="tooltip">
        <span
          style={{ ...classes.colorBlock, background: criticalityColor.high }}
        />
        <span>
          ...containing highly critical signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithHighlyCriticalExternalAttributionsCount,
          )}
        </span>
      </div>
      <div style={classes.tooltipLine}>
        <span
          style={{
            ...classes.colorBlock,
            background: criticalityColor.medium,
          }}
        />
        <span>
          ...containing medium critical signals:{' '}
          {new Intl.NumberFormat().format(
            progressBarData.filesWithMediumCriticalExternalAttributionsCount,
          )}
        </span>
      </div>
      <div style={classes.tooltipLine}>
        <span
          style={{
            ...classes.colorBlock,
            background: OpossumColors.lightestBlue,
          }}
        />
        <span>
          ...containing only non-critical signals:{' '}
          {new Intl.NumberFormat().format(
            filesWithNonCriticalExternalAttributions,
          )}
        </span>
      </div>
    </MuiBox>
  );
}
