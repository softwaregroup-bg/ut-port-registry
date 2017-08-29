const consul = require('consul');
const Client = require('../index');
class ConsulClient extends Client {
    constructor(config) {
        super(config);
        this.consul = consul(Object.assign({}, config, {promisify: true}));
    }

    serviceAdd(config) {
        return this.consul.agent.service.register(config);
    }

    serviceList(criteria) {
        return this.consul.catalog.service.nodes({
            service: criteria.name
        })
        .then((services) => {
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
