const HttpPort = require('ut-port-jsonrpc');
const cache = require('ut-cache');

class RegistryPort extends HttpPort {
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
        let Client;
        switch (this.config.type) {
            case 'ut':
                Client = require('./client/ut');
                break;
            default:
                Client = require('./client/consul');
        }
        let client = new Client(this.bus, this.config, this.config.context);
        this.bus.registerLocal(client.getPublicApi(), this.config.id);
        ['start', 'ready', 'stop'].forEach((method) => {
            this[method] = () => {
                return Promise.resolve()
                    .then(() => client[method]())
                    .then(() => super[method]());
            };
        });

        this.config.cache = cache;

        return Promise.resolve()
            .then(() => cache.init(this.bus))
            .then(() => client.init())
            .then(() => super.init());
    }
}

module.exports = RegistryPort;
