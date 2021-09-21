// SPDX-FileCopyrightText: Facebook, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import { IpcRenderer } from 'electron';
import React from 'react';
import {
  FollowUp,
  FrequentLicences,
  PackageInfo,
  SaveFileArgs,
  Source,
} from '../../../../shared/shared-types';
import { PackagePanelTitle } from '../../../enums/enums';
import {
  setFrequentLicences,
  setResources,
  setTemporaryPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import {
  addResolvedExternalAttribution,
  setDisplayedPackage,
  setSelectedResourceId,
} from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnButton,
  clickOnCheckbox,
} from '../../../test-helpers/test-helpers';
import { doNothing } from '../../../util/do-nothing';
import { AttributionColumn } from '../AttributionColumn';
import { IpcChannel } from '../../../../shared/ipc-channels';

let originalIpcRenderer: IpcRenderer;

describe('The AttributionColumn', () => {
  beforeAll(() => {
    originalIpcRenderer = global.window.ipcRenderer;
    global.window.ipcRenderer = {
      on: jest.fn(),
      removeListener: jest.fn(),
      invoke: jest.fn(),
    } as unknown as IpcRenderer;
  });

  afterAll(() => {
    // Important to restore the original value.
    global.window.ipcRenderer = originalIpcRenderer;
  });

  test('renders TextBoxes with right titles and content', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: 20,
      packageName: 'jQuery',
      packageVersion: '16.5.0',
      packagePURLAppendix: '?appendix',
      packageNamespace: 'namespace',
      packageType: 'type',
      comment: 'some comment',
      copyright: 'Copyright Doe Inc. 2019',
      licenseText: 'Permission is hereby granted',
      licenseName: 'Made up license name',
      url: 'www.1999.com',
    };
    const {
      getByDisplayValue,
      queryByText,
      getByLabelText,
      queryAllByText,
      store,
    } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveForAllButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteForAllButtonClick={doNothing}
      />
    );
    store.dispatch(setSelectedResourceId('test_id'));
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(queryAllByText('Confidence')).toHaveLength(2);
    expect(
      getByDisplayValue(
        (
          testTemporaryPackageInfo.attributionConfidence as unknown as number
        ).toString()
      )
    );
    expect(queryAllByText('Name')).toHaveLength(2);
    expect(getByDisplayValue(testTemporaryPackageInfo.packageName as string));
    expect(queryAllByText('Version')).toHaveLength(2);
    expect(
      getByDisplayValue(testTemporaryPackageInfo.packageVersion as string)
    );
    expect(queryAllByText('(Defined in parent folder)')).toHaveLength(0);
    expect(queryAllByText('Override parent')).toHaveLength(0);
    expect(queryByText('Source')).toBeFalsy();
    expect(getByLabelText('Copyright'));
    expect(getByDisplayValue(testTemporaryPackageInfo.copyright as string));
    expect(getByLabelText('License Name'));
    expect(getByDisplayValue(testTemporaryPackageInfo.licenseName as string));
    expect(getByLabelText('URL'));
    expect(getByDisplayValue(testTemporaryPackageInfo.url as string));
    expect(getByLabelText(/License Text/));
    expect(getByDisplayValue('Permission is hereby granted', { exact: false }));
    expect(getByLabelText('Comment'));
    expect(getByDisplayValue(testTemporaryPackageInfo.comment as string));
    expect(queryAllByText('PURL')).toHaveLength(2);
    expect(getByDisplayValue('pkg:type/namespace/jQuery@16.5.0?appendix'));
  });

  test('renders a TextBox for the source, if it is defined', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      source: { name: 'The Source', documentConfidence: 10 },
    };
    const { getByDisplayValue, store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveForAllButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteForAllButtonClick={doNothing}
      />
    );
    store.dispatch(setSelectedResourceId('test_id'));
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

    expect(getByDisplayValue((testTemporaryPackageInfo.source as Source).name));
  });

  test('renders a checkbox for Follow-up', () => {
    const testTemporaryPackageInfo: PackageInfo = { attributionConfidence: 80 };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveForAllButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteForAllButtonClick={doNothing}
      />
    );
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(getTemporaryPackageInfo(store.getState()).followUp).toBeUndefined();

    clickOnCheckbox(screen, 'Follow-up');
    expect(getTemporaryPackageInfo(store.getState()).followUp).toBe(FollowUp);
  });

  test('renders a checkbox for Exclude from notice', () => {
    const testTemporaryPackageInfo: PackageInfo = { attributionConfidence: 80 };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveForAllButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteForAllButtonClick={doNothing}
      />
    );
    store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    expect(
      getTemporaryPackageInfo(store.getState()).excludeFromNotice
    ).toBeUndefined();

    clickOnCheckbox(screen, 'Exclude From Notice');
    expect(getTemporaryPackageInfo(store.getState()).excludeFromNotice).toBe(
      true
    );
  });

  describe('there are different license text labels', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document.createRange = (): unknown => ({
      setStart: (): void => {},
      setEnd: (): void => {},
      commonAncestorContainer: {
        nodeName: 'BODY',
        ownerDocument: document,
      },
    });

    test('shows standard text if editable and non frequent license', () => {
      const testTemporaryPackageInfo: PackageInfo = { packageName: 'jQuery' };
      const { getByLabelText } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );

      expect(
        getByLabelText('License Text (to appear in attribution document)')
      );
    });

    test('shows shortened text if not editable and frequent license', () => {
      const testTemporaryPackageInfo: PackageInfo = {
        packageName: 'jQuery',
        licenseName: 'Mit',
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={false}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );
      const testFrequentLicenses: FrequentLicences = {
        nameOrder: ['MIT'],
        texts: { MIT: 'text' },
      };
      store.dispatch(setFrequentLicences(testFrequentLicenses));

      expect(screen.getByLabelText('Standard license text implied.'));
    });

    test('shows long text if editable and frequent license', () => {
      const testTemporaryPackageInfo: PackageInfo = {
        packageName: 'jQuery',
        licenseName: 'mit',
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );
      const testFrequentLicenses: FrequentLicences = {
        nameOrder: ['MIT'],
        texts: { MIT: 'text' },
      };
      store.dispatch(setFrequentLicences(testFrequentLicenses));

      expect(
        screen.getByLabelText(
          'Standard license text implied. Insert notice text if necessary.'
        )
      );
    });
  });

  describe('while changing the first party value', () => {
    test('sets first party flag when checking first party', () => {
      const testTemporaryPackageInfo: PackageInfo = {};
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );

      expect(
        getTemporaryPackageInfo(store.getState()).copyright
      ).toBeUndefined();

      clickOnCheckbox(screen, '1st Party');
      expect(getTemporaryPackageInfo(store.getState()).firstParty).toBe(true);
    });

    test('leaves copyright unchanged when checking first party', () => {
      const testCopyright = 'Test Copyright';
      const testTemporaryPackageInfo: PackageInfo = {
        copyright: testCopyright,
        firstParty: true,
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));

      expect(getTemporaryPackageInfo(store.getState()).copyright).toBe(
        testCopyright
      );

      clickOnCheckbox(screen, '1st Party');
      expect(getTemporaryPackageInfo(store.getState()).copyright).toBe(
        testCopyright
      );
    });
  });

  describe('The ResolveButton', () => {
    beforeAll(() => {
      originalIpcRenderer = global.window.ipcRenderer;
      global.window.ipcRenderer = {
        on: jest.fn(),
        removeListener: jest.fn(),
        invoke: jest.fn(),
      } as unknown as IpcRenderer;
    });

    beforeEach(() => jest.clearAllMocks());

    afterAll(() => {
      // Important to restore the original value.
      global.window.ipcRenderer = originalIpcRenderer;
    });

    test('saves resolved external attributions', () => {
      const testTemporaryPackageInfo: PackageInfo = {};
      const expectedSaveFileArgs: SaveFileArgs = {
        manualAttributions: {},
        resolvedExternalAttributions: new Set<string>()
          .add('TestExternalAttribution')
          .add('TestId'),
        resourcesToAttributions: {},
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveForAllButtonClick={doNothing}
          showManualAttributionData={false}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteForAllButtonClick={doNothing}
        />
      );
      store.dispatch(setResources({}));
      store.dispatch(
        setDisplayedPackage({
          panel: PackagePanelTitle.ExternalPackages,
          attributionId: 'TestId',
        })
      );
      store.dispatch(addResolvedExternalAttribution('TestExternalAttribution'));

      clickOnButton(screen, 'resolve attribution');
      expect(window.ipcRenderer.invoke).toHaveBeenCalledTimes(1);
      expect(window.ipcRenderer.invoke).toHaveBeenCalledWith(
        IpcChannel['SaveFile'],
        expectedSaveFileArgs
      );
    });
  });
});
