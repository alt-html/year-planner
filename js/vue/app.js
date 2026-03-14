import { model } from './model.js';
import { calendarMethods } from './methods/calendar.js';
import { entryMethods } from './methods/entries.js';
import { plannerMethods } from './methods/planner.js';
import { authMethods } from './methods/auth.js';
import { lifecycleMethods } from './methods/lifecycle.js';

const app = Vue.createApp({
    data() {
        return model;
    },
    methods: {
        ...calendarMethods,
        ...entryMethods,
        ...plannerMethods,
        ...authMethods,
        ...lifecycleMethods,
    },
    mounted() {
        this.refresh();
    }
});

export { app }
