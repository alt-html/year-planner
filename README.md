# Year Planner: a multi-lingual general and student year planner

Find the live year planner at Amazon CloudFront [Year Planner](https://d1uamxeylh4qir.cloudfront.net/ "Year Planner")

Example planners:

- [2021 Moon Phases](https://d1uamxeylh4qir.cloudfront.net?share=NobwRADGBcCMBssAcSDsAmdEAsAaMsMYAsgPYBeAlgDbUCGA9AKwB0EABABQDqlAdgBNSAdwDO7AHIAVdrAhsA3O15942JQA81SgE4A3aEnkQAlOwDiAUwDGAa1IMsciHNjsAYpR2WAZqQ0MRmxgAL644FDQWOiw+ITQYJZ8YPjoMBD4AMww4NHx4ElEZKR87AAKABZ0opbieSmJokTu1bXsApbs9F0Arnx07PX4AA4ALs2t4gID1D0DQ2B0OkSAomCAjGCA5GCAtGCAImDsGzuAQmDr7IBGYIAGYKeAhmANPssJlZPtnd2zfJ0LFZREgFiQgECQgDJIQCykIAGSEAdJCAPkh2D8QYBiSEGEBiDUoAgmNXYACEevRSgsAFZ0IiAA4ZAD8MgGeGQCrDIByhkAJQyALoYETFAC56DR0PSIgBIQQAMIIB2EEA0iDsQDYIIBhEEAvCAChbkCpEQAQ5oAPt0ZsBZIRVuDyuFAYHgOUgRAa8TAgB4NwDo+w00glQnFstAInq4kRDYBEfbNerCYCwOsiYH1DsAyPsui1u9BIT12ggOwCo+8pSNQfOxislUq6wuBsKGLfaEiaA963bB8rqM+Gs86k4G4gBOdPezNG-1l3OpVDVn1ZqMAZT4InjpBKOdCKa1Ldr2YbloI1ttRYNTv7QYLXtbdbnqRDNsLNeLRqj3FIOgAtj2+2PVanh1vR+7XXFzVPNzPS1fy+7Inel4b60-G+7tevFyOozKfhbCPRMvwHcIwEnDd31NE84gXMMHxXAg1zfWsUNgKs-yQv0UPQX90IvKN3GoERLB0UC50HW8YJHODwLzV86IvR9zW-WBmxw6cw3Y8dkHPGdPz4oM024+9I3YdtRh0OhhAAIwonQAE8qJPQdEJ4rMGJEuJmP-VjMKYQTeOvAguKIoT8OggyZyjLE7DUxisk0iTtOoyC0JY5D4InEyi10ghjPE99hLMzB-O3KTRh6HQAHNLBKJzAsyfTcPc3zMlcpcPPACzvIdNizNgGz0uXXyPRCgD2AAYT3UoE3w7DLIdHSzNSyLcqHKrDN8krIo-fC0q0qKAAklj0WpRmS8KvNs1qurElqS0w7KRzC58sIG+zLDoSbKMair8vmjLGMHJaCpWvq1ovDaOLmsrDSjOrqAEGbn3QY7HrawMQgAXT+oA)

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

- \[ \] Dark theme dropdowns
- \[ \] Dark theme modals
- \[ \] Expand entry icon set with select dropdown, or remove
  
- \[ \] 2x 26 week semester view
- \[ \] 4x 13 week term view
- \[ \] Export to CSV
  
- \[ \] Donate via payment gateway (Square)
- \[ \] Expire a donation


### Recent Features Added
- \[x\] Register a user
- \[x\] Save planner to server storage
- \[x\] Fetch planner from server storage for registered user.
- \[x\] New planner 
- \[x\] Delete planner 
- \[x\] Navigation between stored planner years
- \[x\] Trigger rename in settings menu
- \[x\] i81n rename
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




