const clients = {
    consul: require('./consul'),
    consulWatch: require('./consulWatch'),
    ut: require('./ut'),
    utWatch: require('./utWatch')
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
        throw new Error(`Unknown registry type: ${config.type}! Available types: consul, ut}`);
    }
    return new Constructor(config.config, config.context, config.options);
};
