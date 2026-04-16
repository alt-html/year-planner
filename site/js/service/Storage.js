import LZString from 'https://cdn.jsdelivr.net/npm/lz-string/libs/lz-string.min.js/+esm';

export default class Storage {

    constructor(api, model, storageLocal) {
        this.qualifier = '@alt-html/year-planner/Storage'
        this.logger = null;

        this.api = api;
        this.model = model;
        this.storageLocal = storageLocal;
    }

    exportPlannerToJSON() {
        return JSON.stringify(this.model.days);
    }

    exportPlannerToBase64() {
        return LZString.compressToBase64(this.exportPlannerToJSON());
    }

    getExportString() {
        let exporter = [];
        exporter.push(this.storageLocal.getLocalIdentity(this.model.uid));
        exporter.push(this.model.preferences);
        exporter.push(this.model.year);
        exporter.push(this.model.days);
        return LZString.compressToEncodedURIComponent(JSON.stringify(exporter));
    }

    setModelFromImportString(importUrlParam) {
        if ('' != importUrlParam) {
            let importer = JSON.parse(LZString.decompressFromEncodedURIComponent(importUrlParam));
            // importer[0] was a legacy identity object with numeric uid — uid is no longer
            // set on the model from shared URLs; identity is owned by the receiving device.
            this.model.preferences = importer[1];
            this.model.year = importer[2];
            // Store raw imported data — PlannerStore.importDays applies it after activateDoc
            this.model._pendingImport = importer[3];
            this.model.lang = this.model.preferences['1'];
            this.model.theme = this.model.preferences['2'] == 1 ? 'dark' : 'light';
        }
    }

    download(filename, contentType, text) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:' + contentType + ';charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
}
