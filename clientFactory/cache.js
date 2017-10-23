const utCache = require('ut-cache');

module.exports = (config = {}) => {
    utCache.init({
        config: {
            cache: config
        }
    });
    return utCache.collection('registry');
};
