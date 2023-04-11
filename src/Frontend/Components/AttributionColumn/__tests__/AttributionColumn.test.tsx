// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
// SPDX-FileCopyrightText: Nico Carl <nicocarl@protonmail.com>
//
// SPDX-License-Identifier: Apache-2.0

import { screen } from '@testing-library/react';
import React from 'react';
import {
  DiscreteConfidence,
  DisplayPackageInfo,
  FollowUp,
  FrequentLicenses,
  PackageInfo,
  SaveFileArgs,
  Source,
} from '../../../../shared/shared-types';
import { ButtonText, CheckboxLabel } from '../../../enums/enums';
import {
  setFrequentLicenses,
  setTemporaryPackageInfo,
} from '../../../state/actions/resource-actions/all-views-simple-actions';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { getTemporaryPackageInfo } from '../../../state/selectors/all-views-resource-selectors';
import { renderComponentWithStore } from '../../../test-helpers/render-component-with-store';
import {
  clickOnButton,
  clickOnCheckbox,
} from '../../../test-helpers/general-test-helpers';
import { doNothing } from '../../../util/do-nothing';
import { AttributionColumn } from '../AttributionColumn';
import {
  clickGoToLinkIcon,
  expectGoToLinkButtonIsDisabled,
  expectValueInTextBox,
  insertValueIntoTextBox,
} from '../../../test-helpers/attribution-column-test-helpers';
import { act } from 'react-dom/test-utils';

describe('The AttributionColumn', () => {
  it('renders TextBoxes with right titles and content', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
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
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(screen.queryAllByText('Confidence')).toHaveLength(2);
    expect(
      screen.getByDisplayValue(
        (
          testTemporaryPackageInfo.attributionConfidence as unknown as number
        ).toString()
      )
    );
    expect(screen.queryAllByText('Name')).toHaveLength(2);
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.packageName as string)
    );
    expect(screen.queryAllByText('Version')).toHaveLength(2);
    expect(
      screen.getByDisplayValue(
        testTemporaryPackageInfo.packageVersion as string
      )
    );
    expect(
      screen.queryByText('(Defined in parent folder)')
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Override parent')).not.toBeInTheDocument();
    expect(screen.queryByText('Source')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Copyright'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.copyright as string)
    );
    expect(screen.getByLabelText('License Name'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.licenseName as string)
    );
    expect(screen.getByLabelText('URL'));
    expect(screen.getByDisplayValue(testTemporaryPackageInfo.url as string));
    expect(screen.getByLabelText(/License Text/));
    expect(
      screen.getByDisplayValue('Permission is hereby granted', { exact: false })
    );
    expect(screen.getByLabelText('Comment'));
    expect(
      screen.getByDisplayValue(testTemporaryPackageInfo.comment as string)
    );
    expect(screen.queryAllByText('PURL')).toHaveLength(2);
    expect(
      screen.getByDisplayValue('pkg:type/namespace/jQuery@16.5.0?appendix')
    );
  });

  it('renders qualifier in the purl correctly', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
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
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    insertValueIntoTextBox(
      screen,
      'PURL',
      'pkg:type/namespace/jQuery@16.5.0?appendix&#test'
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      'PURL',
      'pkg:type/namespace/jQuery@16.5.0?appendix=#test'
    );
  });

  it('sorts qualifier in the purl alphabetically', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
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
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    insertValueIntoTextBox(
      screen,
      'PURL',
      'pkg:type/namespace/jQuery@16.5.0?test=appendix&appendix=test#test'
    );
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(
      screen,
      'PURL',
      'pkg:type/namespace/jQuery@16.5.0?appendix=test&test=appendix#test'
    );
  });

  it('removes special symbol from the end of the purl if nothing follows', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.Low,
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
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    insertValueIntoTextBox(screen, 'PURL', 'pkg:type/namespace/jQuery@16.5.0?');
    clickOnButton(screen, ButtonText.Save);
    expectValueInTextBox(screen, 'PURL', 'pkg:type/namespace/jQuery@16.5.0');
  });

  it('renders a TextBox for the source, if it is defined', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      source: { name: 'The Source', documentConfidence: 10 },
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setSelectedResourceId('test_id'));
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(
      screen.getByDisplayValue((testTemporaryPackageInfo.source as Source).name)
    );
  });

  it('renders a checkbox for Follow-up', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(getTemporaryPackageInfo(store.getState()).followUp).toBeUndefined();

    clickOnCheckbox(screen, CheckboxLabel.FollowUp);
    expect(getTemporaryPackageInfo(store.getState()).followUp).toBe(FollowUp);
  });

  it('renders a checkbox for Exclude from notice', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      attributionConfidence: DiscreteConfidence.High,
    };
    const { store } = renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );
    act(() => {
      store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
    });

    expect(
      getTemporaryPackageInfo(store.getState()).excludeFromNotice
    ).toBeUndefined();

    clickOnCheckbox(screen, CheckboxLabel.ExcludeFromNotice);
    expect(getTemporaryPackageInfo(store.getState()).excludeFromNotice).toBe(
      true
    );
  });

  it('renders an url icon and opens a link in browser', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      url: 'https://www.testurl.com/',
    };
    renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );

    expect(screen.getByLabelText('Url icon'));
    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      testTemporaryPackageInfo.url
    );
  });

  it('opens a link without protocol', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      url: 'www.testurl.com',
    };
    renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).toHaveBeenCalledWith(
      'https://' + testTemporaryPackageInfo.url
    );
  });

  it('disables url icon if empty url', () => {
    const testTemporaryPackageInfo: PackageInfo = {
      url: '',
    };
    renderComponentWithStore(
      <AttributionColumn
        isEditable={true}
        displayPackageInfo={testTemporaryPackageInfo}
        setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
        onSaveButtonClick={doNothing}
        setTemporaryPackageInfo={(): (() => void) => doNothing}
        onSaveGloballyButtonClick={doNothing}
        showManualAttributionData={true}
        saveFileRequestListener={doNothing}
        onDeleteButtonClick={doNothing}
        onDeleteGloballyButtonClick={doNothing}
      />
    );

    clickGoToLinkIcon(screen, 'Url icon');
    expect(global.window.electronAPI.openLink).not.toHaveBeenCalled();
    expectGoToLinkButtonIsDisabled(screen);
  });

  describe('there are different license text labels', () => {
    it('shows standard text if editable and non frequent license', () => {
      const testTemporaryPackageInfo: PackageInfo = { packageName: 'jQuery' };
      renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );

      expect(
        screen.getByLabelText(
          'License Text (to appear in attribution document)'
        )
      );
    });

    it('shows shortened text if not editable and frequent license', () => {
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
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );
      const testFrequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      act(() => {
        store.dispatch(setFrequentLicenses(testFrequentLicenses));
      });

      expect(screen.getByLabelText('Standard license text implied.'));
    });

    it('shows long text if editable and frequent license', () => {
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
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );
      const testFrequentLicenses: FrequentLicenses = {
        nameOrder: [{ shortName: 'MIT', fullName: 'MIT license' }],
        texts: { MIT: 'text' },
      };
      act(() => {
        store.dispatch(setFrequentLicenses(testFrequentLicenses));
      });

      expect(
        screen.getByLabelText(
          'Standard license text implied. Insert notice text if necessary.'
        )
      );
    });
  });

  describe('while changing the first party value', () => {
    it('sets first party flag when checking first party', () => {
      const testTemporaryPackageInfo: PackageInfo = {};
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testTemporaryPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );

      expect(
        getTemporaryPackageInfo(store.getState()).copyright
      ).toBeUndefined();

      clickOnCheckbox(screen, CheckboxLabel.FirstParty);
      expect(getTemporaryPackageInfo(store.getState()).firstParty).toBe(true);
    });

    it('leaves copyright unchanged when checking first party', () => {
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
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={true}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );
      act(() => {
        store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
      });

      expect(getTemporaryPackageInfo(store.getState()).copyright).toBe(
        testCopyright
      );

      clickOnCheckbox(screen, CheckboxLabel.FirstParty);
      expect(getTemporaryPackageInfo(store.getState()).copyright).toBe(
        testCopyright
      );
    });
  });

  describe('The ResolveButton', () => {
    it('saves resolved external attributions', () => {
      const testPackageInfo: PackageInfo = {};
      const testTemporaryPackageInfo: DisplayPackageInfo = {
        type: 'DisplayPackageInfo',
        attributionIds: ['TestId'],
      };
      const expectedSaveFileArgs: SaveFileArgs = {
        manualAttributions: {},
        resolvedExternalAttributions: new Set<string>().add('TestId'),
        resourcesToAttributions: {},
      };
      const { store } = renderComponentWithStore(
        <AttributionColumn
          isEditable={true}
          displayPackageInfo={testPackageInfo}
          setUpdateTemporaryPackageInfoFor={(): (() => void) => doNothing}
          onSaveButtonClick={doNothing}
          setTemporaryPackageInfo={(): (() => void) => doNothing}
          onSaveGloballyButtonClick={doNothing}
          showManualAttributionData={false}
          saveFileRequestListener={doNothing}
          onDeleteButtonClick={doNothing}
          onDeleteGloballyButtonClick={doNothing}
        />
      );
      act(() => {
        store.dispatch(setTemporaryPackageInfo(testTemporaryPackageInfo));
      });

      clickOnButton(screen, 'resolve attribution');
      expect(window.electronAPI.saveFile).toHaveBeenCalledTimes(1);
      expect(window.electronAPI.saveFile).toHaveBeenCalledWith(
        expectedSaveFileArgs
      );
    });
  });
});
