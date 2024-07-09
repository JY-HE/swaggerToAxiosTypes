const path = require('path');
const fs = require('fs');
const { createMarkdown } = require('./jsonToMd');
const requestConfig = require('./dist/biz.json');

const newMethods = {};

let changeLogTemplate = '';

let warehouseMethodsTemPlate = ``;

(async () => {
    // 处理warehouseMethods内容生成
    for (const key in requestConfig) {
        await createMarkdown(key, requestConfig[key]);
        // warehouseMethodsTemPlate += `\n### ${key}\n`;
        changeLogTemplate += `\n### ${key}\n\n|requestTypeName|responsesTypeName|url|methodType|describe|version|\n| --------- | --------- | --------- | --------- | --------- | --------- |\n`;
        newMethods[key] = requestConfig[key].reduce((obj, item) => {
            if (item.requestTypeName || item.responsesTypeName) {
                changeLogTemplate += '|`' + item.requestTypeName + '`|`' + item.responsesTypeName + '`|`' + item.url + '`|' + item.method + '|' + item.summary + '|' + item.version + '|\n';
                // warehouseMethodsTemPlate += `'${item.methods}&${item.url}${item.version != 'v1' ? '&' + item.version : ''}':'${item.methodName}',\n`;
            }
            return {
                ...obj,
                [`${item.method}&${item.url}`]: {
                    requestTypeName: item.requestTypeName,
                    responsesTypeName: item.responsesTypeName,
                },
            };
        }, {});
    }
    const template = `${changeLogTemplate}`;
    await fs.writeFileSync(path.join(__dirname, `/dist/changeLog.md`), template, 'utf8');
})();
