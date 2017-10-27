const ConsulWatch = require('../consulWatch');
const UtPortJsonRpc = require('ut-port-jsonrpc');
const mergeWith = require('lodash.mergewith');

class UtClient extends ConsulWatch {
    init() {
        this.client = new UtPortJsonRpc();

        Object.assign(
            this.client.config,
             // defaults
            {

            },
            // custom
            this.config,
            // override
            {
                method: 'post',
                raw: {
                    json: true,
                    jar: true,
                    strictSSL: false
                },
                parseResponse: false
            }
        );

        this.client.send = (msg, $meta) => {
            $meta.mtid = 'request';
            return this.client.exec(this.client.config.send(msg, $meta), $meta)
                .then((response) => {
                    return this.client.config.receive(response, $meta);
                });
        };
        return Promise.resolve(this.client.init());
    }

    serviceAdd(definition) {
        mergeWith(definition.context, this.context);
        return this.client.send(definition, {method: 'registry.service.add'});
    }

    serviceFetch(criteria) {
        return this.client.send(criteria, {method: 'registry.service.fetch'});
    }
}
module.exports = UtClient;
