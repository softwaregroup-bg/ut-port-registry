const getServiceDefinition = (record, raw) => {
    return raw ? record : {
        host: record.Service.Address,
        port: record.Service.Port
    };
};

module.exports = {
    encode: (definition = {}, context = {}) => {
        let mergedContext = Object.assign({}, context, definition.context);
        definition.tags = Object.keys(context).map(key => `${key}=${mergedContext[key]}`);
        return definition;
    },
    decode: (records = [], criteria = {}) => {
        let raw = criteria.raw;
        delete criteria.raw;
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
                    all.push(getServiceDefinition(record, raw));
                }
                return all;
            }, []);
        }
        return records.map((record) => getServiceDefinition(record, raw));
    }
};
