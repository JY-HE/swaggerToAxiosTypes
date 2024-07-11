const { createMarkdown } = require('./jsonToMd');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { readJson } = require('fs-extra');
const { argv } = require('process');
const { swaggerJSON } = require('./config');

// biz请求配置
let requestConfig = {};
let schemaData = {};
const descReg = /\r|\n|;\"|(<.+\/?>)/g;

/**
 * swagger转json并生成markdown
 * @param {Number} buildType {0:打印全部，1：打印没有入库的方法，2：打印入库了的方法}
 */
async function init(buildType = 0) {
    // swagger文档地址列表
    let swaggerList = {};
    const bizNameList = [];
    const warehouseTypes = await readJson(path.join(__dirname, './warehouseTypes.json'));
    Object.entries(swaggerJSON).forEach(([bizName, swaggerDataConfig]) => {
        bizNameList.push(bizName);
        const { primaryName, address, port, url } = swaggerDataConfig;
        // 走54429
        const headers = primaryName ? { 'X-Service-Address': address, 'X-Service-Port': port } : {};
        if (typeof url === 'string') {
            swaggerList[bizName] = { url, headers, params: { ip: address, port } };
        } else {
            Object.keys(url).forEach((version) => {
                swaggerList[`${bizName}-${version}`] = { url: url[version], headers, params: { ip: address, port } };
            });
        }
        requestConfig[bizName] = [];
    });
    /**
     * 请求swagger文档接口数据
     */
    console.log('请求拼装成功，开始请求swagger文档接口数据');
    const res = await Promise.all(
        Object.values(swaggerList).map((item) => {
            let requestUrl = item.url;
            if (item.params.ip && item.params.port) {
                requestUrl = `${requestUrl}?ip=${item.params.ip}&port=${item.params.port}`;
            }
            return axios.get(requestUrl, { headers: item.headers });
        })
    ).catch((error) => {
        const errorMsg = `请求错误,错误码:${error.code}，请求url:${error.config.url}`;
        throw new Error(errorMsg);
    });
    res.forEach((item) => console.log(item.config.url, item.status === 200 ? `success` : 'fail'));
    // 过滤忽略的接口
    const ignorePaths = await readJson(path.join(__dirname, './ignoreTypes.json'));
    let newSchemaDataJson = {};
    /**
     * 解析swagger文档接口数据
     */
    res.map(async (bizRes, index) => {
        try {
            const {
                paths,
                components: { schemas },
            } = bizRes.data;
            // 当前处理的 biz 名称
            let bizName = Object.keys(swaggerList)[index];
            console.log('开始处理' + bizName);
            // 当前处理的 biz 版本
            let version = 'v1';
            if (bizName.includes('-v')) {
                const [n, v] = bizName.split('-');
                bizName = n;
                version = v;
            }
            // 当前处理 biz 的类型定义数据
            const warehouseTypesData = warehouseTypes[bizName] || {};
            /**
             * schema 模型处理
             */
            schemaData = Object.entries(schemas).reduce((pre, [schemaName, schemaData]) => {
                if (schemaData.type === 'object') {
                    const { type, properties = {}, description = '', required = [] } = schemaData;
                    // 解析接口响应参数
                    const params = Object.entries(properties).map(([key, value]) => {
                        if (value.$ref || value.allOf || value.items?.$ref) {
                            // 存在 $ref 说明是引用了常量字段参数
                            let refName = '';
                            if (value.$ref) {
                                refName = value.$ref.split('/')?.at(-1);
                            } else if (value.allOf) {
                                refName = value.allOf.at(0)?.$ref.split('/')?.at(-1);
                            } else if (value.items?.$ref) {
                                refName = value.items.$ref.split('/')?.at(-1);
                            }
                            // 在常量字段参数对象中查找
                            const refObj = pre[refName] || {};
                            // 如果常量字段是一个对象或者数组对象
                            const details = refObj.properties ? [...refObj.properties] : null;
                            return {
                                key,
                                type: value.type || refObj.type,
                                description: value.description ? value.description.replace(descReg, '') : refObj.description ? refObj.description.replace(descReg, '') : '',
                                required: required.includes(key),
                                // details: details,
                                // 映射的公共type名称
                                typeNameMap: refObj.commonTypeName || refName ? `${refName.split('.')?.at(-1)}CommonType` : '',
                            };
                        } else {
                            return {
                                key,
                                type: value.type,
                                description: value.description ? value.description.replace(descReg, '') : '',
                                required: required.includes(key),
                            };
                        }
                    });
                    return { ...pre, [schemaName]: { type, description: description.replace(descReg, ''), properties: params, commonTypeName: `${schemaName.split('.')?.at(-1)}CommonType` } };
                } else {
                    return { ...pre, [schemaName]: { ...schemaData, commonTypeName: `${schemaName.split('.')?.at(-1)}CommonType` } };
                }
            }, {});
            newSchemaDataJson = { ...newSchemaDataJson, [bizName]: schemaData };

            /**
             * 处理 path 请求
             */
            const ignorePathList = [...ignorePaths.common, ...(ignorePaths[bizName] || [])];
            Object.keys(paths)
                .filter((url) => !ignorePathList.includes(url))
                .forEach((url) => {
                    Object.entries(paths[url]).forEach(([method, value]) => {
                        const { operationId, tags, summary, parameters, requestBody, responses } = value;
                        // 分类
                        const tag = tags.length ? tags[0] : '';
                        // 过滤回调型接口
                        if (tag === 'Callbacks') return;
                        /**
                         * 处理 params 参数
                         */
                        const transformParams = !Array.isArray(parameters)
                            ? null
                            : parameters.map((item) => {
                                  // 基本参数
                                  let paramInfo = {
                                      key: item.name,
                                      type: item.schema?.type,
                                      description: item.description ? item.description.replace(descReg, '') : /id$/i.test(item.name) ? item.name : '',
                                      required: item.required,
                                      default: item.schema?.default || null,
                                      in: item.in,
                                  };
                                  // 走 schema 模型的参数
                                  if (!item.type && (item.schema?.$ref || item.schema?.allOf)) {
                                      const refName = item.schema.$ref ? item.schema.$ref.split('/')?.at(-1) : item.schema?.allOf?.at(0)?.$ref.split('/')?.at(-1);
                                      const refData = schemaData?.[refName] || {};
                                      paramInfo.type = refData?.type;
                                  }
                                  // 请求头参数
                                  if (item.in === 'header') {
                                      paramInfo.in = 'header';
                                      paramInfo.type = item?.schema?.type ?? 'string';
                                  }
                                  return paramInfo;
                              });
                        /**
                         * 处理 requestBody 请求体
                         */
                        let transformRequestBody = null;
                        if (requestBody) {
                            const schemaWrap = requestBody.content['application/json']?.schema ?? {};
                            const schemaRef = schemaWrap?.$ref || schemaWrap?.allOf?.at(0)?.$ref || '';
                            const schemaName = schemaRef.split('/').at(-1);
                            const schema = schemaData[schemaName] || {};
                            transformRequestBody = schema.properties?.map((i) => ({ ...i, in: 'requestBody' })) || [];
                        }
                        /**
                         * 处理 responses 响应
                         */
                        let transformResponses = null;
                        const responsesData = responses['200'] || responses['201'] || responses['204'] || {};
                        if (responsesData.content) {
                            const schemaObj = responsesData.content['application/json'].schema;
                            let responseSchemaRef = schemaObj.$ref || schemaObj?.items?.$ref || '';
                            const responseSchemaName = responseSchemaRef.split('/').at(-1) || '';
                            const transformSchema = schemaData[responseSchemaName] || {};
                            transformResponses = transformSchema.properties || null;
                        }
                        /**
                         * 处理 requestConfig 请求配置
                         */
                        const warehouseTypesDataInfo = warehouseTypesData[`${method}&${url}${version != 'v1' ? '&' + version : ''}`];
                        // 已有的接口不再入库
                        const canSave = buildType == 0 || (buildType == 1 && !warehouseTypesDataInfo) || (buildType == 2 && !!warehouseTypesDataInfo);
                        canSave &&
                            requestConfig[bizName].push({
                                url,
                                tag,
                                method,
                                summary,
                                version,
                                requestTypeName: warehouseTypesDataInfo?.requestTypeName || '',
                                responsesTypeName: warehouseTypesDataInfo?.responsesTypeName || '',
                                operationId,
                                parameters: transformParams,
                                responses: transformResponses,
                                requestBody: transformRequestBody,
                            });
                    });
                });
        } catch (error) {
            console.log('🚀 ~ index.js:112 ~ error:', error);
        }
    });

    // 将 schemaData 写入json文件
    await fs.writeFileSync(path.join(__dirname, `/dist/schema.json`), JSON.stringify(newSchemaDataJson, null, '\t'), 'utf8');

    // 对空的biz模块进行移除
    Reflect.ownKeys(requestConfig).forEach((key) => {
        if (requestConfig[key].length === 0 || key === 'facilityBiz') {
            Reflect.deleteProperty(requestConfig, key);
        } else {
            buildType == 1 && key !== 'facilityBiz' && console.log(`${key} 新增接口${requestConfig[key].length}个`);
        }
    });

    // 将 requestConfig 写入json文件
    await fs.writeFileSync(path.join(__dirname, `/dist/biz.json`), JSON.stringify(requestConfig, null, '\t'), 'utf8');

    if (buildType == 2) {
        console.log('json转化成功，开始生成markdown文件');
        // markdown模板生成;
        for (const key in requestConfig) {
            await createMarkdown(key, requestConfig[key]);
        }
    }
}

init(argv[2]);
