class Client {
    constructor(config) {
        this.config = config;
    }

    init() {
        return Promise.resolve();
    }

    start() {
        // validate whether essantial methods had been implemented
        if (typeof this.addService !== 'function') {
            return Promise.reject(new Error('addService must be implemented'));
        } else if (typeof this.getService !== 'function') {
            return Promise.reject(new Error('getService must be implemented'));
        }
        return Promise.resolve();
    }

    ready() {
        return Promise.resolve();
    }

    stop() {
        return Promise.resolve();
    }

    getPublicApi() {
        return {
            service: {
                add: (config) => {
                    return this.addService(config);
                },
                get: (id) => {
                    return this.getService(id);
                }
            }
        };
    }
}

module.exports = Client;
