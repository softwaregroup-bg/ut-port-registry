const clients = {
    consul: require('./consul'),
    consulWatch: require('./consulWatch')
};

const defaultConfig = {
    type: 'consul',
    options: {},
    config: {},
    context: {}
};

module.exports = (clientConfig) => {
    let config = Object.assign({}, defaultConfig, clientConfig);
    config.type = config.options.watch ? `${config.type}Watch` : config.type;
    let Constructor = clients[config.type];
    if (!Constructor) {
        throw new Error(`Uknown registry type: ${config.type}! Available types: ${Object.keys(clients).join(', ')}`);
    }
    return new Constructor(config.config, config.context, config.options);
};