# 飞机大战 - Aircraft Warfare

经典的飞机大战游戏，包含 Python Pygame 版本和网页 JavaScript 版本。

## 🎮 游戏版本

### 网页版 (推荐)
直接在浏览器中运行，无需安装任何依赖。

**在线试玩**: [GitHub Pages 链接](https://yourusername.github.io/The-Python-code-implements-aircraft-warfare-master/)

**本地运行**:
1. 克隆或下载本项目
2. 用浏览器打开 `index.html` 文件
3. 开始游戏！

### Python 版
使用 Pygame 库的经典桌面版本。

**运行要求**:
- Python 3.6+
- Pygame 2.0+

**安装依赖**:
```bash
pip install pygame
```

**运行游戏**:
```bash
python main.py
```

## 🎯 游戏特性

- **三种难度关卡**: 普通、精英、隐藏
- **四种主题背景**: 经典天空、樱花春日、霓虹都市、Lo-Fi雨夜
- **丰富的游戏元素**:
  - 三种敌机类型（小型、中型、大型）
  - 普通子弹和超级子弹
  - 全屏炸弹
  - 生命系统和无敌时间
  - 动态难度提升
  - 最高分记录

## 🎮 操作说明

### 键盘控制
- **WASD** 或 **方向键**: 移动飞机
- **空格键**: 使用全屏炸弹
- **ESC**: 暂停/继续游戏
- **U**: 返回菜单（暂停或游戏结束时）

### 鼠标控制
- 点击暂停按钮暂停游戏
- 点击关卡卡片选择难度
- 点击背景缩略图选择主题

## 📁 项目结构

```
.
├── index.html          # 网页版入口
├── game.js             # 网页版游戏逻辑
├── main.py             # Python 版主程序
├── myplane.py          # 玩家飞机类
├── enemy.py            # 敌机类
├── bullet.py           # 子弹类
├── supply.py           # 补给类
├── images/             # 游戏图片资源
├── sound/              # 游戏音效资源
├── font/               # 字体文件
└── record.txt          # 最高分记录
```

## 🚀 部署到 GitHub Pages

1. Fork 或克隆本项目到你的 GitHub
2. 进入仓库设置 (Settings)
3. 左侧菜单选择 "Pages"
4. Source 选择 "Deploy from a branch"
5. Branch 选择 "main" (或 "master")，文件夹选择 "/ (root)"
6. 点击 "Save"
7. 等待几分钟后，访问 `https://yourusername.github.io/repository-name/`

## 📝 技术栈

### 网页版
- HTML5 Canvas
- 原生 JavaScript (ES6+)
- CSS3

### Python 版
- Python 3
- Pygame

## 🎨 游戏截图

（可以添加游戏截图）

## 📄 许可证

本项目仅供学习参考使用。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受游戏！** ✈️💥
