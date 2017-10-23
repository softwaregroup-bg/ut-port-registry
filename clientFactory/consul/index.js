const consul = require('consul');
const utils = require('./utils');
const Client = require('../client');
class Consul extends Client {
    init() {
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
        return this.consul.agent.self();
    }

    serviceAdd(definition) {
        var msg = utils.encode(definition, this.context);
        return this.consul.agent.service.register(msg)
            .then(() => Promise.resolve({success: true}));
    }

    serviceFetch(criteria) {
        return this.consul.health.service({
            service: criteria.service,
            passing: criteria.passing,
            dc: criteria.dc
        })
        .then((records) => {
            return utils.decode(records, criteria);
        });
    }
};

module.exports = Consul;
