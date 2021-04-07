# Year Planner: a multi-lingual general and student year planner

Find the live year planner at Amazon CloudFront [Year Planner](https://d1uamxeylh4qir.cloudfront.net/ "Year Planner")

## How it works

The Year planner is a responsive (mobile-first) single-page HTML application that uses browser storage (cookies) to store, navigate and display tweet sized Western (Gregorian) calendar diary entries.  

Entries are <em>not</em> sent to or stored in the "cloud" by design.  Each browser instance stores and maintains an independent instance (copy) of your planner, but can be <em>shared</em> across browsers by using the share icon in the navigation header.

Shared planners maintain a "unique" timestamp identifier for the instant that they were created (to second precision).  Within a small set, any given planner's shared identifier is probably unique, however they are not universal and a shared planner will over-write a planner with the same identifier if opened in the same browser.

Multiple planners with different "unique" identifiers can be stored in a given browser, allowing for different use cases (home, work, study).

### Backlog

- \[ \] Settings dropdown menu
- \[ \] Save theme in preferences
- \[ \] Switches for light and dark themes in settings menu
- \[ \] 2x 26 week semester view
- \[ \] 4x 13 week term view

### Recent Features Added



