import { model } from "../vue/model.js";

async function fetchJSON(url, options = {}) {
    const headers = {
        'Accept': 'application/json',
        ...options.headers,
    };
    if (options.body && typeof options.body === 'string') {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }
    const text = await response.text();
    return text ? JSON.parse(text) : {};
}

//  Client SDK to server side sync API
//  See api/openapi.yaml for the API contract
export default class Api {
    constructor(model, storageLocal, syncClient, authProvider) {
        this.qualifier = '@alt-html/year-planner/Api'
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.syncClient = syncClient;
        this.authProvider = authProvider;
    }

    // Bearer token from federated auth provider
    _authHeaders() {
        const token = this.authProvider?.getToken();
        if (!token) return {};
        return { 'Authorization': 'Bearer ' + token };
    }

    // POST /year-planner/sync — 3-way merge sync via SyncClient
    async sync(plannerId) {
        if (!this.storageLocal.signedin() || !plannerId) return;
        try {
            const doc = this.storageLocal._getPlnrDoc(plannerId);
            const merged = await this.syncClient.sync(plannerId, doc, this._authHeaders());
            if (merged) {
                this.storageLocal._setPlnrDoc(plannerId, merged);
                this.model.planner = this.storageLocal._docToMonthArray(merged);
            }
            this.model.error = ''; // clear any stale error on successful sync
        } catch (err) {
            console.error(`[Api.sync] sync failed: status=${err.status} message=${err.message}`);
            if (err.status == 404)
                this.model.error = 'error.apinotavailable';
            else if (err.status == 401) {
                this.authProvider?.signOut?.();
                this.model.signedin = false;
                this.model.error = 'error.unauthorized';
            }
            else
                this.model.error = 'error.syncfailed';
        }
    }

    // DELETE /api/planner — delete user account
    deleteAccount() {
        fetchJSON(`${this.url}api/planner`, {
            method: 'DELETE',
            headers: this._authHeaders(),
        })
            .then(body => {
                this.model.response = body;
                this.model.uuid = '';
            })
            .catch(err => {
                this.model.error = 'error.syncfailed';
            });
    }

    modalErr(target, err) {
        if (!model.modalErrorTarget) {
            model.modalErrorTarget = {};
        }
        model.modalErrorTarget[target] = err;
        model.touch = model.touch ? '' : ' ';
    }
}
