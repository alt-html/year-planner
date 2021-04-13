# Year Planner: a multi-lingual general and student year planner

Find the live year planner at Amazon CloudFront [Year Planner](https://d1uamxeylh4qir.cloudfront.net/ "Year Planner")

## How it works

The Year planner is a responsive (mobile-first) single-page HTML application that uses browser storage (cookies) to store, navigate and display clickable tweet sized Western (Gregorian) calendar diary entries.  

Entries are <em>not</em> sent to or stored in the "cloud" by design.  Each browser instance stores and maintains an independent instance (copy) of your planner, but can be <em>shared</em> across browsers by using the share icon in the navigation header.

Shared planners maintain a "unique" timestamp identifier for the instant that they were created (to second precision).  Within a small set, any given planner's shared identifier is probably unique, however they are not universal and a shared planner will over-write a planner with the same identifier if opened in the same browser.

Multiple planners with different "unique" identifiers can be stored in a given browser, allowing for different use cases (home, work, study).

## Features

### Simple Year Planner View

The year planner generates and displays a  table of weeks by months matrix for a given year as follows:

| 2021 | January | February | March | April | May | June | July | August | September | October | November | December |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Monday |   |  1 |  1 |   |  ... | ...  | ...  | ...  | ...  | ...  | ...  | ...  |
| Tuesday |   |  2 |  2 |   |   |   |   |   |   |   |   |   |
| Wednesday |   | 3  | 3  |   |   |   |   |   |   |   |   |   |
| Thursday |   | 4  | 4  | 1  |   |   |   |   |   |   |   |   |
| Friday | 1  |  5 | 5  |  2 |   |   |   |   |   |   |   |   |
| Saturday | 2  | 6  | 6  | 3  |   |   |   |   |   |   |   |   |
| Sunday | 3  |  7 |  7 |  4 |   |   |   |   |   |   |   |   |
| Monday | 4  |  8 | 8  | 5  |   |   |   |   |   |   |   |   |
| ... | ...  | ...  | ...  | ...  |   |   |   |   |   |   |   |   |

The planner table will responsively collapse and repeat as the browser window narrows through 6x, 4x, 3x down to a single month column on mobile.

### Themes (Light & Dark)

The year planner offers configurable light (default) and dark themes.  
<em>Currently requires the url parameter theme=[light|dark]</em>

### Translations

The year planner is available in 10 popular languages:  
English, Chinese (traditional), Hindi, Arabic, Spanish, Portuguese, French, Russian, Indonesian and Japanese.

### Backlog

- \[ \] Settings dropdown menu
- \[ \] Save theme in preferences
- \[ \] Switches for light and dark themes in settings menu
- \[ \] Dark theme dropdowns
- \[ \] Dark theme modals

- \[ \] 2x 26 week semester view
- \[ \] 4x 13 week term view
- \[ \] Export to CSV
  
- \[ \] Disable non-current year, dark theme on switch
- \[ \] Register a user
- \[ \] Subscribe via payment gateway (Square)
- \[ \] Save planner to PAYG storage
- \[ \] Fetch planner from PAYG storage for subcribed user.
- \[ \] Expire a subscriber

### Recent Features Added
- \[x\] Colourise cells
- \[x\] Year nav (+-1)
- \[x\] Mark past cells, emphasise today
- \[x\] Current, last and next year nav links




