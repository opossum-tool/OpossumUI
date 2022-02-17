// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0

import React, { ReactElement } from 'react';
import clsx from 'clsx';

interface NodeIconProps {
  className?: string;
  ariaLabel: string;
  onClick: () => void;
  icon: ReactElement;
}

export function NodeIcon(props: NodeIconProps): ReactElement {
  return (
    <div
      className={clsx(props.className)}
      onClick={(event): void => {
        event.stopPropagation();
        props.onClick();
      }}
      aria-label={props.ariaLabel}
    >
      {props.icon}
    </div>
  );
}
