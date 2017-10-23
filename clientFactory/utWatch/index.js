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
                    .then((result) => {
                        if (result && result.records && result.records.length === 0) {
                            return result.records;
                        }

                        // TODO Fixme
                        this.initWs(result.wss, criteria.service);
                        return this.setCache(criteria.service, result);
                    });
            })
            .then((records) => {
                return consulUtils.decode(records, criteria);
            });
    }

    initWs(wss, service) {
        this.ws[service] = new WebSocket(`ws://127.0.0.1:8005/serviceRegistry/${service}`); // TODO Fixme
        this.ws[service].on('message', (data) => {
            let msg = JSON.parse(data);
            if (msg && msg.service !== undefined) {
                if (msg.data !== undefined && msg.data.length > 0) {
                    return this.setCache(msg.service, msg.data);
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
