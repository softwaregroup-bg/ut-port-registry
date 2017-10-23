const Consul = require('../consul');
const utils = require('./consul/utils');
const cache = require('../cache');
class ConsulWatch extends Consul {
    init() {
        this.cache = cache();
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
            return this.cache.get(service)
                .then((cache) => {
                    if (utils.compare(service, data)) {
                        return this.cache.set(service, data)
                            .then(() => {
                                return this.log.info && this.log.info(data);
                            })
                            .catch((e) => {
                                return this.log.error && this.log.error(e);
                            });
                    }
                    return cache;
                });
        });
    }

    serviceFetch(criteria) {
        return this.cache.get(criteria.service)
            .then((records) => {
                if (records !== null) {
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
                    return this.cache.set(criteria.service, records)
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
