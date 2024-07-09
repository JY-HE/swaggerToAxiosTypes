const path = require('path');

module.exports = {
    /** 静态资源存储目录 */
    STATIC_PATH: path.join(__dirname, '../dist'),
    /** 首页模板地址 */
    INDEX_HTML_PATH: path.join(__dirname, '../dist/index.html'),
    /** API管理模板地址 */
    ADMIN_HTML_PATH: path.join(__dirname, '../dist/admin.html'),
    /** 脚本执行根目录 */
    SCRIPT_PATH: path.join(__dirname, '../'),
    /** api资源存储路径  */
    API_RESOURCE_PATH: path.join(__dirname, '../dist/biz.json'),
    /** 忽略API存储路径 */
    IGNORE_API_PATH: path.join(__dirname, '../ignoreTypes.json'),
    /** 仓库API存储路径 */
    WAREHOUSE_API_PATH: path.join(__dirname, '../warehouseTypes.json'),
    /** changelog文档路径 */
    CHANGELOG_PATH: path.join(__dirname, '../dist/changeLog.md'),
    /** 远端仓库 */
    DOC_CODE_STORE: path.join(__dirname, '../../web-biz-type-index'),
    /** 远端API路径 */
    DOC_CODE_STORE_BIZ: path.join(__dirname, '../../web-biz-type-index/biz.json'),
    /** 远端文档路径 */
    DOC_CODE_STORE_HTML: path.join(__dirname, '../../web-biz-type-index/index.html'),
};
