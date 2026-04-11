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
            this.model.uid = importer[0]['0'];
            if (!this.storageLocal.getLocalIdentity(this.model.uid)) {
                this.model.identities.push(importer[0]);
            }
            this.model.preferences = importer[1];
            this.model.year = importer[2];
            const imported = importer[3];
            // Clear existing days (mutate in-place to preserve Vue reactive proxy)
            Object.keys(this.model.days).forEach(k => delete this.model.days[k]);
            if (Array.isArray(imported)) {
                // Old share format: 12-element month array [m][day] = dayObj
                for (let m = 0; m < 12; m++) {
                    if (!imported[m]) continue;
                    for (const [day, dayObj] of Object.entries(imported[m])) {
                        if (!dayObj) continue;
                        const month = String(m + 1).padStart(2, '0');
                        const d = String(day).padStart(2, '0');
                        const isoDate = `${importer[2]}-${month}-${d}`;
                        this.model.days[isoDate] = {
                            tp:    dayObj['0'] !== undefined ? dayObj['0'] : (dayObj.tp    || 0),
                            tl:    dayObj['1'] !== undefined ? dayObj['1'] : (dayObj.tl    || ''),
                            col:   dayObj['2'] !== undefined ? dayObj['2'] : (dayObj.col   || 0),
                            notes: dayObj['3'] !== undefined ? dayObj['3'] : (dayObj.notes || ''),
                            emoji: dayObj['4'] !== undefined ? dayObj['4'] : (dayObj.emoji || ''),
                        };
                    }
                }
            } else if (imported && typeof imported === 'object') {
                // New share format: ISO-date map
                Object.assign(this.model.days, imported);
            }
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
