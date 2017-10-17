const Client = require('../index');
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
                url: !this.config.url ? 'http://127.0.0.1:8005' : this.config.url,
                method: 'post',
                namespace: [
                    'registry'
                ],
                raw: {
                    json: true,
                    jar: true,
                    strictSSL: false
                },
                parseResponse: false
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
        return this.config.cache.get(criteria.service)
            .then((records) => {
                if (records && records.length) {
                    return records;
                }

                return this.bus.importMethod('registry.service.serviceFetch')(criteria)
                    .then((records) => {
                        return this.config.cache.set(criteria.service, records);
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
