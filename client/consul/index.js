const consul = require('consul');
const utils = require('./utils');
const Client = require('../index');
const cache = require('../../cache');
class ConsulClient extends Client {
    init(port) {
        this.consul = consul(Object.assign(
            // defaults
            {
                host: '127.0.0.1',
                port: '8500',
                secure: false,
                ca: []
            },
            // custom
            this.config,
            // override
            {
                promisify: true
            }
        ));

        if (typeof port.config.watch === 'function') {
            this.watch = port.config.watch;
            this.watchers = {};
            this.cache = cache.init(port.bus);
        }

        return this.consul.agent.self();
    }

    serviceAdd(definition) {
        var msg = utils.encode(definition, this.context);
        return this.consul.agent.service.register(msg);
    }

    serviceFetch(criteria) {
        return this.getCache(criteria.service)
            .then((records) => {
                if (records && records.length > 0) {
                    return records;
                }

                return this.consul.health.service({
                    service: criteria.service,
                    passing: criteria.passing,
                    dc: criteria.dc
                });
            })
            .then((records) => {
                if (records && records.length > 0) {
                    return this.setCache(criteria.service, records);
                }

                return records;
            })
            .then((records) => utils.decode(records, criteria));
    }

    getCache(service) {
        if (this.cache) {
            return this.cache.get(service);
        }

        return Promise.resolve([]);
    }

    setCache(service, records) {
        if (this.cache) {
            if (!this.watchers[service]) this.setWatcher(service);
            return this.cache.set(service, records);
        }

        return Promise.resolve(records);
    }

    setWatcher(service) {
        this.watchers[service] = this.consul.watch({
            method: this.consul.health.service,
            options: { service: service }});

        this.watchers[service].on('change', (data) => {
            return utils.compare(service, data, this.cache)
                .then((result) => {
                    if (!result) {
                        return null;
                    }

                    return this.watch({service: service, data: data});
                });
        });
    };
};

module.exports = ConsulClient;
