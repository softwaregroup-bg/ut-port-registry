const EventEmitter = require('events');
class Client extends EventEmitter {
    constructor(config = {}, context = {}) {
        super();
        // validations
        // check whether essantial methods had been implemented
        if (typeof this.serviceAdd !== 'function') {
            throw new Error('serviceAdd must be implemented');
        }
        if (typeof this.serviceFetch !== 'function') {
            throw new Error('serviceFetch must be implemented');
        }
        this.config = config;
        this.context = context;
        this.getPublicApi = () => {
            return {
                service: {
                    add: (config = {}) => {
                        return this.serviceAdd(config);
                    },
                    fetch: (criteria = {}) => {
                        return this.serviceFetch(criteria);
                    }
                }
            };
        };
    }

    init() {
        // can be overriden by child class
        return Promise.resolve();
    }

    start() {
        // can be overriden by child class
        return Promise.resolve();
    }

    ready() {
        // can be overriden by child class
        return Promise.resolve();
    }

    stop() {
        // can be overriden by child class
        return Promise.resolve();
    }
}

module.exports = Client;
