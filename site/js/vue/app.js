import { model } from './model.js';
import { calendarMethods } from './methods/calendar.js';
import { entryMethods } from './methods/entries.js';
import { plannerMethods } from './methods/planner.js';
import { authMethods } from './methods/auth.js';
import { lifecycleMethods } from './methods/lifecycle.js';

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
    },
    mounted() {
        this.refresh();
        // Bootstrap 4 fires modal events via jQuery's $.trigger(), not native DOM events.
        // Must use jQuery .on() — addEventListener() will never catch them.
        if (window.jQuery) {
            window.jQuery('#authModal').on('shown.bs.modal', () => {
                this.signInWith('google');
            });
        }
    }
};

export { app }
