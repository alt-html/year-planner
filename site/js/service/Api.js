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
    constructor(model, storageLocal, plannerStore, authProvider) {
        this.qualifier = '@alt-html/year-planner/Api';
        this.logger = null;

        this.url = '${api.url}';
        this.model = model;
        this.storageLocal = storageLocal;
        this.plannerStore = plannerStore;
        this.authProvider = authProvider;
    }

    // Bearer token from federated auth provider
    _authHeaders() {
        const token = this.authProvider?.getToken();
        if (!token) return {};
        return { 'Authorization': 'Bearer ' + token };
    }

    // POST /year-planner/sync — delegates to PlannerStore.sync()
    async sync() {
        const signedin = this.storageLocal.signedin();
        this.logger?.debug?.(`[Api.sync] called signedin=${signedin}`);
        if (!signedin) {
            this.logger?.warn?.('[Api.sync] skipping — not signed in');
            return;
        }
        try {
            const results = await this.plannerStore.sync(this._authHeaders());
            if (results) this.model.error = '';
        } catch (err) {
            this.logger?.error?.(`[Api.sync] failed status=${err.status} message=${err.message}`);
            const isNetworkFailure = !err?.status || err?.name === 'TypeError' || /failed to fetch|networkerror/i.test(String(err?.message || ''));
            if (err.status === 404 || isNetworkFailure) {
                this.model.error = 'error.apinotavailable';
            } else if (err.status === 401) {
                this.authProvider?.signOut?.();
                this.model.signedin = false;
                this.model.error = 'error.unauthorized';
            } else if (err.status === 400) {
                // 400 = bad request / validation rejection — silent failure, don't alarm the user
                this.logger?.warn?.('[Api.sync] server rejected payload (400) — skipping');
            } else {
                this.model.error = 'error.syncfailed';
            }
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
            .catch(() => {
                this.model.error = 'error.syncfailed';
            });
    }

    modalErr(target, err) {
        if (!this.model.modalErrorTarget) {
            this.model.modalErrorTarget = {};
        }
        this.model.modalErrorTarget[target] = err;
        this.model.touch = this.model.touch ? '' : ' ';
    }
}
