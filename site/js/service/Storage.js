export default class Storage {

    constructor(api, model, storageLocal) {
        this.qualifier = '@alt-html/year-planner/Storage'
        this.logger = null;

        this.api = api;
        this.model = model;
        this.storageLocal = storageLocal;
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
