class Client {
    // constructor(config) {
    //     // validate config if necessary
    // }

    init() {
        return Promise.resolve();
    }

    start() {
        // validate whether essantial methods had been implemented
        if (typeof this.serviceAdd !== 'function') {
            return Promise.reject(new Error('serviceAdd must be implemented'));
        } else if (typeof this.serviceFetch !== 'function') {
            return Promise.reject(new Error('serviceFetch must be implemented'));
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
                    return this.serviceAdd(config || {});
                },
                fetch: (criteria) => {
                    return this.serviceFetch(criteria || {});
                }
            }
        };
    }
}

module.exports = Client;
