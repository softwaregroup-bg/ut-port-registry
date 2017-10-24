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
    compare: function(service, localData, remoteData) {
        return Promise.resolve()
        .then(() => {
            if (Array.isArray(localData) && Array.isArray(remoteData) && remoteData.length !== localData.length) {
                return true;
            }

            let compareResult = remoteData.some((remote) => {
                let local = localData.find((local) => { return local.Service.ID === remote.Service.ID; });

                if (local === undefined) {
                    return true;
                }

                let serviceDiff = Object.keys(local.Service)
                    .filter((key) => { return key !== 'CreateIndex' && key !== 'ModifyIndex' && key !== 'Tags'; })
                    .reduce((diff, key) => {
                        if (local.Service[key] === remote.Service[key]) {
                            return diff;
                        }

                        // It is ok to overwrite the previous value.
                        return [{
                            [key]: remote.Service[key]
                        }];
                    }, {});

                if (serviceDiff.length > 0) {
                    return true;
                }

                if (local.Service.Tags.length !== remote.Service.Tags.length) {
                    return true;
                }

                let tagDiff = remote.Service.Tags.reduce((diff, value) => {
                    if (local.Service.Tags.includes(value)) {
                        return diff;
                    }

                    // It is ok to overwrite the previous value.
                    return [value];
                }, {});

                if (tagDiff.length > 0) {
                    return true;
                }

                let checksDiff = remote.Checks.reduce((diff, remoteEntry) => {
                    let localEntry = local.Checks.find((entry) => { return entry.CheckID === remoteEntry.CheckID; });

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
