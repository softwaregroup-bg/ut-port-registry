const mergeWith = require('lodash.mergewith');
const semver = require('semver');
const getServiceDefinition = (record, raw) => {
    return raw ? record : {
        host: record.Service.Address,
        port: record.Service.Port
    };
};

module.exports = {
    encode: (definition = {}, context = {}) => {
        let mergedContext = mergeWith({}, context, definition.context);
        definition.tags = Object.keys(mergedContext).map(key => `${key}=${mergedContext[key]}`);
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
                        if (key === 'version' && tag.startsWith(key)) {
                            return semver.satisfies(semver.clean(tag.split('=').pop()), criteria[key]);
                        }

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
        if (!Array.isArray(localData) || !Array.isArray(remoteData)) {
            return true;
        }
        if (remoteData.length !== localData.length) {
            return true;
        }

        let compareResult = remoteData.some((remote) => {
            let local = localData.find((local) => { return local.Service.ID === remote.Service.ID; });
            if (local === undefined) {
                return true;
            }
            if (compareObj(local.Service, remote.Service, ['CreateIndex', 'ModifyIndex', 'Tags'])) {
                return true;
            }
            if (local.Service.Tags.length !== remote.Service.Tags.length) {
                return true;
            }
            if (compareArr(local.Service.Tags, remote.Service.Tags)) {
                return true;
            }
            if (local.Checks.length !== remote.Checks.length) {
                return true;
            }
            if (compareArrOfObjects(local.Checks, remote.Checks, 'CheckID', ['CreateIndex', 'ModifyIndex', 'ServiceTags'])) {
                return true;
            }
        });

        return compareResult;
    }
};

function compareObj(localData, remoteData, excludeKey) {
    return Object.keys(localData)
        .filter((key) => { return !excludeKey.includes(key); })
        .some((key) => { return localData[key] !== remoteData[key]; });
}

function compareArr(localData, remoteData) {
    return localData.some((value) => {
        return !remoteData.includes(value);
    });
}

function compareArrOfObjects(localData, remoteData, matchKey, excludeKey) {
    return localData.some((local) => {
        let remote = remoteData.find((entry) => { return entry[matchKey] === local[matchKey]; });
        return compareObj(local, remote, excludeKey);
    });
}
