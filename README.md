# Year Planner: a multi-lingual general and student year planner

Find the live year planner at Amazon CloudFront [Year Planner](https://d1uamxeylh4qir.cloudfront.net/ "Year Planner")

Example planners:

- [2021 Moon Phases](https://d1uamxeylh4qir.cloudfront.net?share=NobwRADGBcCMBssAcSDsAmdEAsAaMsMYAsgPYBeAlgDbUCGA9AKwB0EABABQDqlAdgBNSAdwDO7AHIAVdrAhsA3O15942JQA81SgE4A3aEnkQAlOwDiAUwDGAa1IMsciHNjsAYpR2WAZqQ0MRmxgAL644FDQYJZ8obhY6LC4oGDwMBFEYPiEUYA8G4Do+1lg6JlhBADM6ZCZ2US5gIj7RSVRccWRGS21eYDI+02l+OhIVZFgRTlguYCo+8qk1D7sZKSxA6Vh4NjDNQR1hSstZbA5HaNdE417owcAnJud2z19+wOotyf3E9MAynwiC6RLj0ua1SrzGO0BrVglWgxzBeXOxX6xSO1Tu41yvQurUGoNOUxmOgAtn8AViQsCNjDUW90btEU8CM1YXiEc1LgN2tS4RNMfT2cU0lSRtz8QAFfi2EnLPmhYHQ5nvAoQg4o4Us5XZIZCrbjDUEG7atF1Xls7GChXo6buagiSw6KXK4FMrl4ummg6ctWK1lI2AvQ00rbuzW4xUmpHoSkWupfAAuOjowgARnadABPB1k4GqnXgsnZT25+F62BMUO6-MEf3Rh6V9Dyl2K6YAIQArnZMzKyuUc0a8m7VuEwFqa2cSw2vRWu9kywGReGGZhyzH2J9Y62dABzSxLTvBsDlQt9iYDhk95d3d3A6uN9E+hlQi88vVYJ-4gDCpB0fD3EYNo6VStDyfR0h3NW86nvflHznPEF35V9YKbdgAAk6H0SxRFjX9FxHCD+1A9Y3ygyFe0DWtp31N8W0sOg9DtHCEJvSc8y7CliJLMj5xLPCWLyaZP2oARGOxZiixPR0AF1JKAA)

## How it works

The Year planner is a responsive (mobile-first) single-page HTML application that uses browser storage (cookies) to store, navigate and display clickable tweet sized Western (Gregorian) calendar diary entries.  

Entries are <em>not</em> sent to or stored in the "cloud" by design.  Each browser instance stores and maintains an independent instance (copy) of your planner, but can be <em>shared</em> across browsers by using the share icon in the navigation header.

Shared planners maintain a "unique" timestamp identifier for the instant that they were created (to second precision).  Within a small set, any given planner's shared identifier is probably unique, however they are not universal and a shared planner will over-write a planner with the same identifier if opened in the same browser.

Multiple planners with different "unique" identifiers can be named and stored in a given browser, allowing for different use cases (home, work, study).

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

### Translations

The year planner is available in 10 popular languages:  
- English 
- Chinese (traditional)
- Hindi
- Arabic
- Spanish
- Portuguese
- French
- Russian
- Indonesian
- Japanese

### Backlog

- \[ \] Trigger rename in settings menu
- \[ \] i81n rename
- \[ \] Dark theme dropdowns
- \[ \] Dark theme modals
- \[ \] Expand entry icon set with select dropdown, or remove
  
- \[ \] 2x 26 week semester view
- \[ \] 4x 13 week term view
- \[ \] Export to CSV
  
- \[ \] Register a user
- \[ \] Save planner to server storage
- \[ \] Fetch planner from server storage for registered user.
- \[ \] Donate via payment gateway (Square)
- \[ \] Expire a donation


### Recent Features Added
- \[x\] Colourise cells
- \[x\] Year nav (+-1)
- \[x\] Mark past cells, emphasise today
- \[x\] Current, last and next year nav links
- \[x\] Save theme in preferences
- \[x\] Named planners, with i81n nuance
- \[x\] Settings dropdown menu
- \[x\] Switches for light and dark themes in settings menu
- \[x\] Theme i81n

### Parking Lot
- \[ \] Twemoji support (https://kevinfaguiar.github.io/vue-twemoji-picker/ + https://codesandbox.io/s/vue-twemoji-picker-umdiife-example-we3co?from-embed=&file=/index.html)
- \[ \] Disable non-current year, dark theme on switch




