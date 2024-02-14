// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { screen } from '@testing-library/react';

import { renderComponent } from '../../../test-helpers/render';
import { ReportTableHeader } from '../ReportTableHeader';

describe('The report view table header', () => {
  it('renders', () => {
    renderComponent(
      <table>
        <thead>
          <ReportTableHeader />
        </thead>
      </table>,
    );

    expect(screen.getByText('License')).toBeInTheDocument();
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getAllByText('Name')).toHaveLength(1);
    expect(screen.getByText('Copyright')).toBeInTheDocument();
    expect(screen.getByText('License Text')).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Comment')).toBeInTheDocument();
    expect(screen.getByText('URL')).toBeInTheDocument();
  });
});
