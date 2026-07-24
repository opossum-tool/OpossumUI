// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import MuiChip from '@mui/material/Chip';
import MuiTypography from '@mui/material/Typography';
import { keepPreviousData } from '@tanstack/react-query';
import { useState } from 'react';

import type { ResourceTreeNodeData } from '../../../ElectronBackend/api/resourceTree';
import { text } from '../../../shared/text';
import { ROOT_PATH } from '../../shared-constants';
import { backend } from '../../util/backendClient';
import { Checkbox } from '../Checkbox/Checkbox';
import { getNodeIdsToExpand } from '../VirtualizedTree/VirtualizedTreeNode/VirtualizedTreeNode.util';
import {
  ExpandButton,
  LoadingIndicator,
  PickerContainer,
  ResourceLabel,
  ResourceRow,
  ResourceTreeContainer,
  SelectedPathsContainer,
  TreeNodeSpacer,
} from './MultiResourcePicker.style';

interface MultiResourcePickerProps {
  initialSelectedPaths?: Array<string>;
  open: boolean;
  onSelectionChange(selectedPaths: Array<string>): void;
}

export function MultiResourcePicker({
  initialSelectedPaths = [],
  open,
  onSelectionChange,
}: MultiResourcePickerProps) {
  const [selectedPaths, setSelectedPaths] = useState(initialSelectedPaths);
  const [expandedPaths, setExpandedPaths] = useState<Array<string>>([
    ROOT_PATH,
  ]);
  const resourceTree = backend.getResourceTree.useQuery(
    {
      expandedNodes: expandedPaths,
    },
    { enabled: open, placeholderData: keepPreviousData },
  );
  const resources = (resourceTree.data?.treeNodes ?? []).filter(
    (resource) => resource.id !== ROOT_PATH,
  );

  function updateSelectedPaths(path: string) {
    const nextSelectedPaths = selectedPaths.includes(path)
      ? selectedPaths.filter((selectedPath) => selectedPath !== path)
      : selectedPaths
          .filter(
            (selectedPath) =>
              !isAncestorOrSelf(path, selectedPath) &&
              !isAncestorOrSelf(selectedPath, path),
          )
          .concat(path);
    setSelectedPaths(nextSelectedPaths);
    onSelectionChange(nextSelectedPaths);
  }

  async function toggleExpanded(resource: ResourceTreeNodeData) {
    if (resource.isExpanded) {
      setExpandedPaths((previousExpandedPaths) =>
        previousExpandedPaths.filter(
          (expandedPath) => !expandedPath.startsWith(resource.id),
        ),
      );
      return;
    }

    const nodeIdsToExpand = await getNodeIdsToExpand(resource.id);
    setExpandedPaths((previousExpandedPaths) => [
      ...new Set([...previousExpandedPaths, ...nodeIdsToExpand]),
    ]);
  }

  return (
    <PickerContainer>
      <MuiTypography>
        {text.splitDialog.resourcePicker.explanationText}
      </MuiTypography>
      <ResourceTreeContainer>
        {resourceTree.isLoading ? (
          <MuiTypography color={'text.secondary'}>
            {text.splitDialog.resourcePicker.loadingResources}
          </MuiTypography>
        ) : (
          resources.map((resource) =>
            renderResource(
              resource,
              selectedPaths,
              updateSelectedPaths,
              toggleExpanded,
            ),
          )
        )}
        {resourceTree.isFetching ? <LoadingIndicator /> : null}
      </ResourceTreeContainer>
      <SelectedPathsContainer>
        {selectedPaths.length === 0 ? (
          <MuiTypography color={'text.secondary'}>
            {text.splitDialog.resourcePicker.noResourcesSelected}
          </MuiTypography>
        ) : (
          selectedPaths.map((path) => (
            <MuiChip
              key={path}
              label={path}
              onDelete={() => updateSelectedPaths(path)}
              size={'small'}
            />
          ))
        )}
      </SelectedPathsContainer>
    </PickerContainer>
  );
}

function renderResource(
  resource: ResourceTreeNodeData,
  selectedPaths: Array<string>,
  updateSelectedPaths: (path: string) => void,
  toggleExpanded: (resource: ResourceTreeNodeData) => Promise<void>,
) {
  const path = removeTrailingSlash(resource.id);
  const selectedExplicitly = selectedPaths.includes(path);
  const selectedByAncestor = selectedPaths.some(
    (selectedPath) =>
      selectedPath !== path && isAncestorOrSelf(selectedPath, path),
  );
  const containsSelectedDescendant = selectedPaths.some((selectedPath) =>
    isDescendant(selectedPath, path),
  );

  return (
    <ResourceRow
      key={resource.id}
      resourceLevel={resource.level}
      selectedByAncestor={selectedByAncestor}
    >
      {resource.isExpandable ? (
        <ExpandButton
          aria-label={
            resource.isExpanded
              ? text.splitDialog.resourcePicker.collapse(path)
              : text.splitDialog.resourcePicker.expand(path)
          }
          onClick={() => void toggleExpanded(resource)}
          size={'small'}
        >
          {resource.isExpanded ? (
            <ExpandMoreIcon fontSize={'small'} />
          ) : (
            <ChevronRightIcon fontSize={'small'} />
          )}
        </ExpandButton>
      ) : (
        <TreeNodeSpacer />
      )}
      <Checkbox
        checked={selectedExplicitly || selectedByAncestor}
        disabled={selectedByAncestor}
        indeterminate={
          !selectedExplicitly &&
          !selectedByAncestor &&
          containsSelectedDescendant
        }
        onChange={() => updateSelectedPaths(path)}
      />
      {resource.isFile ? (
        <InsertDriveFileOutlinedIcon fontSize={'small'} />
      ) : (
        <FolderOutlinedIcon fontSize={'small'} />
      )}
      <ResourceLabel>{resource.labelText}</ResourceLabel>
    </ResourceRow>
  );
}

function removeTrailingSlash(path: string): string {
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

function isAncestorOrSelf(ancestorPath: string, path: string): boolean {
  return path === ancestorPath || path.startsWith(`${ancestorPath}/`);
}

function isDescendant(path: string, ancestorPath: string): boolean {
  return path !== ancestorPath && isAncestorOrSelf(ancestorPath, path);
}
