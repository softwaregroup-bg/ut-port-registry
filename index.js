const ScriptPort = require('ut-port-script');

class RegistryPort extends ScriptPort {
    constructor() {
        super();
        Object.assign(this.config, {
            id: 'registry',
            logLevel: 'debug',
            type: 'consul',
            config: {},
            context: {}
        });
    }

    init() {
        let Client;
        switch (this.config.type) {
            default:
                Client = require('./client/consul');
        }
        let client = new Client(this.config.config, this.config.context);
        this.bus.registerLocal(client.getPublicApi(), this.config.id);
        ['start', 'ready', 'stop'].forEach((method) => {
            this[method] = () => {
                return Promise.resolve()
                    .then(() => client[method]())
                    .then(() => super[method]());
            };
        });
        return client.init(this.bus).then(() => super.init());
    }
}

module.exports = RegistryPort;
