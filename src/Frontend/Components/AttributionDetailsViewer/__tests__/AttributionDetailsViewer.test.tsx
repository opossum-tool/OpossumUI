// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';

import {
  Attributions,
  DiscreteConfidence,
  DisplayPackageInfo,
  PackageInfo,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { View } from '../../../enums/enums';
import { setTemporaryDisplayPackageInfo } from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedAttributionId } from '../../../state/actions/resource-actions/attribution-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { navigateToView } from '../../../state/actions/view-actions/view-actions';
import { getManualAttributions } from '../../../state/selectors/all-views-resource-selectors';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { convertPackageInfoToDisplayPackageInfo } from '../../../util/convert-package-info';
import { AttributionDetailsViewer } from '../AttributionDetailsViewer';

describe('The AttributionDetailsViewer', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryDisplayPackageInfo: DisplayPackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      comments: ['some comment'],
      packageName: 'Some package',
      packageVersion: '16.5.0',
      copyright: 'Copyright Doe 2019',
      licenseText: 'Permission is hereby granted',
      attributionIds: [],
    };
    const { store } = renderComponent(<AttributionDetailsViewer />);
    act(() => {
      store.dispatch(setSelectedAttributionId('test_id'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(testTemporaryDisplayPackageInfo),
      );
    });

    expect(
      screen.getByText(text.attributionColumn.packageSubPanel.confidence),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('confidence of 4')).toHaveAttribute(
      'aria-disabled',
      'false',
    );
    expect(screen.getByLabelText('Comment')).toBeInTheDocument();

    testTemporaryDisplayPackageInfo.comments?.forEach((comment) =>
      expect(screen.getByDisplayValue(comment)).toBeInTheDocument(),
    );
    expect(
      screen.getByLabelText(text.attributionColumn.packageSubPanel.packageName),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.packageName as string,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        text.attributionColumn.packageSubPanel.packageVersion,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.packageVersion as string,
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Copyright')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        testTemporaryDisplayPackageInfo.copyright as string,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('License Text (to appear in attribution document)'),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('Permission is hereby granted', {
        exact: false,
      }),
    ).toBeInTheDocument();
  });

  it('saves temporary info', () => {
    const expectedPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
      packageName: 'React',
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'JQuery',
      },
    };
    const { store } = renderComponent(<AttributionDetailsViewer />);
    act(() => {
      store.dispatch(
        loadFromFile(
          getParsedInputFileEnrichedWithTestData({
            manualAttributions: testManualAttributions,
          }),
        ),
      );
      store.dispatch(navigateToView(View.Attribution));
      store.dispatch(setSelectedAttributionId('uuid_1'));
      store.dispatch(
        setTemporaryDisplayPackageInfo(
          convertPackageInfoToDisplayPackageInfo(expectedPackageInfo, [
            'uuid_1',
          ]),
        ),
      );
    });
    expect(screen.getByDisplayValue('React')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Save' }) as Element);
    expect(getManualAttributions(store.getState())?.uuid_1).toEqual(
      expectedPackageInfo,
    );
  });
});
