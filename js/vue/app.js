import { model } from './model.js';
import { controller } from './controller.js';

const app = Vue.createApp({
    data() {
        return model;
    },
    methods: controller,
    mounted() {
        this.refresh();
    }
});

export { app }













