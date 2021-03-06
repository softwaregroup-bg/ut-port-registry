const EventEmitter = require('events');
let cache = {};
class Client extends EventEmitter {
    constructor(config = {}, context = {}, options = {}) {
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
        this.options = options;
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

    start(port) {
        // can be overriden by child class
        this.log = port.log;
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

    getCache(key) {
        return Promise.resolve(cache[key]);
    }

    setCache(key, value) {
        cache[key] = value;
        return Promise.resolve(value);
    }
}

module.exports = Client;
