const utCache = require('ut-cache');

module.exports = {
    init: function(bus) {
        utCache.init(bus);
        return utCache.collection('registry');
    }
};
