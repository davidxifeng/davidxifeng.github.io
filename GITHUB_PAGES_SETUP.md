# GitHub Pages + LM Studio 部署指南 (Bun版本)

当你将聊天应用部署到GitHub Pages时，由于CORS限制，无法直接访问本地的LM Studio。以下是几种解决方案：

## 🎯 解决方案对比

| 方案 | 难度 | 用户体验 | 适用场景 |
|------|------|----------|----------|
| Bun CORS代理服务器 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 推荐方案 |
| 浏览器扩展 | ⭐ | ⭐⭐⭐ | 临时使用 |
| Electron桌面应用 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 正式产品 |

## 🚀 方案1：Bun CORS代理服务器（推荐）

### 前提条件
确保你已安装 [Bun](https://bun.sh)：
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows
powershell -c "irm bun.sh/install.ps1 | iex"
```

### 步骤1：准备代理服务器

1. **复制文件**
   ```bash
   mkdir ~/lm-studio-proxy
   cp cors-proxy.js ~/lm-studio-proxy/
   cp cors-proxy-package.json ~/lm-studio-proxy/package.json
   cd ~/lm-studio-proxy/
   ```

2. **无需安装依赖**
   Bun版本使用原生API，无需额外依赖！

3. **修改配置**
   编辑 `cors-proxy.js`，将 `yourusername.github.io` 替换为你的实际GitHub Pages地址：
   ```javascript
   const allowedOrigins = [
     'https://youractualusername.github.io',  // 修改这里
     'http://localhost:3000',
     // ...
   ]
   ```

### 步骤2：启动服务

1. **启动LM Studio**（端口1234）
2. **启动代理服务器**
   ```bash
   bun start
   # 或者直接运行
   bun cors-proxy.js
   ```
   你会看到类似输出：
   ```
   🚀 CORS Proxy Server Started (Bun)!
   📡 Proxy URL: http://localhost:8080
   🎯 LM Studio: http://localhost:1234
   ```

### 步骤3：配置GitHub Pages

1. 部署你的聊天应用到GitHub Pages
2. 打开部署的网站
3. 点击设置⚙️，选择 **"LM Studio (via CORS Proxy)"**
4. 开始聊天！

## 🔧 方案2：浏览器扩展

### Chrome用户
1. 安装 **CORS Unblock** 扩展
2. 启用扩展
3. 在GitHub Pages上选择 **"LM Studio (Local)"**
4. 开始使用

### Firefox用户
1. 安装 **CORS Everywhere** 扩展
2. 启用扩展
3. 配置允许localhost访问

## 📱 方案3：Electron桌面应用

如果你想打包成桌面应用：

```bash
npm install electron electron-builder
```

创建 `electron-main.js`：
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      webSecurity: false  // 禁用web安全限制
    }
  })

  mainWindow.loadFile('dist/index.html')
}

app.whenReady().then(createWindow)
```

## 🛠️ 故障排除

### 问题1：连接失败
- ✅ 确认LM Studio在端口1234运行
- ✅ 确认代理服务器在端口8080运行
- ✅ 检查防火墙设置

### 问题2：CORS错误仍然存在
- ✅ 检查GitHub Pages URL是否正确配置在代理服务器中
- ✅ 清除浏览器缓存
- ✅ 检查浏览器控制台错误信息

### 问题3：模型加载失败
- ✅ 确认LM Studio已加载模型
- ✅ 尝试直接访问 `http://localhost:8080/api/v1/models`
- ✅ 检查代理服务器日志

## 📋 完整使用流程

1. **本地准备**
   ```bash
   # 启动LM Studio (端口1234)
   # 启动CORS代理
   cd ~/lm-studio-proxy/
   bun start
   ```

2. **GitHub Pages配置**
   - 打开你的GitHub Pages聊天应用
   - 设置 → 选择"LM Studio (via CORS Proxy)"
   - 测试连接

3. **开始聊天**
   - 选择模型
   - 开始对话

## 🎯 Bun版本优势

- ⚡ **超快启动** - Bun启动速度比Node.js快数倍
- 📦 **零依赖** - 无需安装Express等第三方包，体积更小
- 🚀 **内存效率** - Bun运行时占用内存更少
- 🔧 **原生支持** - 使用Web标准API，代码更现代
- 🛠️ **热重载** - 支持 `--watch` 模式，开发更便捷

## 🔐 安全注意事项

- CORS代理服务器只在本地运行，相对安全
- 不要将API密钥提交到GitHub仓库
- 考虑为生产环境使用HTTPS
- Bun版本无第三方依赖，减少安全风险

## 🎉 成功标志

当一切正常时，你应该看到：
- ✅ 代理服务器正常运行
- ✅ GitHub Pages网站能连接到本地LM Studio
- ✅ 模型列表正常加载
- ✅ 聊天功能完全正常

现在你可以在任何地方访问你的GitHub Pages聊天应用，同时使用本地的LM Studio服务！