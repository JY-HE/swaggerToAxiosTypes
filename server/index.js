const express = require('express');
const path = require('path');
const { readFileSync, readJson, writeFileSync, ensureFile, copyFileSync } = require('fs-extra');
const childProcess = require('child_process');
const bodyParser = require('body-parser');
const axios = require('axios');
const url = require('./const');

const app = express();
const router = express.Router();
router.use(express.static(url.STATIC_PATH));
router.get('/', (req, res) => {
    res.sendFile(url.INDEX_HTML_PATH);
});
router.get('/admin', (req, res) => {
    res.sendFile(url.ADMIN_HTML_PATH);
});
app.use(router);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/** 获取新接口 */
app.get('/api/newApi', async (req, res) => {
    // 爬取旧接口
    await childProcess.execSync('npm run buildNew', { cwd: url.SCRIPT_PATH, encoding: 'utf8' });
    // 将../dist/biz.json内容以json格式返回出去
    const data = await readFileSync(url.API_RESOURCE_PATH, 'utf8');
    res.send({
        status: 200,
        msg: 'success',
        data: JSON.parse(data),
    });
});

/** 编辑新接口 */
app.post('/api/newApi', async (req, res) => {
    // 方法名获取
    const params = req.body || {};
    console.log('开始保存数据');
    await writeFileSync(url.API_RESOURCE_PATH, JSON.stringify(params, null, 2));
    // 生成markdowm文档
    console.log('开始生成文档');
    await childProcess.execSync('npm run md', { cwd: url.SCRIPT_PATH, encoding: 'utf8' });
    console.log('开始获取文档内容');
    // 将markdown文档内容获取并输出
    const data = await readFileSync(url.CHANGELOG_PATH, 'utf8');
    console.log('开始将新增方法写入仓库');
    // 将新增方法写入仓库
    const warehouseTypes = await readJson(url.WAREHOUSE_API_PATH);
    for (const k in params) {
        Reflect.set(warehouseTypes, k, {
            ...warehouseTypes[k],
            ...params[k].reduce(
                (obj, item) => ({
                    ...obj,
                    [`${item.method}&${item.url}`]: {
                        requestTypeName: item.requestTypeName,
                        responsesTypeName: item.responsesTypeName,
                    },
                }),
                {}
            ),
        });
    }

    await writeFileSync(url.WAREHOUSE_API_PATH, JSON.stringify(warehouseTypes, null, 2));
    res.send({
        status: 200,
        msg: 'success',
        data: data,
    });
});

/** 获取markdown文本内容 */
app.get('/api/getMarkdown', async (req, res) => {
    const { bizName } = req.query;
    const markdownData = await readFileSync(path.join(__dirname, `../dist/${bizName}.md`), 'utf8');
    if (markdownData) {
        res.send({
            status: 200,
            msg: 'success',
            data: markdownData,
        });
    } else {
        res.send({
            status: 403,
            msg: '找不到文件',
            data: '',
        });
    }
});

/** 将接口添加到忽略 */
app.post('/api/ignore', async (req, res) => {
    const { bizName, apiUrl } = req.body;
    const ignoreTypes = await readJson(url.IGNORE_API_PATH);
    const biz = ignoreTypes[bizName];
    // 判断ignorePaths中是否存在bizName，不存在添加，存在则判断url是否存在，不存在则添加,已经存在则忽略
    if (biz && biz.includes(apiUrl)) {
        console.log('重复操作');
        res.send({
            data: '重复操作',
            status: 403,
            msg: 'success',
        });
    } else {
        const newData = { ...ignoreTypes, [bizName]: biz ? [...biz, apiUrl] : [apiUrl] };
        await writeFileSync(url.IGNORE_API_PATH, JSON.stringify(newData, null, 2));
        console.log(`${bizName}添加忽略项${apiUrl}成功`);
        res.send({
            data: '添加成功',
            status: 200,
            msg: 'success',
        });
    }
});

/** 生成文档 */
app.post('/api/doc', async (req, res) => {
    await childProcess.execSync('npm run md', { cwd: url.SCRIPT_PATH, encoding: 'utf8' });
});

/** 获取旧接口 */
app.get('/api/oldApi', async (req, res) => {
    // 爬取旧接口
    await childProcess.execSync('npm run buildOld', { cwd: url.SCRIPT_PATH, encoding: 'utf8' });
    const data = await readJson(url.API_RESOURCE_PATH);
    res.send({
        status: 200,
        msg: 'success',
        data: data,
    });
});

/** 获取当前biz.json的接口 */
app.get('/api/currentApi', async (req, res) => {
    const data = await readJson(url.API_RESOURCE_PATH);
    res.send({
        status: 200,
        msg: 'success',
        data: data,
    });
});

/** 获取旧接口的方法名集合 */
app.get('/api/warehouse', async (req, res) => {
    const apiData = await readJson(url.WAREHOUSE_API_PATH);
    res.send({
        status: 200,
        msg: 'success',
        data: apiData,
    });
});

/** 更新文档到线上 */
app.post('/api/updateDoc', async (req, res) => {
    try {
        const { version } = req.body;
        // 传了版本号则正则替换掉index.html中的版本号，没传则只将biz.json复制到文档仓库中
        if (version) {
            const indexHtml = await readFileSync(url.INDEX_HTML_PATH, 'utf8');
            const reg = /<el-tag class="version" type="danger">版本:(.*)<\/el-tag>/g;
            const result = indexHtml.replace(reg, `<el-tag class="version" type="danger">版本:${version}</el-tag>`);
            await writeFileSync(url.INDEX_HTML_PATH, result);
            await copyFileSync(url.INDEX_HTML_PATH, url.DOC_CODE_STORE_HTML);
        }
        // 将biz.json复制到文档仓库中
        await copyFileSync(url.API_RESOURCE_PATH, url.DOC_CODE_STORE_BIZ);
        // 提交代码
        await childProcess.execSync('git add . && git commit -m "docs:' + version + '文档更新" && git push', { cwd: url.DOC_CODE_STORE, encoding: 'utf8' });

        res.send({
            status: 200,
            msg: 'success',
            data: '更新成功',
        });
    } catch (error) {
        res.send({
            status: 403,
            msg: 'error',
            data: error,
        });
    }
});

app.listen(3001, () => {
    console.log('server is running on port 3001');
});
