const Ut = require('../ut');
const consulUtils = require('../consul/utils');
const WebSocket = require('ws');

class UtWatch extends Ut {
    init() {
        this.ws = {};
        this.watchers = {};
        return super.init();
    }

    serviceFetch(criteria) {
        return this.getCache(criteria.service)
            .then((records) => {
                if (records && records.length) {
                    return records;
                }
                return this.client.send(Object.assign(criteria, {raw: true}), {method: 'registry.service.fetch'})
                    .then((data) => {
                        if (data && data.records && data.records.length === 0) {
                            return data.records;
                        }

                        this.initWs(data.socketHost, criteria.service);
                        return this.setCache(criteria.service, data.records);
                    });
            })
            .then((records) => {
                criteria.raw = false;
                return consulUtils.decode(records, criteria);
            });
    }

    initWs(host, service) {
        let socketHost = host || this.config.url.match(/\/+(.*)/)[1];

        this.ws[service] = new WebSocket(`ws://${socketHost}/serviceRegistry/${service}`);
        this.ws[service].on('message', (data) => {
            let msg = JSON.parse(data);
            if (msg && msg.service !== undefined) {
                if (msg.records !== undefined && msg.records.length > 0) {
                    return this.setCache(msg.service, msg.records);
                } else {
                    return this.setCache(msg.service, []);
                }
            }
        });
        this.ws[service].on('close', () => {
            return this.setCache(service, []);
        });
    }
}
module.exports = UtWatch;
