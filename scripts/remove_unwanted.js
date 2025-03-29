const esprima = require('esprima');    // 用于解析 JavaScript 代码
const escodegen = require('escodegen'); // 用于生成 JavaScript 代码

// 递归遍历并过滤 AST 节点
function filterAstNodes(node) {
    if (Array.isArray(node)) {
        return node
            .map(filterAstNodes)
            .filter(Boolean); // 过滤掉为 null 的节点
    }

    if (node && typeof node === 'object') {
        // 删除函数名包含 "webgazer" 的函数
        if (node.type === 'FunctionDeclaration' && node.id?.name.startsWith('webgazer')) {
            return null;
        }

        // 删除 "mousemove" 的事件监听器
        if (
            node.type === 'ExpressionStatement' &&
            node.expression?.callee?.object?.name === 'document' &&
            node.expression?.callee?.property?.name === 'addEventListener' &&
            node.expression?.arguments[0]?.value === 'mousemove'
        ) {
            return null;
        }

        // 删除与 $('#pagination-container').pagination 相关的代码
        if (
            node.type === 'ExpressionStatement' &&
            node.expression?.type === 'CallExpression' &&
            node.expression?.callee?.object?.callee?.object?.callee?.name === '$' &&
            node.expression?.callee?.object?.callee?.object?.arguments[0]?.value === "#pagination-container"
        ) {
            return null;
        }

        // 删除与 $('#pagination-container').pagination(result['index']);
        if (
            node.type === 'ExpressionStatement' &&
            node.expression?.type === 'CallExpression' &&
            node.expression?.callee?.object?.callee?.name === '$' &&
            node.expression?.callee?.object?.arguments[0]?.value === "#pagination-container"
        ) {
            return null;
        }

        // 递归处理子节点
        for (const key in node) {
            if (node[key] && typeof node[key] === 'object') {
                node[key] = filterAstNodes(node[key]);
            }
        }
    }

    return node; // 返回处理后的节点
}

// 从标准输入读取原始 JavaScript
process.stdin.setEncoding('utf8');
process.stdin.on('data', function (js_code) {
    try {
        // 解析 JavaScript 为 AST
        const ast = esprima.parseScript(js_code, { range: true });

        // 递归过滤 AST 节点
        const modifiedAst = filterAstNodes(ast);

        // 将 AST 转回代码
        const modifiedCode = escodegen.generate(modifiedAst);

        // 输出修改后的 JavaScript
        process.stdout.write(modifiedCode);
    } catch (err) {
        // 输出错误信息
        process.stderr.write(`Error: ${err.message}`);
    }
});