// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiTypography from '@mui/material/Typography';

import { text } from '../../../shared/text';
import { useVirtuosoComponent } from '../VirtuosoComponentContext/VirtuosoComponentContext';
import { Container } from './EmptyPlaceholder.style';

export const EmptyPlaceholder: React.FC = () => {
  const { loading } = useVirtuosoComponent();

  if (loading) {
    return null;
  }

  return (
    <Container>
      <MuiTypography sx={{ textTransform: 'uppercase' }}>
        {text.generic.noResults}
      </MuiTypography>
    </Container>
  );
};
