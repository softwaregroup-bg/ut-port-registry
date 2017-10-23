const clients = {
    consul: require('./consul'),
    consulWatch: require('./consulWatch')
};

const defaultConfig = {
    type: 'consul',
    config: {},
    context: {}
};

module.exports = (config) => {
    let mergedConfig = Object.assign({}, defaultConfig, config);
    let Constructor = clients(mergedConfig.type);
    if (!Constructor) {
        throw new Error(`Uknown registry type: ${mergedConfig.type}! Available types: ${Object.keys(clients).join(', ')}`);
    }
    return new Constructor(config.config, config.context);
};
