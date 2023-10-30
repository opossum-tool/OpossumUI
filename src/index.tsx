// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createRoot } from 'react-dom/client';

import { AppContainer } from './Frontend/Components/AppContainer/AppContainer';

const container = document.getElementById('root');
const root = createRoot(container as Element);
root.render(<AppContainer />);
