// 游戏常量
const WIDTH = 480;
const HEIGHT = 700;
const FPS = 60;

// 颜色定义
const COLORS = {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    GREEN: '#00FF00',
    RED: '#FF0000',
    GRAY: '#646464',
    YELLOW: '#FFFF00',
    CYAN: '#00FFFF'
};

// 游戏状态
const STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver'
};

// 难度配置
const DIFFICULTY = {
    1: { // 普通
        smallCount: 15, midCount: 4, bigCount: 2,
        smallSpeed: 2, midSpeed: 1, bigSpeed: 1,
        initLife: 3, supplyInterval: 30000,
        name: '普通'
    },
    2: { // 精英
        smallCount: 20, midCount: 6, bigCount: 3,
        smallSpeed: 3, midSpeed: 2, bigSpeed: 1,
        initLife: 3, supplyInterval: 40000,
        name: '精英'
    },
    3: { // 隐藏
        smallCount: 25, midCount: 8, bigCount: 4,
        smallSpeed: 4, midSpeed: 2, bigSpeed: 2,
        initLife: 2, supplyInterval: 50000,
        name: '隐藏'
    }
};

// 背景配置
const BACKGROUNDS = [
    { name: '经典天空', image: 'images/background.png' },
    { name: '樱花春日', image: 'images/background_sakura.png' },
    { name: '霓虹都市', image: 'images/background_vaporwave.png' },
    { name: 'Lo-Fi雨夜', image: 'images/background_lofi.png' }
];

// 游戏主类
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = STATE.MENU;
        this.difficulty = 1;
        this.bgIndex = 0;
        this.score = 0;
        this.recordScore = parseInt(localStorage.getItem('recordScore') || '0');
        this.lifeNum = 3;
        this.bombNum = 3;
        this.level = 1;
        this.paused = false;
        this.isDoubleBullet = false;
        this.doubleBulletTimer = 0;
        this.invincibleTimer = 0;
        this.supplyTimer = 0;
        this.delay = 100;
        this.switchImage = true;
        
        // 游戏对象
        this.me = null;
        this.smallEnemies = [];
        this.midEnemies = [];
        this.bigEnemies = [];
        this.bullets1 = [];
        this.bullets2 = [];
        this.bulletSupply = null;
        this.bombSupply = null;
        this.bgParticles = [];
        
        // 资源
        this.images = {};
        this.sounds = {};
        this.backgrounds = [];
        
        // 控制
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // 计时器
        this.lastTime = 0;
        this.deltaTime = 0;
        
        this.init();
    }
    
    async init() {
        await this.loadAssets();
        this.setupEventListeners();
        this.updateBestScore();
        this.gameLoop(0);
    }
    
    async loadAssets() {
        // 加载背景图片
        for (let bg of BACKGROUNDS) {
            const img = await this.loadImage(bg.image);
            this.backgrounds.push(img);
        }
        
        // 加载游戏图片
        const imageList = [
            'me1', 'me2', 'me_destroy_1', 'me_destroy_2', 'me_destroy_3', 'me_destroy_4',
            'enemy1', 'enemy1_down1', 'enemy1_down2', 'enemy1_down3', 'enemy1_down4',
            'enemy2', 'enemy2_hit', 'enemy2_down1', 'enemy2_down2', 'enemy2_down3', 'enemy2_down4',
            'enemy3_n1', 'enemy3_n2', 'enemy3_hit', 
            'enemy3_down1', 'enemy3_down2', 'enemy3_down3', 'enemy3_down4', 'enemy3_down5', 'enemy3_down6',
            'bullet1', 'bullet2',
            'bomb', 'bomb_supply', 'bullet_supply',
            'life', 'pause_nor', 'pause_pressed', 'resume_nor', 'resume_pressed'
        ];
        
        for (let name of imageList) {
            this.images[name] = await this.loadImage(`images/${name}.png`);
        }
        
        // 加载音效
        const soundList = [
            'game_music', 'bullet', 'use_bomb', 'supply',
            'get_bomb', 'get_bullet', 'upgrade',
            'enemy1_down', 'enemy2_down', 'enemy3_down', 'me_down',
            'button'
        ];
        
        for (let name of soundList) {
            this.sounds[name] = await this.loadSound(`sound/${name}.wav`);
        }
        this.sounds['enemy3_flying'] = await this.loadSound('sound/enemy3_flying.wav');
    }
    
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }
    
    loadSound(src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = src;
            audio.volume = 0.2;
        });
    }
    
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            if (e.key === 'Escape') {
                if (this.state === STATE.PLAYING) {
                    this.togglePause();
                }
            } else if (e.key.toLowerCase() === 'u') {
                if (this.paused || this.state === STATE.GAME_OVER) {
                    this.returnToMenu();
                }
            } else if (e.key === ' ') {
                if (this.state === STATE.PLAYING && !this.paused && this.bombNum > 0) {
                    this.useBomb();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // 鼠标事件（坐标缩放到 Canvas 内部尺寸）
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = (e.clientX - rect.left) * WIDTH / rect.width;
            this.mousePos.y = (e.clientY - rect.top) * HEIGHT / rect.height;
        });
        
        // 全屏按钮
        this.fullscreenBtn = document.getElementById('fullscreenBtn');
        this.fullscreenBtn.addEventListener('click', () => {
            const container = document.getElementById('gameContainer');
            if (!document.fullscreenElement) {
                container.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen();
            }
        });
        
        document.addEventListener('fullscreenchange', () => {
            this.fullscreenBtn.textContent = document.fullscreenElement ? '退出全屏' : '全屏';
        });
        
        // 暂停按钮
        document.getElementById('pauseBtn').addEventListener('click', () => {
            if (this.state === STATE.PLAYING) {
                this.togglePause();
            }
        });
        
        // 关卡选择
        document.querySelectorAll('.level-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const level = parseInt(e.currentTarget.dataset.level);
                this.startGame(level);
            });
        });
        
        // 背景选择
        document.querySelectorAll('.bg-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                document.querySelectorAll('.bg-thumb').forEach(t => t.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.bgIndex = parseInt(e.currentTarget.dataset.bg);
            });
        });
        
        // 重新开始按钮
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame(this.difficulty);
        });
        
        // 返回菜单按钮
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.returnToMenu();
        });
    }
    
    startGame(difficulty) {
        this.difficulty = difficulty;
        this.state = STATE.PLAYING;
        this.score = 0;
        this.level = 1;
        this.paused = false;
        this.isDoubleBullet = false;
        this.doubleBulletTimer = 0;
        this.invincibleTimer = 0;
        this.supplyTimer = Date.now() + DIFFICULTY[difficulty].supplyInterval;
        
        const config = DIFFICULTY[difficulty];
        this.lifeNum = config.initLife;
        this.bombNum = 3;
        
        // 初始化玩家飞机
        this.me = new MyPlane(this);
        
        // 初始化敌机
        this.smallEnemies = [];
        this.midEnemies = [];
        this.bigEnemies = [];
        
        for (let i = 0; i < config.smallCount; i++) {
            this.smallEnemies.push(new SmallEnemy(this, config.smallSpeed));
        }
        
        for (let i = 0; i < config.midCount; i++) {
            this.midEnemies.push(new MidEnemy(this, config.midSpeed));
        }
        
        for (let i = 0; i < config.bigCount; i++) {
            this.bigEnemies.push(new BigEnemy(this, config.bigSpeed));
        }
        
        // 初始化子弹
        this.bullets1 = [];
        this.bullets2 = [];
        for (let i = 0; i < 4; i++) {
            this.bullets1.push(new Bullet1(this));
        }
        for (let i = 0; i < 8; i++) {
            this.bullets2.push(new Bullet2(this));
        }
        
        // 初始化补给
        this.bulletSupply = new BulletSupply(this);
        this.bombSupply = new BombSupply(this);
        
        // 初始化背景粒子
        this.initBgParticles();
        
        // 更新UI
        document.getElementById('ui').classList.remove('active');
        document.getElementById('levelSelect').classList.remove('active');
        document.getElementById('hud').style.display = 'block';
        document.getElementById('bombCount').style.display = 'block';
        document.getElementById('lifeCount').style.display = 'flex';
        document.getElementById('pauseBtn').style.display = 'block';
        
        // 播放背景音乐
        this.sounds.game_music.loop = true;
        this.sounds.game_music.play();
        
        this.updateUI();
    }
    
    initBgParticles() {
        this.bgParticles = [];
        
        if (this.bgIndex === 1) { // 樱花春日
            for (let i = 0; i < 25; i++) {
                this.bgParticles.push({
                    x: Math.random() * WIDTH,
                    y: Math.random() * HEIGHT,
                    size: 3 + Math.random() * 2,
                    speedY: 0.3 + Math.random() * 0.4,
                    phase: Math.random() * Math.PI * 2,
                    drift: 0.2 + Math.random() * 0.3
                });
            }
        } else if (this.bgIndex === 2) { // 霓虹都市
            for (let i = 0; i < 15; i++) {
                this.bgParticles.push({
                    x: Math.random() * WIDTH,
                    y: HEIGHT / 3 + Math.random() * HEIGHT / 6,
                    size: 2 + Math.random() * 2,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.02 + Math.random() * 0.03
                });
            }
        } else if (this.bgIndex === 3) { // Lo-Fi雨夜
            for (let i = 0; i < 25; i++) {
                this.bgParticles.push({
                    x: Math.random() * WIDTH,
                    y: Math.random() * HEIGHT,
                    length: 8 + Math.random() * 7,
                    speed: 1.0 + Math.random() * 1.5
                });
            }
        }
    }
    
    togglePause() {
        this.paused = !this.paused;
        const pauseBtn = document.getElementById('pauseBtn');
        const pauseOverlay = document.getElementById('pauseOverlay');
        
        if (this.paused) {
            pauseBtn.classList.add('paused');
            pauseOverlay.classList.add('active');
            this.sounds.game_music.pause();
        } else {
            pauseBtn.classList.remove('paused');
            pauseOverlay.classList.remove('active');
            this.sounds.game_music.play();
        }
    }
    
    returnToMenu() {
        this.state = STATE.MENU;
        this.paused = false;
        this.sounds.game_music.pause();
        this.sounds.game_music.currentTime = 0;
        
        document.getElementById('ui').classList.add('active');
        document.getElementById('levelSelect').classList.add('active');
        document.getElementById('gameOver').classList.remove('active');
        document.getElementById('pauseOverlay').classList.remove('active');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('bombCount').style.display = 'none';
        document.getElementById('lifeCount').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'none';
    }
    
    useBomb() {
        if (this.bombNum > 0) {
            this.bombNum--;
            this.sounds.use_bomb.play();
            
            // 消灭所有屏幕上的敌机
            [...this.smallEnemies, ...this.midEnemies, ...this.bigEnemies].forEach(enemy => {
                if (enemy.rect.top > 0 && enemy.rect.bottom < HEIGHT) {
                    enemy.active = false;
                }
            });
            
            this.updateUI();
        }
    }
    
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('best').textContent = this.recordScore;
        document.getElementById('bombNum').textContent = `× ${this.bombNum}`;
        
        const lifeCount = document.getElementById('lifeCount');
        lifeCount.innerHTML = '';
        for (let i = 0; i < this.lifeNum; i++) {
            const life = document.createElement('div');
            life.className = 'life-icon';
            lifeCount.appendChild(life);
        }
    }
    
    updateBestScore() {
        document.getElementById('bestScore').textContent = this.recordScore;
    }
    
    gameOver() {
        this.state = STATE.GAME_OVER;
        this.sounds.game_music.pause();
        this.sounds.game_music.currentTime = 0;
        
        // 更新最高分
        if (this.score > this.recordScore) {
            this.recordScore = this.score;
            localStorage.setItem('recordScore', this.recordScore.toString());
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.recordScore;
        document.getElementById('ui').classList.add('active');
        document.getElementById('gameOver').classList.add('active');
        document.getElementById('hud').style.display = 'none';
        document.getElementById('bombCount').style.display = 'none';
        document.getElementById('lifeCount').style.display = 'none';
        document.getElementById('pauseBtn').style.display = 'none';
    }
    
    gameLoop(currentTime) {
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        this.update();
        this.render();
        
        requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update() {
        if (this.state !== STATE.PLAYING || this.paused) {
            return;
        }
        
        // 更新延迟计数器
        this.delay--;
        if (this.delay <= 0) {
            this.delay = 100;
        }
        
        // 切换图片动画
        if (this.delay % 5 === 0) {
            this.switchImage = !this.switchImage;
        }
        
        // 更新玩家
        if (this.me.active) {
            this.handleInput();
            this.me.update();
        } else {
            this.me.update();
            if (this.me.destroyIndex >= 4) {
                this.lifeNum--;
                if (this.lifeNum > 0) {
                    this.me.reset();
                    this.invincibleTimer = Date.now() + 3000;
                } else {
                    this.gameOver();
                    return;
                }
            }
        }
        
        // 更新无敌状态
        if (this.invincibleTimer > 0 && Date.now() > this.invincibleTimer) {
            this.me.invincible = false;
            this.invincibleTimer = 0;
        }
        
        // 更新超级子弹状态
        if (this.isDoubleBullet && Date.now() > this.doubleBulletTimer) {
            this.isDoubleBullet = false;
        }
        
        // 发射子弹
        if (this.delay % 10 === 0 && this.me.active) {
            this.fireBullets();
        }
        
        // 更新子弹
        const bullets = this.isDoubleBullet ? this.bullets2 : this.bullets1;
        bullets.forEach(bullet => {
            if (bullet.active) {
                bullet.update();
            }
        });
        
        // 更新敌机
        this.smallEnemies.forEach(enemy => enemy.update());
        this.midEnemies.forEach(enemy => enemy.update());
        this.bigEnemies.forEach(enemy => enemy.update());
        
        // 更新补给
        if (this.bulletSupply.active) {
            this.bulletSupply.update();
        }
        if (this.bombSupply.active) {
            this.bombSupply.update();
        }
        
        // 补给定时器
        if (Date.now() > this.supplyTimer) {
            this.sounds.supply.play();
            if (Math.random() > 0.5) {
                this.bombSupply.reset();
            } else {
                this.bulletSupply.reset();
            }
            this.supplyTimer = Date.now() + DIFFICULTY[this.difficulty].supplyInterval;
        }
        
        // 碰撞检测
        this.checkCollisions();
        
        // 难度提升
        this.checkLevelUp();
        
        // 更新背景粒子
        this.updateBgParticles();
        
        this.updateUI();
    }
    
    handleInput() {
        const speed = this.me.speed;
        
        if (this.keys['w'] || this.keys['arrowup']) {
            this.me.rect.y -= speed;
            if (this.me.rect.y < 0) this.me.rect.y = 0;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            this.me.rect.y += speed;
            if (this.me.rect.y > HEIGHT - this.me.height - 60) {
                this.me.rect.y = HEIGHT - this.me.height - 60;
            }
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            this.me.rect.x -= speed;
            if (this.me.rect.x < 0) this.me.rect.x = 0;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            this.me.rect.x += speed;
            if (this.me.rect.x > WIDTH - this.me.width) {
                this.me.rect.x = WIDTH - this.me.width;
            }
        }
    }
    
    fireBullets() {
        this.sounds.bullet.play();
        
        if (this.isDoubleBullet) {
            this.bullets2[0].reset(this.me.rect.x + this.me.width / 2 - 33, this.me.rect.y);
            this.bullets2[1].reset(this.me.rect.x + this.me.width / 2 + 30, this.me.rect.y);
        } else {
            const bullet = this.bullets1.find(b => !b.active);
            if (bullet) {
                bullet.reset(this.me.rect.x + this.me.width / 2, this.me.rect.y);
            }
        }
    }
    
    checkCollisions() {
        const bullets = this.isDoubleBullet ? this.bullets2 : this.bullets1;
        
        // 子弹击中敌机
        bullets.forEach(bullet => {
            if (!bullet.active) return;
            
            // 小型敌机
            this.smallEnemies.forEach(enemy => {
                if (enemy.active && this.checkCollision(bullet.rect, enemy.rect)) {
                    bullet.active = false;
                    enemy.active = false;
                    this.score += 10;
                    this.sounds.enemy1_down.play();
                }
            });
            
            // 中型敌机
            this.midEnemies.forEach(enemy => {
                if (enemy.active && this.checkCollision(bullet.rect, enemy.rect)) {
                    bullet.active = false;
                    enemy.energy--;
                    if (enemy.energy <= 0) {
                        enemy.active = false;
                        this.score += 100;
                        this.sounds.enemy2_down.play();
                    } else {
                        enemy.hit = true;
                    }
                }
            });
            
            // 大型敌机
            this.bigEnemies.forEach(enemy => {
                if (enemy.active && this.checkCollision(bullet.rect, enemy.rect)) {
                    bullet.active = false;
                    enemy.energy--;
                    if (enemy.energy <= 0) {
                        enemy.active = false;
                        this.score += 1000;
                        this.sounds.enemy3_down.play();
                    } else {
                        enemy.hit = true;
                    }
                }
            });
        });
        
        // 玩家撞敌机
        if (this.me.active && !this.me.invincible) {
            const allEnemies = [...this.smallEnemies, ...this.midEnemies, ...this.bigEnemies];
            allEnemies.forEach(enemy => {
                if (enemy.active && this.checkCollision(this.me.rect, enemy.rect)) {
                    this.me.active = false;
                    enemy.active = false;
                    this.sounds.me_down.play();
                }
            });
        }
        
        // 玩家获取补给
        if (this.me.active) {
            if (this.bulletSupply.active && this.checkCollision(this.me.rect, this.bulletSupply.rect)) {
                this.sounds.get_bullet.play();
                this.isDoubleBullet = true;
                this.doubleBulletTimer = Date.now() + 18000;
                this.bulletSupply.active = false;
            }
            
            if (this.bombSupply.active && this.checkCollision(this.me.rect, this.bombSupply.rect)) {
                this.sounds.get_bomb.play();
                if (this.bombNum < 3) this.bombNum++;
                this.bombSupply.active = false;
            }
        }
    }
    
    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    checkLevelUp() {
        if (this.level === 1 && this.score > 500) {
            this.levelUp(2);
        } else if (this.level === 2 && this.score > 3000) {
            this.levelUp(3);
        } else if (this.level === 3 && this.score > 6000) {
            this.levelUp(4);
        } else if (this.level === 4 && this.score > 10000) {
            this.levelUp(5);
        }
    }
    
    levelUp(newLevel) {
        this.level = newLevel;
        this.sounds.upgrade.play();
        
        // 增加敌机
        for (let i = 0; i < 5; i++) {
            this.smallEnemies.push(new SmallEnemy(this, DIFFICULTY[this.difficulty].smallSpeed + 1));
        }
        for (let i = 0; i < 3; i++) {
            this.midEnemies.push(new MidEnemy(this, DIFFICULTY[this.difficulty].midSpeed + 1));
        }
        for (let i = 0; i < 2; i++) {
            this.bigEnemies.push(new BigEnemy(this, DIFFICULTY[this.difficulty].bigSpeed + 1));
        }
    }
    
    updateBgParticles() {
        if (this.bgIndex === 1) { // 樱花春日
            this.bgParticles.forEach(petal => {
                petal.y += petal.speedY;
                petal.phase += 0.02;
                petal.x += Math.sin(petal.phase) * petal.drift;
                
                if (petal.y > HEIGHT + 10) {
                    petal.y = -10;
                    petal.x = Math.random() * WIDTH;
                }
            });
        } else if (this.bgIndex === 2) { // 霓虹都市
            this.bgParticles.forEach(light => {
                light.phase += light.speed;
            });
        } else if (this.bgIndex === 3) { // Lo-Fi雨夜
            if (this.delay % 3 === 0) {
                this.bgParticles.forEach(rain => {
                    rain.y += rain.speed;
                    if (rain.y > HEIGHT + 10) {
                        rain.y = -rain.length;
                        rain.x = Math.random() * WIDTH;
                    }
                });
            }
        }
    }
    
    render() {
        // 绘制背景
        this.ctx.drawImage(this.backgrounds[this.bgIndex], 0, 0);
        
        // 绘制背景粒子
        this.renderBgParticles();
        
        if (this.state === STATE.PLAYING || this.state === STATE.GAME_OVER) {
            // 绘制补给
            if (this.bulletSupply.active) {
                this.ctx.drawImage(this.images.bullet_supply, this.bulletSupply.rect.x, this.bulletSupply.rect.y);
            }
            if (this.bombSupply.active) {
                this.ctx.drawImage(this.images.bomb_supply, this.bombSupply.rect.x, this.bombSupply.rect.y);
            }
            
            // 绘制敌机
            this.bigEnemies.forEach(enemy => enemy.render());
            this.midEnemies.forEach(enemy => enemy.render());
            this.smallEnemies.forEach(enemy => enemy.render());
            
            // 绘制子弹
            const bullets = this.isDoubleBullet ? this.bullets2 : this.bullets1;
            bullets.forEach(bullet => {
                if (bullet.active) {
                    bullet.render();
                }
            });
            
            // 绘制玩家
            if (this.me) {
                this.me.render();
            }
        }
    }
    
    renderBgParticles() {
        if (this.bgIndex === 1) { // 樱花春日
            this.ctx.fillStyle = 'rgba(255, 180, 200, 0.6)';
            this.bgParticles.forEach(petal => {
                this.ctx.beginPath();
                this.ctx.arc(petal.x, petal.y, petal.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else if (this.bgIndex === 2) { // 霓虹都市
            this.bgParticles.forEach(light => {
                const brightness = Math.floor(128 + 127 * Math.sin(light.phase));
                const color = `rgb(255, ${Math.floor(brightness / 2)}, ${brightness})`;
                this.ctx.fillStyle = color;
                this.ctx.beginPath();
                this.ctx.arc(light.x, light.y, light.size, 0, Math.PI * 2);
                this.ctx.fill();
            });
        } else if (this.bgIndex === 3) { // Lo-Fi雨夜
            this.ctx.strokeStyle = 'rgba(150, 180, 220, 0.5)';
            this.ctx.lineWidth = 1;
            this.bgParticles.forEach(rain => {
                this.ctx.beginPath();
                this.ctx.moveTo(rain.x, rain.y);
                this.ctx.lineTo(rain.x + 1, rain.y + rain.length);
                this.ctx.stroke();
            });
        }
    }
}

// 玩家飞机类
class MyPlane {
    constructor(game) {
        this.game = game;
        this.width = 100;
        this.height = 120;
        this.rect = {
            x: (WIDTH - this.width) / 2,
            y: HEIGHT - this.height - 60,
            width: this.width,
            height: this.height
        };
        this.speed = 10;
        this.active = true;
        this.invincible = false;
        this.destroyIndex = 0;
    }
    
    update() {
        if (!this.active) {
            if (this.game.delay % 3 === 0) {
                this.destroyIndex++;
            }
        }
    }
    
    reset() {
        this.rect.x = (WIDTH - this.width) / 2;
        this.rect.y = HEIGHT - this.height - 60;
        this.active = true;
        this.invincible = true;
        this.destroyIndex = 0;
    }
    
    render() {
        if (this.active) {
            const img = this.game.switchImage ? this.game.images.me1 : this.game.images.me2;
            this.game.ctx.drawImage(img, this.rect.x, this.rect.y, this.width, this.height);
        } else {
            if (this.destroyIndex < 4) {
                const img = this.game.images[`me_destroy_${this.destroyIndex + 1}`];
                this.game.ctx.drawImage(img, this.rect.x, this.rect.y, this.width, this.height);
            }
        }
    }
}

// 敌机基类
class Enemy {
    constructor(game, speed) {
        this.game = game;
        this.speed = speed;
        this.active = true;
        this.destroyIndex = 0;
    }
    
    update() {
        if (this.active) {
            this.rect.y += this.speed;
            if (this.rect.y > HEIGHT) {
                this.reset();
            }
        } else {
            if (this.game.delay % 3 === 0) {
                this.destroyIndex++;
                if (this.destroyIndex >= this.destroyImages.length) {
                    this.reset();
                }
            }
        }
    }
    
    reset() {
        this.active = true;
        this.destroyIndex = 0;
        this.rect.x = Math.random() * (WIDTH - this.width);
        this.rect.y = -this.height * (3 + Math.random() * 2);
    }
    
    render() {
        if (this.active) {
            this.game.ctx.drawImage(this.image, this.rect.x, this.rect.y, this.width, this.height);
        } else {
            if (this.destroyIndex < this.destroyImages.length) {
                const img = this.destroyImages[this.destroyIndex];
                this.game.ctx.drawImage(img, this.rect.x, this.rect.y, this.width, this.height);
            }
        }
    }
}

// 小型敌机
class SmallEnemy extends Enemy {
    constructor(game, speed) {
        super(game, speed);
        this.width = 50;
        this.height = 50;
        this.rect = {
            x: Math.random() * (WIDTH - this.width),
            y: -this.height * (3 + Math.random() * 2),
            width: this.width,
            height: this.height
        };
        this.image = game.images.enemy1;
        this.destroyImages = [
            game.images.enemy1_down1,
            game.images.enemy1_down2,
            game.images.enemy1_down3,
            game.images.enemy1_down4
        ];
    }
}

// 中型敌机
class MidEnemy extends Enemy {
    constructor(game, speed) {
        super(game, speed);
        this.width = 70;
        this.height = 80;
        this.energy = 8;
        this.hit = false;
        this.rect = {
            x: Math.random() * (WIDTH - this.width),
            y: -this.height * (5 + Math.random() * 5),
            width: this.width,
            height: this.height
        };
        this.image = game.images.enemy2;
        this.imageHit = game.images.enemy2_hit;
        this.destroyImages = [
            game.images.enemy2_down1,
            game.images.enemy2_down2,
            game.images.enemy2_down3,
            game.images.enemy2_down4
        ];
    }
    
    reset() {
        super.reset();
        this.energy = 8;
        this.hit = false;
    }
    
    render() {
        if (this.active) {
            const img = this.hit ? this.imageHit : this.image;
            this.game.ctx.drawImage(img, this.rect.x, this.rect.y, this.width, this.height);
            this.hit = false;
            
            // 绘制血条
            const barWidth = this.width;
            const barHeight = 3;
            const barY = this.rect.y - 8;
            
            this.game.ctx.fillStyle = COLORS.BLACK;
            this.game.ctx.fillRect(this.rect.x, barY, barWidth, barHeight);
            
            const energyRatio = this.energy / 8;
            this.game.ctx.fillStyle = energyRatio > 0.2 ? COLORS.GREEN : COLORS.RED;
            this.game.ctx.fillRect(this.rect.x, barY, barWidth * energyRatio, barHeight);
        } else {
            super.render();
        }
    }
}

// 大型敌机
class BigEnemy extends Enemy {
    constructor(game, speed) {
        super(game, speed);
        this.width = 150;
        this.height = 200;
        this.energy = 20;
        this.hit = false;
        this.rect = {
            x: Math.random() * (WIDTH - this.width),
            y: -this.height * (5 + Math.random() * 10),
            width: this.width,
            height: this.height
        };
        this.image1 = game.images.enemy3_n1;
        this.image2 = game.images.enemy3_n2;
        this.imageHit = game.images.enemy3_hit;
        this.destroyImages = [
            game.images.enemy3_down1,
            game.images.enemy3_down2,
            game.images.enemy3_down3,
            game.images.enemy3_down4,
            game.images.enemy3_down5,
            game.images.enemy3_down6
        ];
    }
    
    reset() {
        super.reset();
        this.energy = 20;
        this.hit = false;
    }
    
    render() {
        if (this.active) {
            let img;
            if (this.hit) {
                img = this.imageHit;
                this.hit = false;
            } else {
                img = this.game.switchImage ? this.image1 : this.image2;
            }
            this.game.ctx.drawImage(img, this.rect.x, this.rect.y, this.width, this.height);
            
            // 绘制血条
            const barWidth = this.width;
            const barHeight = 3;
            const barY = this.rect.y - 8;
            
            this.game.ctx.fillStyle = COLORS.BLACK;
            this.game.ctx.fillRect(this.rect.x, barY, barWidth, barHeight);
            
            const energyRatio = this.energy / 20;
            this.game.ctx.fillStyle = energyRatio > 0.2 ? COLORS.GREEN : COLORS.RED;
            this.game.ctx.fillRect(this.rect.x, barY, barWidth * energyRatio, barHeight);
        } else {
            super.render();
        }
    }
}

// 子弹基类
class Bullet {
    constructor(game, speed) {
        this.game = game;
        this.speed = speed;
        this.active = false;
        this.rect = { x: 0, y: 0, width: 0, height: 0 };
    }
    
    update() {
        if (this.active) {
            this.rect.y -= this.speed;
            if (this.rect.y < 0) {
                this.active = false;
            }
        }
    }
    
    render() {
        if (this.active) {
            this.game.ctx.drawImage(this.image, this.rect.x, this.rect.y);
        }
    }
}

// 普通子弹
class Bullet1 extends Bullet {
    constructor(game) {
        super(game, 12);
        this.image = game.images.bullet1;
        this.rect.width = 10;
        this.rect.height = 20;
    }
    
    reset(x, y) {
        this.rect.x = x - this.rect.width / 2;
        this.rect.y = y;
        this.active = true;
    }
}

// 超级子弹
class Bullet2 extends Bullet {
    constructor(game) {
        super(game, 14);
        this.image = game.images.bullet2;
        this.rect.width = 30;
        this.rect.height = 40;
    }
    
    reset(x, y) {
        this.rect.x = x;
        this.rect.y = y;
        this.active = true;
    }
}

// 补给基类
class Supply {
    constructor(game) {
        this.game = game;
        this.speed = 5;
        this.active = false;
        this.rect = { x: 0, y: 0, width: 50, height: 50 };
    }
    
    update() {
        if (this.active) {
            this.rect.y += this.speed;
            if (this.rect.y > HEIGHT) {
                this.active = false;
            }
        }
    }
    
    reset() {
        this.active = true;
        this.rect.x = Math.random() * (WIDTH - this.rect.width);
        this.rect.y = -100;
    }
    
    render() {
        if (this.active) {
            this.game.ctx.drawImage(this.image, this.rect.x, this.rect.y);
        }
    }
}

// 子弹补给
class BulletSupply extends Supply {
    constructor(game) {
        super(game);
        this.image = game.images.bullet_supply;
    }
}

// 炸弹补给
class BombSupply extends Supply {
    constructor(game) {
        super(game);
        this.image = game.images.bomb_supply;
    }
}

// 启动游戏
window.addEventListener('load', () => {
    new Game();
});
