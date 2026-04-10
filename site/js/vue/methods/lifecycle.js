export const lifecycleMethods = {

    refresh() {
        this.setYear(this.year);
        if (!this.storageLocal.initialised()){
            this.initialise();
        }
        const plannerId = this.storageLocal.getActivePlnrUuid(this.uid, this.year);
        this.api.sync(plannerId);
        this.storageLocal.setLocalFromModel();
        if (!window.location.href.includes('?uid=')){
            window.location.href = window.location.origin +'?uid='+this.uid+'&year='+this.year+'&lang='+this.lang+'&theme='+this.theme;
        }
        if (this.theme =='dark'){
            document.body.classList.add("yp-dark");
        }else{
            document.body.classList.remove("yp-dark");
        }
        this.loaded=true;
        if (this._showSigninPester) {
            this._showSigninPester = false;
            this.$nextTick(() => { jQuery('#authModal').modal('show'); });
        }
    },

    initialise() {
        this.storageLocal.setLocalIdentities (this.identities);
        this.storageLocal.setLocalPreferences(this.uid,{0:this.year,1:this.lang,2:(this.theme == 'dark'?1:0),3:this.preferences['3']||null});
        this.storageLocal.setLocalPlanner(this.uid,this.year,this.planner);
    },

     clearError () {
        this.error = '';
    },
}
