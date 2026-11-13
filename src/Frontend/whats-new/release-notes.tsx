// SPDX-FileCopyrightText: Meta Platforms, Inc. and its affiliates
// SPDX-FileCopyrightText: TNG Technology Consulting GmbH <https://www.tngtech.com>
//
// SPDX-License-Identifier: Apache-2.0
import { text } from '../../shared/text';
import { Screenshot } from '../Components/WhatsNew/screenshot';
import multiselectFilterScreenshot from './images/multiselect-filter.png';
import statisticsNavigationScreenshot from './images/quickfilter-link.png';
import searchFilterScreenshot from './images/search-filter.png';
import updateAndRestartScreenshot from './images/update-and-restart.png';

// When adding notes for the first new feature after a release, increment this flag and delete the previous notes and screenshots.
export const revision = 1;

// Give each feature its own <section> with an <h2>. Use <Screenshot> with imports from ./images/.
export function ReleaseNotes(): React.ReactNode {
  return (
    <>
      <section>
        <h2>Discover what’s new</h2>
        <p>
          Release highlights now introduce new features directly in OpossumUI.
          You can revisit this overview at any time via{' '}
          <strong>
            {text.menu.help} → {text.menu.helpSubmenu.whatsNew}
          </strong>
          .
        </p>
      </section>

      <section>
        <h2>Install updates directly from OpossumUI</h2>
        <p>
          On Windows and Linux AppImage installations, you can now download and
          install updates directly from OpossumUI. Click{' '}
          <strong>{text.updateApp.downloadUpdate}</strong> in the update
          notification. Once the download is complete, click{' '}
          <strong>{text.updateApp.restart}</strong> to install the new version.
        </p>
        <Screenshot
          src={updateAndRestartScreenshot}
          alt={`Update ready to install with the ${text.updateApp.restart} button`}
        >
          Restart OpossumUI to install a downloaded update.
        </Screenshot>
      </section>

      <section>
        <h2>More flexible filters</h2>
        <p>
          You can now select several licenses at once, rather than filtering by
          just one.
        </p>
        <Screenshot
          src={multiselectFilterScreenshot}
          alt="License filter with multiple licenses selected"
        >
          Select several licenses in the same filter.
        </Screenshot>
        <p>
          Use a <strong>Name contains</strong> filter to find licenses by part
          of their name. For example, searching for <strong>BSD</strong> lets
          you include matching license names without selecting each one
          individually. License filters are available for attributions, signals,
          the resources tree, and the {text.topBar.report} view.
        </p>
        <Screenshot
          src={searchFilterScreenshot}
          alt="Adding a Name contains filter to match BSD licenses"
        >
          Match license names with a text search.
        </Screenshot>
        <p>
          New criticality and classification filters help you focus on the
          attributions and signals relevant to your review.
        </p>
      </section>

      <section>
        <h2>Navigate directly from project statistics</h2>
        <p>
          You can now jump directly from {text.projectStatisticsPopup.title} to
          a filtered view of the corresponding attributions or signals. For
          example, click a criticality category to inspect those signals in the{' '}
          {text.topBar.audit} view, or{' '}
          <strong>
            {
              text.projectStatisticsPopup.charts.attributionProperties
                .needsReview
            }
          </strong>{' '}
          to focus on attributions awaiting review. License names in the{' '}
          {text.projectStatisticsPopup.tabs.details} tab also link to the
          matching signals.
        </p>
        <Screenshot
          src={statisticsNavigationScreenshot}
          alt={`${text.projectStatisticsPopup.title} with a license chart tooltip linking to matching signals in the ${text.topBar.audit} view`}
        >
          Click a chart category to inspect the matching attributions or
          signals.
        </Screenshot>
      </section>

      <section>
        <h2>AI review states in project statistics</h2>
        <p>
          {text.projectStatisticsPopup.title} now shows how many attributions
          were AI-assisted and in which review state — the same{' '}
          {text.topBar.switchableProgressBar.aiBar.nonDeferred}/
          {text.topBar.switchableProgressBar.aiBar.deferred} and{' '}
          {text.topBar.switchableProgressBar.aiBar.unmodified}/
          {text.topBar.switchableProgressBar.aiBar.humanModified} states as the
          AI Review progress bar, so you can see the amount and progress of
          AI-assisted review work at a glance.
        </p>
      </section>
    </>
  );
}
