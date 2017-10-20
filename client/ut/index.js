const Client = require('../index');
const consulUtils = require('../consul/utils');
const WebSocket = require('ws');
const UtPortJsonRpc = require('ut-port-jsonrpc');
const cache = require('../../cache');
class UtClient extends Client {
    init(port) {
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
        this.ws = [];
        this.cache = cache.init(port.bus);
        ['start', 'ready', 'stop'].forEach((method) => {
            this[method] = () => this.client[method];
        });
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
        var msg = consulUtils.encode(definition, this.context);
        return this.client.send(msg, {method: 'registry.service.add'});
    }

    initWs(wss, service) {
        this.ws[service] = new WebSocket(`ws://${wss.address}/serviceRegistry/${service}`);
        this.ws[service].on('message', (data) => {
            let msg = JSON.parse(data);
            if (msg && msg.service !== undefined) {
                if (msg.data !== undefined && msg.data.length > 0) {
                    return this.cache.set(msg.service, msg.data);
                } else {
                    return this.cache.del(msg.service);
                }
            }
        });
        this.ws[service].on('close', () => {
            return this.cache.del(service);
        });
    }

    serviceFetch(criteria) {
        return this.cache.get(criteria.service)
            .then((records) => {
                if (records && records.length) {
                    return records;
                }
                return this.client.send(criteria, {method: 'registry.service.fetch'})
                    .then((result) => {
                        if (result && result.records && result.records.length === 0) {
                            return result.records;
                        }

                        this.initWs(result.wss, criteria.service);
                        return this.cache.set(criteria.service, result.records);
                    });
            })
            .then((records) => {
                return consulUtils.decode(records, criteria);
            });
    }
};

module.exports = UtClient;
