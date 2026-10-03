# Direct File Build Output

Direct Launch will be delivered through a generated `dist-file/index.html` with relative bundled JavaScript, CSS, and assets, plus a Playwright `file://` regression. This makes the direct-file requirement concrete and keeps browser packaging from drifting behind localhost behavior.
