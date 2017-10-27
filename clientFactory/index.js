
const clients = {
    consul: require('./consul'),
    consulWatch: require('./consulWatch'),
    ut: require('./ut'),
    utWatch: require('./utWatch')
};

module.exports = (config) => {
    if (config.options.watch) {
        config.type += 'Watch';
    }
    let Constructor = clients[config.type];
    if (!Constructor) {
        throw new Error(`Unknown registry type: ${config.type}! Available types: consul, ut}`);
    }
    return new Constructor(config.config, config.context, config.options);
};
