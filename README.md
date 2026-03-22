# Collector Hub Static Site

This project is a static marketplace-style website built with HTML, CSS, jQuery, and small client-side enhancements.

## What's Included

- Multi-page static site
- Live client-side create form preview
- Search and sort on the explore page
- Interactive bidding demo on the item details page
- Author follow toggle

## Run Locally

You can serve the site with Python directly:

```bash
python3 -m http.server 4173
```

Or use the npm script:

```bash
npm start
```

Then open:

```text
http://localhost:4173
```

## Project Structure

- `index.html` - homepage
- `explore.html` - searchable listings
- `details.html` - item details and bid demo
- `author.html` - creator profile page
- `create.html` - client-side item submission form
- `assets/js/app.js` - page-specific interactive behavior
- `assets/js/custom.js` - shared template interactions

## Notes

- This is still a static frontend project.
- Form submissions and bids are simulated in the browser for demo purposes.
- If you want a real marketplace flow, the next step is connecting these pages to an API or backend.

## CI And QA Pipeline

This repository now includes a CI-ready QA toolchain for a static frontend project:

- `npm run lint` validates HTML and the maintained application scripts
- `npm run test:unit` runs Vitest with coverage for client-side logic
- `npm run test:integration` runs Playwright browser tests against the local site
- `npm run audit` runs `npm audit` and Retire.js vulnerability scanning
- `npm run sonar:prepare` converts test reports into a SonarQube-friendly execution report

The `Jenkinsfile` runs those stages before deployment and archives the generated artifacts from `reports/`.

## Suggested Jenkins Stages

If you want to write the `Jenkinsfile` yourself and test it locally first, these are the recommended stages for this project:

1. `Checkout / Fetch Source`
   Download or clone the project source for the tag or branch you want to test.

2. `Install Dependencies`
   Run:
   ```bash
   npm ci
   ```

3. `Install Playwright Browser`
   Run:
   ```bash
   npx playwright install chromium
   ```

4. `Lint`
   Run:
   ```bash
   npm run lint
   ```

5. `Unit Tests`
   Run:
   ```bash
   npm run test:unit
   ```

6. `Integration Tests`
   Run:
   ```bash
   npm run test:integration
   ```

7. `Security Checks`
   Run:
   ```bash
   npm run audit
   ```

8. `Prepare SonarQube Reports`
   Run:
   ```bash
   npm run sonar:prepare
   ```

9. `SonarQube Scan`
   Run Sonar scanner from Jenkins after the test and coverage reports are created.

10. `Quality Gate`
    Wait for SonarQube quality gate result and fail the pipeline if it does not pass.

11. `Deploy`
    Only deploy after all QA, security, and SonarQube checks pass.

12. `Post Actions`
    Archive reports, publish JUnit XML results, and clean the workspace.

## Local Pipeline Test Order

Before writing Jenkins stages, you can validate the same flow locally with:

```bash
npm ci
npx playwright install chromium
npm run ci
```

This gives you a local check for linting, unit tests, integration tests, Sonar report preparation, and vulnerability scanning before Jenkins is involved.

## Jenkins Requirements

To make the updated pipeline work in Jenkins, configure these items first:

- A Node.js-capable agent with `npm`
- SonarQube Jenkins plugin plus a configured server named `sonarqube`
- A configured Sonar scanner tool named `sonar-scanner`
- Credentials:
  - `GITHUB_TOKEN`
  - `nginx-server-key`

If your Jenkins agents do not already have the Linux libraries needed by Playwright Chromium, install them on the agent image or switch the pipeline to a browser-ready container agent.
