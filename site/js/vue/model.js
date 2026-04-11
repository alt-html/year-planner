import { feature } from './model-features.js'
import { calendarState } from './model/calendar.js';
import { plannerState } from './model/planner.js';
import { authState } from './model/auth.js';
import { uiState } from './model/ui.js';

const model = {
    qualifier : '@alt-html/year-planner/vue/controller',
    logger : null,
    api : null,
    authProvider : null,
    messages : null,
    storage : null,
    storageLocal : null,
    plannerStore : null,
    syncScheduler : null,

    feature : feature,

    ...calendarState,
    ...plannerState,
    ...authState,
    ...uiState,
}

export { model };
