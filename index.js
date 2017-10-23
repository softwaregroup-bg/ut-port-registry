const ScriptPort = require('ut-port-script');
const clientFactory = require('./clientFactory');

class RegistryPort extends ScriptPort {
    constructor() {
        super();
        Object.assign(this.config, {
            id: 'registry',
            logLevel: 'debug',
            config: {},
            context: {}
        });
    }

    init() {
        let client = clientFactory(this.config.client);
        this.bus.registerLocal(client.getPublicApi(), this.config.id);
        ['start', 'ready', 'stop'].forEach((method) => {
            this[method] = () => {
                return Promise.resolve()
                    .then(() => client[method]())
                    .then(() => super[method]());
            };
        });

        client.on('change', (data) => {
            if (client.options.watchMethod !== undefined) {
                return this.bus.importMethod(client.options.watchMethod)(data);
            }
        });

        return client.init().then(() => super.init());
    }
}

module.exports = RegistryPort;
