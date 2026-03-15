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
    constructor(model, storageLocal, storageRemote, authProvider) {
        this.qualifier = '@alt-html/year-planner/Api'
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.storageRemote = storageRemote;
        this.authProvider = authProvider;
    }

    // Bearer token from federated auth provider
    _authHeaders() {
        const token = this.authProvider?.getToken();
        if (!token) return {};
        return { 'Authorization': 'Bearer ' + token };
    }

    // POST /api/planner — push local data to server
    synchroniseToRemote() {
        if (this.storageLocal.signedin()) {
            let localData = this.storageLocal.getLocalStorageData();
            fetchJSON(`${this.url}api/planner`, {
                method: 'POST',
                headers: this._authHeaders(),
                body: JSON.stringify(localData),
            })
                .then(body => {
                    this.storageLocal.extendLocalSession();
                })
                .catch(err => {
                    if (err.status == 404)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 401)
                        this.model.error = 'error.unauthorized';
                    else
                        this.model.error = 'error.syncfailed';
                })
        }
    }

    // GET /api/planner — pull data from server
    synchroniseToLocal(syncPrefs) {
        if (this.storageLocal.signedin()) {
            fetchJSON(`${this.url}api/planner`, {
                method: 'GET',
                headers: this._authHeaders(),
            })
                .then(body => {
                    this.model.response = body;
                    this.model.uuid = body.uuid;
                    this.storageLocal.extendLocalSession();
                    this.storageRemote.synchroniseLocalPlanners(body.data, syncPrefs);
                })
                .catch(err => {
                    if (err.status == 405)
                        this.model.error = 'error.apinotavailable';
                    else if (err.status == 400)
                        this.model.error = 'error.usernotavailable';
                    else
                        this.model.error = 'error.syncfailed';
                });
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
