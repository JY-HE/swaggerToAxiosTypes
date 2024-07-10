const path = require('path');
const fs = require('fs');
const { readJson } = require('fs-extra');

function getType(item) {
    let type = '';
    if (item.typeNameMap) {
        type = item.type === 'array' ? `${item.typeNameMap}[]` : item.typeNameMap;
    } else {
        type = item.type === 'array' ? 'any[]' : item.type === 'object' ? 'any' : item.type;
    }
    return type === 'integer' ? 'number' : type;
}

async function createMarkdown(bizName, data) {
    const schemaData = await readJson(path.join(__dirname, '/dist/schema.json'));
    /**
     * 处理公共的type类型定义
     */
    const bizNameSchemaData = schemaData[bizName];
    const commonTypeMdTemplate = Object.entries(bizNameSchemaData).reduce((pre, [name, data]) => {
        let formatParamsStr = '';
        let formatTypesStr = '';
        if (data.type === 'object') {
            formatParamsStr = data.properties.reduce((str, i) => {
                return `${str} * ${i.key} {${getType(i)}} ${i.description}\n`;
            }, '');
            formatTypesStr = data.properties.reduce((str, i) => {
                return `${str}      ${i.key}${!i.required ? '?:' : ':'} ${getType(i)};\n`;
            }, '');
            formatTypesStr = `type ${data.commonTypeName} = {\n ${formatTypesStr}}`;
        } else {
            if (data.type === 'integer' && data.enum) {
                for (let i = 0; i < data.enum.length; i += 1) {
                    formatTypesStr = formatTypesStr + ` ${data.enum[i]} ${i === data.enum.length - 1 ? ';' : '|'}`;
                }
                formatTypesStr = `type ${data.commonTypeName} = ${formatTypesStr}`;
            } else {
                formatTypesStr = `type ${data.commonTypeName} = ${data.type === 'integer' ? 'number' : data.type}\n`;
            }
        }
        return pre + '\n/**\n * ' + data.description + '\n' + formatParamsStr + '*/\n' + formatTypesStr + '\n\n';
    }, '');

    /**
     * 处理api接口的类型定义
     */
    const typeMdTemplate = data.reduce((pre, item) => {
        /**
         * 处理请求参数类型定义
         */
        let formatParamsData = item.methods === 'get' ? item.parameters || [] : [].concat(item.parameters || [], item.requestBody || []) || [];
        const formatRequestParamsStr = formatParamsData.reduce((str, i) => {
            return `${str} * @${i?.in === 'header' ? 'headers' : 'params'} ${i.key} {${getType(i)}} ${i.description}${i.default ? ' 默认：' + i.default : ''} ${i.required ? '（必填）' : ''}\n`;
        }, '');
        const formatRequestTypeStr = formatParamsData.reduce((str, i) => {
            return `${str}      ${i.key}${!i.required ? '?:' : ':'} ${getType(i)};\n`;
        }, '');

        /**
         * 处理响应参数类型定义
         */
        const formatResponsesData = item.responses || [];
        const formatResponsesParamsStr = formatResponsesData.reduce((str, i) => {
            return `${str} * ${i.key} {${getType(i)}} ${i.description}\n`;
        }, '');
        const formatResponsesTypeStr = formatResponsesData.reduce((str, i) => {
            return `${str}      ${i.key}: ${getType(i)};\n`;
        }, '');

        return (
            pre +
            `${formatParamsData.length > 0 ? `\n/**\n * ${item.summary}——请求参数类型定义\n${formatRequestParamsStr}*/\n type ${item.requestTypeName} = {\n${formatRequestTypeStr}}\n\n` : ''}` +
            `${item.responses ? `\n/**\n * ${item.summary}——响应参数类型定义\n${formatResponsesParamsStr}*/\n type ${item.responsesTypeName} = {\n${formatResponsesTypeStr}}\n\n` : ''}`
        );
    }, '');

    const templateFormat = commonTypeMdTemplate + '\n----\n' + typeMdTemplate;

    await fs.writeFileSync(path.join(__dirname, `/dist/${bizName}.md`), templateFormat, 'utf8');
}

module.exports = {
    createMarkdown,
};
