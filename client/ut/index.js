const Client = require('../index');
const WebSocket = require('ws');

const getServiceDefinition = (record) => {
    return {
        host: record.Service.Address,
        port: record.Service.Port
    };
};
class UtClient extends Client {
    init(cache) {
        this.config = Object.assign(
            // custom
            this.config,
            // override
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
            }
        );
        this.config.cache = this.config.cache.collection('registry');
    }

    serviceAdd(config) {
        var context = Object.assign({}, this.context, config.context);
        config.tags = Object.keys(context).map(key => `${key}=${context[key]}`);
        return this.bus.importMethod('registry.service.serviceAdd')(config);
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

        return this.config.cache.get(criteria.service)
            .then((records) => {
                if (records && records.length) {
                    return records;
                }

                return this.bus.importMethod('registry.service.serviceFetch')(criteria)
                    .then((result) => {
                        if (result && result.records && result.records.length === 0) {
                            return result.records;
                        }

                        initWs(this, result.wss, criteria.service);
                        return this.config.cache.set(criteria.service, result.records);
                    });
            })
            .then((records) => {
                delete criteria.service;
                delete criteria.passing;
                delete criteria.dc;
                let criteriaKeys = Object.keys(criteria);
                if (criteriaKeys.length) {
                    return records.reduce((all, record) => {
                        if (criteriaKeys.every(key => {
                            return record.Service.Tags.find(tag => {
                                return tag === `${key}=${criteria[key]}`;
                            });
                        })) {
                            all.push(getServiceDefinition(record));
                        }
                        return all;
                    }, []);
                }
                return records.map(getServiceDefinition);
            });
    }
};

module.exports = UtClient;
