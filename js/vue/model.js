import { feature } from './model-features.js'
import { calendarState } from './model/calendar.js';
import { plannerState } from './model/planner.js';
import { authState } from './model/auth.js';
import { uiState } from './model/ui.js';

const model = {
    qualifier : '@alt-html/year-planner/vue/controller',
    logger : null,
    api : null,
    messages : null,
    storage : null,
    storageLocal : null,

    feature : feature,

    ...calendarState,
    ...plannerState,
    ...authState,
    ...uiState,
}

export { model };
