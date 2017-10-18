const Client = require('../index');
const consulUtils = require('./consul/utils');
const WebSocket = require('ws');
const UtPortHttp = require('ut-port-http');
const utCache = require('ut-cache');
class UtClient extends Client {
    init(bus) {
        this.client = new UtPortHttp();
        Object.assign(
            this.client.config,
             // defaults
            {
                method: 'post',
                namespace: [
                    'registry'
                ],
                raw: {
                    json: true,
                    jar: true,
                    strictSSL: false
                },
                parseResponse: false,
                ws: []
            },
            // custom
            this.config,
            // override
            {}
        );
        utCache.init(bus);
        this.cache = utCache.collection('registry');
        ['start', 'ready', 'stop'].forEach((method) => {
            this[method] = () => this.client[method];
        });
        return this.client.init();
    }

    serviceAdd(definition) {
        var msg = consulUtils.encode(definition, this.context);
        return this.client.exec(msg, {});
    }

    serviceFetch(criteria) {
        const initWs = (context, wss, service) => {
            context.config.ws[service] = new WebSocket(`ws://${wss.address}/serviceRegistry/${service}`);

            context.config.ws[service].on('message', (data) => {
                let msg = JSON.parse(data);

                if (msg && msg.service !== undefined) {
                    if (msg.data !== undefined && msg.data.length > 0) {
                        return context.config.cache.set(msg.service, msg.data);
                    } else {
                        return context.config.cache.del(msg.service);
                    }
                }
            });

            context.config.ws[service].on('close', () => {
                return context.config.cache.del(service);
            });
        };

        return this.cache.get(criteria.service)
            .then((records) => {
                if (records && records.length) {
                    return records;
                }
                return this.client.exec(criteria, {})
                    .then((result) => {
                        if (result && result.records && result.records.length === 0) {
                            return result.records;
                        }

                        initWs(this, result.wss, criteria.service);
                        return this.cache.set(criteria.service, result.records);
                    });
            })
            .then((records) => {
                return consulUtils.decode(records, criteria);
            });
    }
};

module.exports = UtClient;
