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
    },
    compare: function(service, data, registryCache) {
        return Promise.resolve()
        .then(() => registryCache.get(service))
        .then((cache) => {
            if (Array.isArray(cache) && Array.isArray(data) && data.length !== cache.length) {
                return true;
            }

            let compareResult = data.some((remoteData) => {
                let localData = cache.find((localData) => { return localData.Service.ID === remoteData.Service.ID; });

                if (localData === undefined) {
                    return true;
                }

                let serviceDiff = Object.keys(localData.Service)
                    .filter((key) => { return key !== 'CreateIndex' && key !== 'ModifyIndex' && key !== 'Tags'; })
                    .reduce((diff, key) => {
                        if (localData.Service[key] === remoteData.Service[key]) {
                            return diff;
                        }

                        // It is ok to overwrite the previous value.
                        return [{
                            [key]: remoteData.Service[key]
                        }];
                    }, {});

                if (serviceDiff.length > 0) {
                    return true;
                }

                if (localData.Service.Tags.length !== remoteData.Service.Tags.length) {
                    return true;
                }

                let tagDiff = remoteData.Service.Tags.reduce((diff, value) => {
                    if (localData.Service.Tags.includes(value)) {
                        return diff;
                    }

                    // It is ok to overwrite the previous value.
                    return [value];
                }, {});

                if (tagDiff.length > 0) {
                    return true;
                }

                let checksDiff = remoteData.Checks.reduce((diff, remoteEntry) => {
                    let localEntry = localData.Checks.find((entry) => { return entry.CheckID === remoteEntry.CheckID; });

                    let d = Object.keys(localEntry)
                        .filter((key) => { return key !== 'CreateIndex' && key !== 'ModifyIndex' && key !== 'ServiceTags'; })
                        .reduce((diff, key) => {
                            if (localEntry[key] === remoteEntry[key]) {
                                return diff;
                            }

                            // It is ok to overwrite the previous value.
                            return [{
                                [key]: remoteEntry[key]
                            }];
                        }, {});

                    return d;
                }, {});

                if (checksDiff.length > 0) {
                    return true;
                }
            });

            return compareResult;
        });
    }
};
