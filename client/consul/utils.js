const getServiceDefinition = (record) => {
    return {
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
    }
};
