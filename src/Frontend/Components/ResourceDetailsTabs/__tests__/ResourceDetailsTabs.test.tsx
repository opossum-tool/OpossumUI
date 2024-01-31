// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Attributions,
  Resources,
  ResourcesToAttributions,
} from '../../../../shared/shared-types';
import { text } from '../../../../shared/text';
import { setSelectedResourceId } from '../../../state/actions/resource-actions/audit-view-simple-actions';
import { loadFromFile } from '../../../state/actions/resource-actions/load-actions';
import { getParsedInputFileEnrichedWithTestData } from '../../../test-helpers/general-test-helpers';
import { renderComponent } from '../../../test-helpers/render';
import { ResourceDetailsTabs } from '../ResourceDetailsTabs';

describe('The ResourceDetailsTabs', () => {
  it('switches between tabs', async () => {
    const testResources: Resources = {
      root: {
        fileWithoutAttribution: 1,
      },
    };
    const manualAttributions: Attributions = {
      uuid_1: { packageName: 'jQuery', id: 'uuid_1' },
    };

    const { store } = renderComponent(
      <ResourceDetailsTabs
        isGlobalTabEnabled={true}
        isAddToPackageEnabled={true}
      />,
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions,
        }),
      ),
    );

    act(() => {
      store.dispatch(setSelectedResourceId('/root/fileWithoutAttribution'));
    });
    expect(screen.getByText('Signals')).toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Global Tab'));
    expect(screen.queryByText('Signals')).not.toBeInTheDocument();

    await userEvent.click(screen.getByLabelText('Local Tab'));
    expect(screen.getByText('Signals')).toBeInTheDocument();
  });

  it('has All Attributions Tab disabled when no addable attribution is present', () => {
    const testResources: Resources = {
      fileWithAttribution: 1,
    };
    const manualAttributions: Attributions = {
      uuid_1: { packageName: 'jQuery', packageVersion: '16.2.0', id: 'uuid_1' },
    };
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/fileWithAttribution': ['uuid_1'],
    };

    const { store } = renderComponent(
      <ResourceDetailsTabs
        isGlobalTabEnabled={true}
        isAddToPackageEnabled={true}
      />,
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions,
          resourcesToManualAttributions,
        }),
      ),
    );

    act(() => {
      store.dispatch(setSelectedResourceId('/fileWithAttribution'));
    });
    expect(screen.getByText('Signals')).toBeInTheDocument();

    expect(screen.getByLabelText('Global Tab')).toBeDisabled();
  });

  it('has search functionality', async () => {
    const resourcesToManualAttributions: ResourcesToAttributions = {
      '/fileWithAttribution': ['uuid_1', 'uuid_2', 'uuid_3'],
    };
    const testResources: Resources = {
      root: {
        fileWithoutAttribution: 1,
        fileWithAttribution: 1,
      },
    };
    const testManualAttributions: Attributions = {
      uuid_1: {
        packageName: 'package name 1',
        licenseText: 'text',
        licenseName: 'license name 2',
        comment: 'comment bla',
        packageVersion: '1.1.1',
        id: 'uuid_1',
      },
      uuid_2: {
        packageName: 'package name 2',
        copyright: '(c)',
        comment: 'comment blub',
        url: 'www.url.de',
        id: 'uuid_2',
      },
      uuid_3: {
        packageName: 'package name 3',
        packageVersion: 'packageVersion',
        id: 'uuid_3',
      },
    };

    const { store } = renderComponent(
      <ResourceDetailsTabs
        isGlobalTabEnabled={true}
        isAddToPackageEnabled={true}
      />,
    );
    store.dispatch(
      loadFromFile(
        getParsedInputFileEnrichedWithTestData({
          resources: testResources,
          manualAttributions: testManualAttributions,
          resourcesToManualAttributions,
        }),
      ),
    );
    act(() => {
      store.dispatch(setSelectedResourceId('/root/fileWithoutAttribution'));
    });

    await userEvent.click(screen.getByLabelText('Global Tab'));

    screen.getByText(/package name 1/);
    screen.getByText(/package name 2/);
    screen.getByText(/package name 3/);

    fireEvent.click(screen.getByLabelText(text.resourceDetails.searchTooltip));

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'name 1' },
    });
    screen.getByText(/package name 1/);
    expect(screen.queryByText(/package name 2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/package name 3/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '(C)' },
    });
    expect(screen.queryByText(/package name 1/)).not.toBeInTheDocument();
    screen.getByText(/package name 2/);
    expect(screen.queryByText(/package name 3/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'NAME 2' },
    });
    screen.getByText(/package name 1/);
    screen.getByText(/package name 2/);
    expect(screen.queryByText(/package name 3/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'comment' },
    });
    expect(screen.queryByText(/package name 1/)).not.toBeInTheDocument();
    expect(screen.queryByText(/package name 2/)).not.toBeInTheDocument();
    expect(screen.queryByText(/package name 3/)).not.toBeInTheDocument();
  });
});
