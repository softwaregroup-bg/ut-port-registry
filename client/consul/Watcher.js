class Watcher {
    constructor(consul, service) {
        this.data = [];
        this.consul = consul;
        this.service = service;
        this.watcher = consul.watch({
            method: consul.health.service,
            options: {
                service: service,
                passing: true
            }
        });
        this.watcher.on('change', (data, res) => {
            this.data = data;
        });
        this.watcher.on('error', (err) => {
            console.log('ERRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR', err);
        });
    }
    get services() {
        return this.data.length ? Promise.resolve(this.data) : this.consul.health.service({
            service: this.service,
            passing: true,
        });
    }
    stop() {
        this.watcher.end();
    }
}

module.exports = Watcher;
