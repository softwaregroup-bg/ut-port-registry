const consul = require('consul');
const Client = require('../index');
class ConsulClient extends Client {
    constructor(config) {
        super(config);
        this.consul = consul(Object.assign({}, config, {promisify: true}));
    }

    addService(config) {
        return this.consul.agent.service.register(config);
    }

    getService(id) {
        return this.consul.agent.service.list()
            .then((list) => {
                let service = list[id];
                if (!service) {
                    return null;
                }
                return {
                    address: service.Address,
                    port: service.Port
                };
            });
    }
};

module.exports = ConsulClient;
