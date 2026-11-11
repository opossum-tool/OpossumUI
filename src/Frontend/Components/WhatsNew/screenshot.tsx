// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import MuiButton from '@mui/material/Button';
import { useState } from 'react';

import { text } from '../../../shared/text';
import { Dialog } from '../Dialog/dialog';
import {
  FullSizeScreenshot,
  ScreenshotFigure,
  ScreenshotOpenButton,
  ScreenshotViewerContent,
  ScreenshotViewerHeader,
  ScreenshotViewerTitle,
} from './screenshot.style';

interface ScreenshotProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
}

export function Screenshot({ src, alt, children }: ScreenshotProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  return (
    <>
      <ScreenshotFigure>
        <ScreenshotOpenButton
          type="button"
          aria-label={`${text.whatsNew.viewFullSize}: ${alt}`}
          aria-haspopup="dialog"
          title={text.whatsNew.viewFullSize}
          onClick={() => setViewerOpen(true)}
        >
          <img src={src} alt={alt} />
        </ScreenshotOpenButton>
        {children && <figcaption>{children}</figcaption>}
      </ScreenshotFigure>
      <Dialog fullScreen open={viewerOpen} onClose={() => setViewerOpen(false)}>
        <ScreenshotViewerHeader>
          <ScreenshotViewerTitle>
            {text.whatsNew.screenshot}: {alt}
          </ScreenshotViewerTitle>
          <MuiButton autoFocus onClick={() => setViewerOpen(false)}>
            {text.buttons.close}
          </MuiButton>
        </ScreenshotViewerHeader>
        <ScreenshotViewerContent
          tabIndex={0}
          role="region"
          aria-label={text.whatsNew.screenshot}
        >
          <FullSizeScreenshot src={src} alt={alt} />
        </ScreenshotViewerContent>
      </Dialog>
    </>
  );
}
