const consul = require('consul');
const Client = require('../index');
const getServiceDefinition = (service) => {
    return {
        host: service.ServiceAddress,
        port: service.ServicePort
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
        return this.consul.catalog.service.nodes({
            service: criteria.name
        })
        .then((services) => {
            delete criteria.name;
            let criteriaKeys = Object.keys(criteria);
            if (criteriaKeys.length) {
                return services.reduce((all, service) => {
                    if (criteriaKeys.every(key => {
                        return service.ServiceTags.find(tag => {
                            return tag === `${key}=${criteria[key]}`;
                        });
                    })) {
                        all.push(getServiceDefinition(service));
                    }
                    return all;
                }, []);
            }
            return services.map(getServiceDefinition);
        });
    }
};

module.exports = ConsulClient;
