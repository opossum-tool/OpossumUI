// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { createContext, use, useLayoutEffect, useRef } from 'react';

import { AllowedFrontendChannels } from '../../shared/ipc-channels';
import { useIpcRenderer } from './use-ipc-renderer';

type SubmitDraft = (onSubmitted: () => Promise<void>) => Promise<void>;

export const ProjectSaveContext =
  createContext<React.RefObject<SubmitDraft | null> | null>(null);

export function useProjectSave(databaseInitialized: boolean) {
  const submitDraftRef = useRef<SubmitDraft | null>(null);
  useIpcRenderer(
    AllowedFrontendChannels.SaveFileRequest,
    async () => {
      if (!databaseInitialized) {
        return;
      }
      const writeArchive = () => window.electronAPI.saveFile();
      if (submitDraftRef.current) {
        await submitDraftRef.current(writeArchive);
      } else {
        await writeArchive();
      }
    },
    [databaseInitialized],
  );
  return submitDraftRef;
}

export function useProjectSaveDraft(submitDraft: SubmitDraft): void {
  const draftHandler = use(ProjectSaveContext);
  useLayoutEffect(() => {
    if (!draftHandler) {
      return undefined;
    }
    draftHandler.current = submitDraft;
    return () => {
      draftHandler.current = null;
    };
  }, [draftHandler, submitDraft]);
}
