const consul = require('consul');
const Client = require('../index');
class ConsulClient extends Client {
    init() {
        this.consul = consul({
            host: this.config.host || '127.0.0.1',
            port: this.config.port || '8500',
            promisify: true
        });
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
                var result = services.reduce((all, service) => {
                    if (criteriaKeys.every(key => {
                        return service.ServiceTags.find(tag => {
                            return tag === `${key}=${criteria[key]}`;
                        })
                    })) {
                        all.push(service);
                    }
                    return all;
                }, []);
                return result;
            }
            return services.map((service) => {
                return {
                    host: service.ServiceAddress,
                    port: service.ServicePort
                }
            })
        });
    }
};

module.exports = ConsulClient;
