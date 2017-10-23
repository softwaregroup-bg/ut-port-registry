const Consul = require('../consul');
const utils = require('../consul/utils');
class ConsulWatch extends Consul {
    init() {
        this.watchers = {};
        return super.init();
    }

    setWatcher(service) {
        this.watchers[service] = this.consul.watch({
            method: this.consul.health.service,
            options: {
                service
            }
        });
        this.watchers[service].on('change', (data) => {
            return this.getCache(service)
                .then((cache) => {
                    if (utils.compare(service, data, cache)) {
                        return this.setCache(service, data)
                            .then((data) => {
                                return this.emit('change', {service: service, data: data});
                            });
                    }
                    return cache;
                });
        });
    }

    serviceFetch(criteria) {
        return this.getCache(criteria.service)
            .then((records) => {
                if (records !== undefined) {
                    return records;
                }
                return super.serviceFetch({
                    service: criteria.service,
                    raw: true
                })
                .then((records) => {
                    if (!records.length) {
                        return records;
                    }
                    return this.setCache(criteria.service, records)
                        .then((records) => {
                            this.setWatcher(criteria.service);
                            return records;
                        });
                });
            })
            .then((records) => {
                return utils.decode(records, criteria);
            });
    }
};

module.exports = ConsulWatch;
