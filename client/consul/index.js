const consul = require('consul');
const Client = require('../index');
const Watcher = require('./Watcher');
const getServiceDefinition = (record) => {
    return {
        host: record.Service.Address,
        port: record.Service.Port,
        id: record.Service.Id
    };
};
class ConsulClient extends Client {
    init() {
        this.watchers = {};
        this.consul = consul(Object.assign(
            // defaults
            {
                host: '127.0.0.1',
                port: '8500',
                secure: false,
                ca: []
            },
            // custom
            this.config,
            // override
            {
                promisify: true
            }
        ));
        var watch = this.consul.watch({
            method: this.consul.health.service,
            options: {
                service: 'dfsp-account',
                passing: true
            }
        });
        watch.on('change', function(data, res) {
          console.log('data:', data);
        });

        watch.on('error', function(err) {
          console.log('error:', err);
        });

        return this.consul.agent.self();
    }

    stop() {
        Object.keys(this.watchers).forEach((key) => {
            this.watchers[key].stop();
        });
        return super.stop();
    }

    serviceAdd(config) {
        var context = Object.assign({}, this.context, config.context);
        config.tags = Object.keys(context).map(key => `${key}=${context[key]}`);
        return this.consul.agent.service.register(config);
    }

    serviceFetch(criteria) {
        var watcher = this.watchers[criteria.service];
        if (!watcher) {
            watcher = this.watchers[criteria.service] = new Watcher(this.consul, criteria.service);
        }
        return watcher.services.then((data) => {
            delete criteria.service;
            let criteriaKeys = Object.keys(criteria);
            if (criteriaKeys.length) {
                return data.reduce((all, record) => {
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
            return data.map(getServiceDefinition);
        });
    }
};

module.exports = ConsulClient;
