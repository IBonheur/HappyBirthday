# HappyBirthday

A responsive birthday greeting page for Bonheur with rotating photos, animated scenes, and a local wish form.

## Run locally

Open `index.html` in a browser or use a local static server such as VS Code Live Server. The page does not require a build step or external dependencies.

## Behavior

- Wishes are stored in the browser's `localStorage` under `bonheur-birthday-wishes`.
- The photo and background scene rotate while the page is visible.
- Animations pause when the tab is hidden and resume when it becomes visible again.
- The privacy screen masks the page when the browser tab or window loses visibility.

Browser privacy limitation: a normal website cannot block operating-system screenshots, screen recording, or external cameras. Full capture prevention requires a native or managed application environment.
