import { model } from './model.js';
import { calendarMethods } from './methods/calendar.js';
import { entryMethods } from './methods/entries.js';
import { plannerMethods } from './methods/planner.js';
import { authMethods } from './methods/auth.js';
import { lifecycleMethods } from './methods/lifecycle.js';
import { railMethods } from './methods/rail.js';

// Component definition — passed to Vue.createApp() by createCdiApp in main.js.
const app = {
    data() {
        return model;
    },
    methods: {
        ...calendarMethods,
        ...entryMethods,
        ...plannerMethods,
        ...authMethods,
        ...lifecycleMethods,
        ...railMethods,
    },
    mounted() {
        this.refresh();
        this.initRailInteractions();
        // E2E test hook: exposes signout() on window so Playwright can call it
        // without needing to navigate hidden UI elements.
        if (window.__e2eEnabled) {
            window.__testSignout = () => this.signout();
        }
    }
};

export { app }
