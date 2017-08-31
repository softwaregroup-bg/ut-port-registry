const consul = require('consul');
const Client = require('../index');
const getServiceDefinition = (record) => {
    return {
        host: record.Service.Address,
        port: record.Service.Port
    };
};
class ConsulClient extends Client {
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

    serviceAdd(config) {
        var context = Object.assign({}, this.context, config.context);
        config.tags = Object.keys(context).map(key => `${key}=${context[key]}`);
        return this.consul.agent.service.register(config);
    }

    serviceFetch(criteria) {
        return this.consul.health.service({
            service: criteria.service,
            passing: criteria.passing,
            dc: criteria.dc
        })
        .then((records) => {
            delete criteria.service;
            delete criteria.passing;
            delete criteria.dc;
            let criteriaKeys = Object.keys(criteria);
            if (criteriaKeys.length) {
                return records.reduce((all, record) => {
                    if (criteriaKeys.every(key => {
                        return record.Service.Tags.find(tag => {
                            return tag === `${key}=${criteria[key]}`;
                        });
                    })) {
                        all.push(getServiceDefinition(record));
                    }
                    return all;
                }, []);
            }
            return records.map(getServiceDefinition);
        });
    }
};

module.exports = ConsulClient;
