const path = require('path');
const fs = require('fs');

async function createMarkdown(bizName, data) {
    const t = data.reduce((pre, item) => {
        // 复杂类型再定义type
        const complexTypes = item.responses?.filter((i) => {
            ['array', 'object'].includes(i.type) && i?.details;
        });
        const formatComplexTypesParamsStr = complexTypes.details.reduce((str, i) => {
            return `${str} * ${i.key} {${i.type === 'integer' ? 'number' : i.type}} ${i.description}\n`;
        }, '');
        const formatComplexTypesStr = complexTypes.details.reduce((str, i) => {
            return `${str}      ${i.key}: ${i.type === 'integer' ? 'number' : i.type};\n`;
        }, '');
    });
    const typeMdTemplate = data.reduce((pre, item) => {
        /**
         * 处理请求参数类型定义
         */
        let formatParamsData = item.methods === 'get' ? item.parameters || [] : [].concat(item.parameters || [], item.requestBody || []) || [];
        const formatRequestParamsStr = formatParamsData.reduce((str, i) => {
            return `${str} * @${i?.in === 'header' ? 'headers' : 'params'} ${i.key} {${i.type}} ${i.description}${i.default ? ' 默认：' + i.default : ''} ${i.required ? '（必填）' : ''}\n`;
        }, '');
        const formatRequestTypeStr = formatParamsData.reduce((str, i) => {
            return `${str}      ${i.key}${!i.required ? '?:' : ':'} ${i.type};\n`;
        }, '');

        /**
         * 处理响应参数类型定义
         */

        // 处理简单类型
        const formatResponsesData = item.responses || [];
        const formatResponsesParamsStr = formatResponsesData.reduce((str, i) => {
            return `${str} * ${i.key} {${i.type === 'integer' ? 'number' : i.type}} ${i.description}\n`;
        }, '');
        const formatResponsesTypeStr = formatResponsesData.reduce((str, i) => {
            const type = i.type === 'integer' ? 'number' : i.type;
            // let type = '';
            // if (i.type === 'array') {
            //     type = `${item.responsesTypeName}${i.key}[]`;
            // } else if (i.type === 'object') {
            //     type = `${item.responsesTypeName}${i.key}`;
            // } else {
            //     type = i.type === 'integer' ? 'number' : i.type;
            // }
            return `${str}      ${i.key}: ${type};\n`;
        }, '');

        return (
            pre +
            `${formatParamsData.length > 0 ? `\n/**\n * ${item.summary} 请求参数类型定义\n${formatRequestParamsStr}*/\n type ${item.requestTypeName} = {\n${formatRequestTypeStr}}\n\n` : ''}` +
            `${item.responses ? `\n/**\n * ${item.summary} 响应参数类型定义\n${formatResponsesParamsStr}*/\n type ${item.responsesTypeName} = {\n${formatResponsesTypeStr}}\n\n` : ''}`
        );
    }, '');

    await fs.writeFileSync(path.join(__dirname, `/dist/${bizName}.md`), typeMdTemplate, 'utf8');
}

module.exports = {
    createMarkdown,
};
