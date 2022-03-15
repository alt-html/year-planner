import LZString from 'https://cdn.jsdelivr.net/npm/lz-string/libs/lz-string.min.js/+esm';

export default class Storage {

    constructor(api,model, storageLocal) {
        this.api = api;
        this.model = model;
        this.storageLocal = storageLocal;
    }


    getPlanner (uid, year) {
        //if signed in get remote planner otherwise local
        return this.storageLocal.getLocalPlanner(uid, year);
    }

    deletePlannerByYear (uid, year) {
        this.storageLocal.deleteLocalPlannerByYear(uid, year);
        this.api.synchroniseToRemote();
    }

    exportPlannerToJSON (){
        return JSON.stringify(this.model.planner);
    }

    exportPlannerToBase64 (){
        return LZString.compressToBase64(this.exportPlannerToJSON());
    }

    setPlanner (uid, year, planner) {
        this.storageLocal.setLocalPlanner(uid, year, planner);
    }



    updateMonthColour (mindex, day, entryColour) {

        for (let i = day + 1; i <= this.model.daysInMonth[mindex]; i++) {
            let entry = this.getEntry(mindex, i);
            let entryType = this.getEntryType(mindex, i);
            let syncToRemote = (i == this.model.daysInMonth[mindex]);
            this.updateEntry(mindex, i, entry, entryType, entryColour, syncToRemote);
            //(mindex,day,entry,entryType,entryColour,syncToRemote)
            //function(mindex,day,entry,entryType,entryColour)
        }
    }

     getExportString (){
        let exporter = [];
        exporter.push(this.storageLocal.getLocalIdentity(this.model.uid));
        exporter.push(this.model.preferences);
        exporter.push(this.model.year);
        exporter.push(this.model.planner);
        return LZString.compressToEncodedURIComponent(JSON.stringify(exporter));
    }

     setModelFromImportString (importUrlParam) {
        if ('' != importUrlParam) {
            let importer = JSON.parse(LZString.decompressFromEncodedURIComponent(importUrlParam));
            this.model.uid = importer[0]['0'];
            if (!this.storageLocal.getLocalIdentity(this.model.uid)) {
                this.model.identities.push(importer[0]);
            }
            this.model.preferences = importer[1]
            this.model.year = importer[2];
            this.model.planner = importer[3];
            this.model.lang = this.model.preferences['1'];
            this.model.theme = this.model.preferences['2'] == 1 ? 'dark' : 'light';
            let theme = this.model.theme;
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
