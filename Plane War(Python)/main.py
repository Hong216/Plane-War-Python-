# main.py
import pygame
import sys
import traceback
import myplane
import enemy
import bullet
import supply

from pygame.locals import *
from random import *
import math

pygame.init()
pygame.mixer.init()

bg_size = width, height = 480, 700
screen = pygame.display.set_mode(bg_size)
pygame.display.set_caption("飞机大战")

# 载入背景图片（原始背景 + 3个现代年轻人风格背景）
backgrounds = [
    pygame.image.load("images/background.png").convert(),
    pygame.image.load("images/background_sakura.png").convert(),
    pygame.image.load("images/background_vaporwave.png").convert(),
    pygame.image.load("images/background_lofi.png").convert(),
]
bg_names = ["经典天空", "樱花春日", "霓虹都市", "Lo-Fi雨夜"]

BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
GREEN = (0, 255, 0)
RED = (255, 0, 0)
GRAY = (100, 100, 100)
DARK_GRAY = (40, 40, 40)
CYAN = (0, 255, 255)
YELLOW = (255, 255, 0)
ORANGE = (255, 165, 0)
PURPLE = (180, 0, 255)

# 载入游戏音乐
pygame.mixer.music.load("sound/game_music.ogg")
pygame.mixer.music.set_volume(0.2)
bullet_sound = pygame.mixer.Sound("sound/bullet.wav")
bullet_sound.set_volume(0.2)
bomb_sound = pygame.mixer.Sound("sound/use_bomb.wav")
bomb_sound.set_volume(0.2)
supply_sound = pygame.mixer.Sound("sound/supply.wav")
supply_sound.set_volume(0.2)
get_bomb_sound = pygame.mixer.Sound("sound/get_bomb.wav")
get_bomb_sound.set_volume(0.2)
get_bullet_sound = pygame.mixer.Sound("sound/get_bullet.wav")
get_bullet_sound.set_volume(0.2)
upgrade_sound = pygame.mixer.Sound("sound/upgrade.wav")
upgrade_sound.set_volume(0.2)
enemy3_fly_sound = pygame.mixer.Sound("sound/enemy3_flying.wav")
enemy3_fly_sound.set_volume(0.2)
enemy1_down_sound = pygame.mixer.Sound("sound/enemy1_down.wav")
enemy1_down_sound.set_volume(0.2)
enemy2_down_sound = pygame.mixer.Sound("sound/enemy2_down.wav")
enemy2_down_sound.set_volume(0.2)
enemy3_down_sound = pygame.mixer.Sound("sound/enemy3_down.wav")
enemy3_down_sound.set_volume(0.5)
me_down_sound = pygame.mixer.Sound("sound/me_down.wav")
me_down_sound.set_volume(0.2)

# 按钮音效
button_sound = pygame.mixer.Sound("sound/button.wav")
button_sound.set_volume(0.3)


def get_font(size):
    """获取支持中文的字体"""
    return pygame.font.SysFont("simhei", size)


def add_small_enemies(group1, group2, num):
    for i in range(num):
        e1 = enemy.SmallEnemy(bg_size)
        group1.add(e1)
        group2.add(e1)


def add_mid_enemies(group1, group2, num):
    for i in range(num):
        e2 = enemy.MidEnemy(bg_size)
        group1.add(e2)
        group2.add(e2)


def add_big_enemies(group1, group2, num):
    for i in range(num):
        e3 = enemy.BigEnemy(bg_size)
        group1.add(e3)
        group2.add(e3)


def inc_speed(target, inc):
    for each in target:
        each.speed += inc


def draw_button(screen, rect, text, font, is_hovered, is_selected=False):
    """绘制一个按钮/卡片"""
    if is_selected:
        border_color = CYAN
        bg_color = (30, 60, 100)
    elif is_hovered:
        border_color = YELLOW
        bg_color = (50, 50, 70)
    else:
        border_color = GRAY
        bg_color = DARK_GRAY

    pygame.draw.rect(screen, bg_color, rect, border_radius=10)
    pygame.draw.rect(screen, border_color, rect, width=2, border_radius=10)

    text_surf = font.render(text, True, WHITE)
    text_rect = text_surf.get_rect(center=rect.center)
    screen.blit(text_surf, text_rect)


def level_select():
    """关卡选择界面，返回 (难度等级, 背景索引)"""
    title_font = get_font(42)
    level_font = get_font(28)
    desc_font = get_font(18)
    hint_font = get_font(16)
    bg_font = get_font(14)

    level_names = ["普通关卡", "精英关卡", "隐藏关卡"]
    level_details = [
        "标准难度 · 适合新手玩家",
        "敌机更多更快 · 适合有经验玩家",
        "极限挑战 · 适合高手玩家",
    ]
    level_colors = [GREEN, YELLOW, RED]

    card_width = 360
    card_height = 100
    card_start_y = 180
    card_gap = 20

    cards = []
    for i in range(3):
        rect = pygame.Rect(
            (width - card_width) // 2,
            card_start_y + i * (card_height + card_gap),
            card_width,
            card_height,
        )
        cards.append(rect)

    # 背景选择区域
    bg_thumb_width = 100
    bg_thumb_height = 60
    bg_start_y = height - 130
    bg_gap = 15
    bg_total_width = 4 * bg_thumb_width + 3 * bg_gap
    bg_start_x = (width - bg_total_width) // 2

    bg_thumbs = []
    for i in range(4):
        rect = pygame.Rect(
            bg_start_x + i * (bg_thumb_width + bg_gap),
            bg_start_y,
            bg_thumb_width,
            bg_thumb_height,
        )
        bg_thumbs.append(rect)

    selected_level = 0
    selected_bg = 0
    selection_mode = 0  # 0=选择关卡, 1=选择背景
    clock = pygame.time.Clock()

    while True:
        mouse_pos = pygame.mouse.get_pos()
        hovered_level = -1
        hovered_bg = -1

        for i, rect in enumerate(cards):
            if rect.collidepoint(mouse_pos):
                hovered_level = i
                break
        for i, rect in enumerate(bg_thumbs):
            if rect.collidepoint(mouse_pos):
                hovered_bg = i
                break

        for event in pygame.event.get():
            if event.type == QUIT:
                pygame.quit()
                sys.exit()
            elif event.type == KEYDOWN:
                if event.key == K_TAB:
                    selection_mode = 1 - selection_mode
                elif selection_mode == 0:
                    if event.key == K_UP or event.key == K_w:
                        selected_level = (selected_level - 1) % 3
                    elif event.key == K_DOWN or event.key == K_s:
                        selected_level = (selected_level + 1) % 3
                    elif event.key == K_RETURN or event.key == K_SPACE:
                        button_sound.play()
                        return selected_level + 1, selected_bg
                    elif event.key == K_ESCAPE:
                        pygame.quit()
                        sys.exit()
                else:
                    if event.key == K_LEFT or event.key == K_a:
                        selected_bg = (selected_bg - 1) % 4
                    elif event.key == K_RIGHT or event.key == K_d:
                        selected_bg = (selected_bg + 1) % 4
                    elif event.key == K_RETURN or event.key == K_SPACE:
                        button_sound.play()
                        return selected_level + 1, selected_bg
                    elif event.key == K_ESCAPE:
                        pygame.quit()
                        sys.exit()
            elif event.type == MOUSEBUTTONDOWN:
                if event.button == 1:
                    for i, rect in enumerate(cards):
                        if rect.collidepoint(event.pos):
                            button_sound.play()
                            return i + 1, selected_bg
                    for i, rect in enumerate(bg_thumbs):
                        if rect.collidepoint(event.pos):
                            selected_bg = i
                            selection_mode = 1
                            break

        # 使用选中的背景作为菜单背景
        screen.blit(backgrounds[selected_bg], (0, 0))

        # 半透明遮罩
        overlay = pygame.Surface((width, height), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 160))
        screen.blit(overlay, (0, 0))

        # 标题
        title_text = title_font.render("飞 机 大 战", True, CYAN)
        title_rect = title_text.get_rect(center=(width // 2, 60))
        screen.blit(title_text, title_rect)

        subtitle_text = desc_font.render("选择关卡开始游戏", True, WHITE)
        subtitle_rect = subtitle_text.get_rect(center=(width // 2, 110))
        screen.blit(subtitle_text, subtitle_rect)

        # 绘制3个关卡卡片
        for i, rect in enumerate(cards):
            is_hovered = (hovered_level == i)
            is_selected = (selected_level == i)
            draw_button(screen, rect, "", level_font, is_hovered, is_selected)

            name_text = level_font.render(level_names[i], True, level_colors[i])
            name_rect = name_text.get_rect(center=(rect.centerx, rect.centery - 18))
            screen.blit(name_text, name_rect)

            detail_text = desc_font.render(level_details[i], True, GRAY)
            detail_rect = detail_text.get_rect(center=(rect.centerx, rect.centery + 20))
            screen.blit(detail_text, detail_rect)

        # 背景选择提示
        mode_text = "选择背景 (TAB切换)" if selection_mode == 1 else "选择关卡 (TAB切换背景)"
        mode_label = bg_font.render(mode_text, True, (200, 200, 200))
        mode_label_rect = mode_label.get_rect(center=(width // 2, bg_start_y - 15))
        screen.blit(mode_label, mode_label_rect)

        # 绘制4个背景缩略图
        for i, rect in enumerate(bg_thumbs):
            is_hovered = (hovered_bg == i)
            is_selected = (selected_bg == i)

            if is_selected:
                border_color = CYAN
            elif is_hovered:
                border_color = YELLOW
            else:
                border_color = GRAY

            # 绘制缩略图
            thumb = pygame.transform.scale(backgrounds[i], (bg_thumb_width, bg_thumb_height))
            screen.blit(thumb, rect.topleft)
            pygame.draw.rect(screen, border_color, rect, width=2)

            # 背景名称
            name_text = bg_font.render(bg_names[i], True, WHITE)
            name_rect = name_text.get_rect(center=(rect.centerx, rect.bottom + 10))
            screen.blit(name_text, name_rect)

        # 底部提示
        hint_text = hint_font.render("↑↓选择关卡  ←→选择背景  TAB切换  ENTER确认  ESC退出", True, GRAY)
        hint_rect = hint_text.get_rect(center=(width // 2, height - 20))
        screen.blit(hint_text, hint_rect)

        pygame.display.flip()
        clock.tick(60)


def main(difficulty=1, bg_index=0):
    """主游戏循环，difficulty: 1=普通, 2=精英, 3=隐藏, bg_index: 背景索引"""
    pygame.mixer.music.play(-1)

    # 根据难度设置参数
    if difficulty == 1:  # 普通
        small_count, mid_count, big_count = 15, 4, 2
        small_init_speed, mid_init_speed, big_init_speed = 2, 1, 1
        init_life = 3
        supply_interval = 30
        level_name = "普通"
    elif difficulty == 2:  # 精英
        small_count, mid_count, big_count = 20, 6, 3
        small_init_speed, mid_init_speed, big_init_speed = 3, 2, 1
        init_life = 3
        supply_interval = 40
        level_name = "精英"
    else:  # 隐藏
        small_count, mid_count, big_count = 25, 8, 4
        small_init_speed, mid_init_speed, big_init_speed = 4, 2, 2
        init_life = 2
        supply_interval = 50
        level_name = "隐藏"

    # 生成我方飞机
    me = myplane.MyPlane(bg_size)

    enemies = pygame.sprite.Group()

    # 生成敌方小型飞机
    small_enemies = pygame.sprite.Group()
    add_small_enemies(small_enemies, enemies, small_count)

    # 设置初始速度
    for each in small_enemies:
        each.speed = small_init_speed

    # 生成敌方中型飞机
    mid_enemies = pygame.sprite.Group()
    add_mid_enemies(mid_enemies, enemies, mid_count)
    for each in mid_enemies:
        each.speed = mid_init_speed

    # 生成敌方大型飞机
    big_enemies = pygame.sprite.Group()
    add_big_enemies(big_enemies, enemies, big_count)
    for each in big_enemies:
        each.speed = big_init_speed

    # 生成普通子弹
    bullet1 = []
    bullet1_index = 0
    BULLET1_NUM = 4
    for i in range(BULLET1_NUM):
        bullet1.append(bullet.Bullet1(me.rect.midtop))

    # 生成超级子弹
    bullet2 = []
    bullet2_index = 0
    BULLET2_NUM = 8
    for i in range(BULLET2_NUM // 2):
        bullet2.append(bullet.Bullet2((me.rect.centerx - 33, me.rect.centery)))
        bullet2.append(bullet.Bullet2((me.rect.centerx + 30, me.rect.centery)))

    clock = pygame.time.Clock()

    # 中弹图片索引
    e1_destroy_index = 0
    e2_destroy_index = 0
    e3_destroy_index = 0
    me_destroy_index = 0

    # 统计得分
    score = 0
    score_font = get_font(36)

    # 标志是否暂停游戏
    paused = False
    pause_nor_image = pygame.image.load("images/pause_nor.png").convert_alpha()
    pause_pressed_image = pygame.image.load("images/pause_pressed.png").convert_alpha()
    resume_nor_image = pygame.image.load("images/resume_nor.png").convert_alpha()
    resume_pressed_image = pygame.image.load("images/resume_pressed.png").convert_alpha()
    paused_rect = pause_nor_image.get_rect()
    paused_rect.left, paused_rect.top = width - paused_rect.width - 10, 10
    paused_image = pause_nor_image

    # 设置难度级别
    level = 1

    # 全屏炸弹
    bomb_image = pygame.image.load("images/bomb.png").convert_alpha()
    bomb_rect = bomb_image.get_rect()
    bomb_font = get_font(48)
    bomb_num = 3

    # 补给包定时器
    bullet_supply = supply.Bullet_Supply(bg_size)
    bomb_supply = supply.Bomb_Supply(bg_size)
    SUPPLY_TIME = USEREVENT
    pygame.time.set_timer(SUPPLY_TIME, supply_interval * 1000)

    # 超级子弹定时器
    DOUBLE_BULLET_TIME = USEREVENT + 1

    # 标志是否使用超级子弹
    is_double_bullet = False

    # 解除我方无敌状态定时器
    INVINCIBLE_TIME = USEREVENT + 2

    # 生命数量
    life_image = pygame.image.load("images/life.png").convert_alpha()
    life_rect = life_image.get_rect()
    life_num = init_life

    # 用于阻止重复打开记录文件
    recorded = False

    # 读取历史最高得分
    with open("record.txt", "r") as f:
        record_score = int(f.read())

    # 游戏结束画面
    gameover_font = get_font(48)
    again_image = pygame.image.load("images/again.png").convert_alpha()
    again_rect = again_image.get_rect()
    gameover_image = pygame.image.load("images/gameover.png").convert_alpha()
    gameover_rect = gameover_image.get_rect()

    # 返回菜单按钮
    menu_font = get_font(24)
    menu_text = menu_font.render("返回菜单 (U)", True, WHITE)
    menu_text_rect = menu_text.get_rect()

    # 用于切换图片
    switch_image = True

    # 用于延迟
    delay = 100

    # 动态背景粒子系统
    bg_particles = []
    if bg_index == 1:  # 樱花春日 - 花瓣（缓慢飘落）
        for _ in range(25):
            bg_particles.append({
                'x': float(randint(0, width)),
                'y': float(randint(0, height)),
                'size': randint(3, 5),
                'speed_y': 0.3 + random() * 0.4,
                'phase': random() * 6.28,
                'drift': 0.2 + random() * 0.3
            })
    elif bg_index == 2:  # 霓虹都市 - 闪烁霓虹
        for _ in range(15):
            bg_particles.append({
                'x': randint(0, width),
                'y': randint(height // 3, height // 2),
                'size': randint(2, 4),
                'phase': random() * 6.28,
                'speed': 0.02 + random() * 0.03
            })
    elif bg_index == 3:  # Lo-Fi雨夜 - 雨滴（缓慢下落）
        for _ in range(25):
            bg_particles.append({
                'x': float(randint(0, width)),
                'y': float(randint(0, height)),
                'length': randint(8, 15),
                'speed': 1.0 + random() * 1.5
            })

    running = True

    while running:
        for event in pygame.event.get():
            if event.type == QUIT:
                pygame.quit()
                sys.exit()

            elif event.type == MOUSEBUTTONDOWN:
                if event.button == 1 and paused_rect.collidepoint(event.pos):
                    paused = not paused
                    if paused:
                        pygame.time.set_timer(SUPPLY_TIME, 0)
                        pygame.mixer.music.pause()
                        pygame.mixer.pause()
                    else:
                        pygame.time.set_timer(SUPPLY_TIME, supply_interval * 1000)
                        pygame.mixer.music.unpause()
                        pygame.mixer.unpause()

            elif event.type == MOUSEMOTION:
                if paused_rect.collidepoint(event.pos):
                    if paused:
                        paused_image = resume_pressed_image
                    else:
                        paused_image = pause_pressed_image
                else:
                    if paused:
                        paused_image = resume_nor_image
                    else:
                        paused_image = pause_nor_image

            elif event.type == KEYDOWN:
                # ESC 暂停/继续（大小写统一识别）
                if event.key == K_ESCAPE:
                    paused = not paused
                    if paused:
                        pygame.time.set_timer(SUPPLY_TIME, 0)
                        pygame.mixer.music.pause()
                        pygame.mixer.pause()
                    else:
                        pygame.time.set_timer(SUPPLY_TIME, supply_interval * 1000)
                        pygame.mixer.music.unpause()
                        pygame.mixer.unpause()

                # U 键：暂停时或游戏结束时返回关卡选择
                elif event.key == K_u:
                    if paused or life_num == 0:
                        button_sound.play()
                        return

                elif event.key == K_SPACE:
                    if bomb_num:
                        bomb_num -= 1
                        bomb_sound.play()
                        for each in enemies:
                            if each.rect.bottom > 0:
                                each.active = False

            elif event.type == SUPPLY_TIME:
                supply_sound.play()
                if choice([True, False]):
                    bomb_supply.reset()
                else:
                    bullet_supply.reset()

            elif event.type == DOUBLE_BULLET_TIME:
                is_double_bullet = False
                pygame.time.set_timer(DOUBLE_BULLET_TIME, 0)

            elif event.type == INVINCIBLE_TIME:
                me.invincible = False
                pygame.time.set_timer(INVINCIBLE_TIME, 0)

        # 根据用户的得分增加难度
        if level == 1 and score > 500:
            level = 2
            upgrade_sound.play()
            add_small_enemies(small_enemies, enemies, 3)
            add_mid_enemies(mid_enemies, enemies, 2)
            add_big_enemies(big_enemies, enemies, 1)
            inc_speed(small_enemies, 1)
        elif level == 2 and score > 3000:
            level = 3
            upgrade_sound.play()
            add_small_enemies(small_enemies, enemies, 5)
            add_mid_enemies(mid_enemies, enemies, 3)
            add_big_enemies(big_enemies, enemies, 2)
            inc_speed(small_enemies, 1)
            inc_speed(mid_enemies, 1)
        elif level == 3 and score > 6000:
            level = 4
            upgrade_sound.play()
            add_small_enemies(small_enemies, enemies, 5)
            add_mid_enemies(mid_enemies, enemies, 3)
            add_big_enemies(big_enemies, enemies, 2)
            inc_speed(small_enemies, 1)
            inc_speed(mid_enemies, 1)
        elif level == 4 and score > 10000:
            level = 5
            upgrade_sound.play()
            add_small_enemies(small_enemies, enemies, 5)
            add_mid_enemies(mid_enemies, enemies, 3)
            add_big_enemies(big_enemies, enemies, 2)
            inc_speed(small_enemies, 1)
            inc_speed(mid_enemies, 1)

        # 绘制背景
        screen.blit(backgrounds[bg_index], (0, 0))

        # 动态背景效果（仅对非经典背景）
        if bg_index == 1:  # 樱花春日 - 花瓣缓慢飘落，带左右摇摆
            for petal in bg_particles:
                petal['y'] += petal['speed_y']
                petal['phase'] += 0.02
                petal['x'] += math.sin(petal['phase']) * petal['drift']
                if petal['y'] > height + 10:
                    petal['y'] = -10
                    petal['x'] = float(randint(0, width))
                pygame.draw.circle(screen, (255, 180, 200), (int(petal['x']), int(petal['y'])), petal['size'])
        elif bg_index == 2:  # 霓虹都市 - 霓虹灯缓慢闪烁
            for light in bg_particles:
                light['phase'] += light['speed']
                brightness = int(128 + 127 * math.sin(light['phase']))
                color = (255, brightness // 2, brightness)
                pygame.draw.circle(screen, color, (light['x'], light['y']), light['size'])
        elif bg_index == 3:  # Lo-Fi雨夜 - 雨滴缓慢下落（每3帧更新一次）
            if not (delay % 3):
                for rain in bg_particles:
                    rain['y'] += rain['speed']
                    if rain['y'] > height + 10:
                        rain['y'] = -rain['length']
                        rain['x'] = float(randint(0, width))
            for rain in bg_particles:
                pygame.draw.line(screen, (150, 180, 220),
                                 (int(rain['x']), int(rain['y'])),
                                 (int(rain['x']) + 1, int(rain['y']) + rain['length']), 1)

        if life_num and not paused:
            # 检测用户的键盘操作（WASD和方向键，已通过pygame常量实现大小写无关）
            key_pressed = pygame.key.get_pressed()

            if key_pressed[K_w] or key_pressed[K_UP]:
                me.moveUp()
            if key_pressed[K_s] or key_pressed[K_DOWN]:
                me.moveDown()
            if key_pressed[K_a] or key_pressed[K_LEFT]:
                me.moveLeft()
            if key_pressed[K_d] or key_pressed[K_RIGHT]:
                me.moveRight()

            # 绘制全屏炸弹补给并检测是否获得
            if bomb_supply.active:
                bomb_supply.move()
                screen.blit(bomb_supply.image, bomb_supply.rect)
                if pygame.sprite.collide_mask(bomb_supply, me):
                    get_bomb_sound.play()
                    if bomb_num < 3:
                        bomb_num += 1
                    bomb_supply.active = False

            # 绘制超级子弹补给并检测是否获得
            if bullet_supply.active:
                bullet_supply.move()
                screen.blit(bullet_supply.image, bullet_supply.rect)
                if pygame.sprite.collide_mask(bullet_supply, me):
                    get_bullet_sound.play()
                    is_double_bullet = True
                    pygame.time.set_timer(DOUBLE_BULLET_TIME, 18 * 1000)
                    bullet_supply.active = False

            # 发射子弹
            if not (delay % 10):
                bullet_sound.play()
                if is_double_bullet:
                    bullets = bullet2
                    bullets[bullet2_index].reset((me.rect.centerx - 33, me.rect.centery))
                    bullets[bullet2_index + 1].reset((me.rect.centerx + 30, me.rect.centery))
                    bullet2_index = (bullet2_index + 2) % BULLET2_NUM
                else:
                    bullets = bullet1
                    bullets[bullet1_index].reset(me.rect.midtop)
                    bullet1_index = (bullet1_index + 1) % BULLET1_NUM

            # 检测子弹是否击中敌机
            for b in bullets:
                if b.active:
                    b.move()
                    screen.blit(b.image, b.rect)
                    enemy_hit = pygame.sprite.spritecollide(b, enemies, False, pygame.sprite.collide_mask)
                    if enemy_hit:
                        b.active = False
                        for e in enemy_hit:
                            if e in mid_enemies or e in big_enemies:
                                e.hit = True
                                e.energy -= 1
                                if e.energy == 0:
                                    e.active = False
                            else:
                                e.active = False

            # 绘制大型敌机
            for each in big_enemies:
                if each.active:
                    each.move()
                    if each.hit:
                        screen.blit(each.image_hit, each.rect)
                        each.hit = False
                    else:
                        if switch_image:
                            screen.blit(each.image1, each.rect)
                        else:
                            screen.blit(each.image2, each.rect)

                    # 绘制血槽
                    pygame.draw.line(screen, BLACK,
                                     (each.rect.left, each.rect.top - 5),
                                     (each.rect.right, each.rect.top - 5),
                                     2)
                    energy_remain = each.energy / enemy.BigEnemy.energy
                    if energy_remain > 0.2:
                        energy_color = GREEN
                    else:
                        energy_color = RED
                    pygame.draw.line(screen, energy_color,
                                     (each.rect.left, each.rect.top - 5),
                                     (each.rect.left + each.rect.width * energy_remain,
                                      each.rect.top - 5), 2)

                    if each.rect.bottom == -50:
                        enemy3_fly_sound.play(-1)
                else:
                    if not (delay % 3):
                        if e3_destroy_index == 0:
                            enemy3_down_sound.play()
                        screen.blit(each.destroy_images[e3_destroy_index], each.rect)
                        e3_destroy_index = (e3_destroy_index + 1) % 6
                        if e3_destroy_index == 0:
                            enemy3_fly_sound.stop()
                            score += 1000
                            each.reset()

            # 绘制中型敌机：
            for each in mid_enemies:
                if each.active:
                    each.move()

                    if each.hit:
                        screen.blit(each.image_hit, each.rect)
                        each.hit = False
                    else:
                        screen.blit(each.image, each.rect)

                    pygame.draw.line(screen, BLACK,
                                     (each.rect.left, each.rect.top - 5),
                                     (each.rect.right, each.rect.top - 5),
                                     2)
                    energy_remain = each.energy / enemy.MidEnemy.energy
                    if energy_remain > 0.2:
                        energy_color = GREEN
                    else:
                        energy_color = RED
                    pygame.draw.line(screen, energy_color,
                                     (each.rect.left, each.rect.top - 5),
                                     (each.rect.left + each.rect.width * energy_remain,
                                      each.rect.top - 5), 2)
                else:
                    if not (delay % 3):
                        if e2_destroy_index == 0:
                            enemy2_down_sound.play()
                        screen.blit(each.destroy_images[e2_destroy_index], each.rect)
                        e2_destroy_index = (e2_destroy_index + 1) % 4
                        if e2_destroy_index == 0:
                            score += 100
                            each.reset()

            # 绘制小型敌机：
            for each in small_enemies:
                if each.active:
                    each.move()
                    screen.blit(each.image, each.rect)
                else:
                    if not (delay % 3):
                        if e1_destroy_index == 0:
                            enemy1_down_sound.play()
                        screen.blit(each.destroy_images[e1_destroy_index], each.rect)
                        e1_destroy_index = (e1_destroy_index + 1) % 4
                        if e1_destroy_index == 0:
                            score += 10
                            each.reset()

            # 检测我方飞机是否被撞
            enemies_down = pygame.sprite.spritecollide(me, enemies, False, pygame.sprite.collide_mask)
            if enemies_down and not me.invincible:
                me.active = False
                for e in enemies_down:
                    e.active = False

            # 绘制我方飞机
            if me.active:
                if switch_image:
                    screen.blit(me.image1, me.rect)
                else:
                    screen.blit(me.image2, me.rect)
            else:
                if not (delay % 3):
                    if me_destroy_index == 0:
                        me_down_sound.play()
                    screen.blit(me.destroy_images[me_destroy_index], me.rect)
                    me_destroy_index = (me_destroy_index + 1) % 4
                    if me_destroy_index == 0:
                        life_num -= 1
                        me.reset()
                        pygame.time.set_timer(INVINCIBLE_TIME, 3 * 1000)

            # 绘制全屏炸弹数量
            bomb_text = bomb_font.render("× %d" % bomb_num, True, WHITE)
            text_rect = bomb_text.get_rect()
            screen.blit(bomb_image, (10, height - 10 - bomb_rect.height))
            screen.blit(bomb_text, (20 + bomb_rect.width, height - 5 - text_rect.height))

            # 绘制剩余生命数量
            if life_num:
                for i in range(life_num):
                    screen.blit(life_image,
                                (width - 10 - (i + 1) * life_rect.width,
                                 height - 10 - life_rect.height))

            # 绘制得分和最佳成绩
            score_text = score_font.render("得分: %s" % str(score), True, WHITE)
            screen.blit(score_text, (10, 5))

            best_text = score_font.render("最佳: %s" % str(record_score), True, YELLOW)
            screen.blit(best_text, (10, 45))

        # 绘制游戏结束画面
        elif life_num == 0:
            pygame.mixer.music.stop()
            pygame.mixer.stop()
            pygame.time.set_timer(SUPPLY_TIME, 0)

            if not recorded:
                recorded = True
                with open("record.txt", "r") as f:
                    record_score = int(f.read())

                if score > record_score:
                    with open("record.txt", "w") as f:
                        f.write(str(score))

            record_score_text = score_font.render("最佳成绩: %d" % record_score, True, (255, 255, 255))
            screen.blit(record_score_text, (50, 50))

            gameover_text1 = gameover_font.render("你的得分", True, (255, 255, 255))
            gameover_text1_rect = gameover_text1.get_rect()
            gameover_text1_rect.left, gameover_text1_rect.top = \
                (width - gameover_text1_rect.width) // 2, height // 3
            screen.blit(gameover_text1, gameover_text1_rect)

            gameover_text2 = gameover_font.render(str(score), True, (255, 255, 255))
            gameover_text2_rect = gameover_text2.get_rect()
            gameover_text2_rect.left, gameover_text2_rect.top = \
                (width - gameover_text2_rect.width) // 2, \
                gameover_text1_rect.bottom + 10
            screen.blit(gameover_text2, gameover_text2_rect)

            again_rect.left, again_rect.top = \
                (width - again_rect.width) // 2, \
                gameover_text2_rect.bottom + 50
            screen.blit(again_image, again_rect)

            gameover_rect.left, gameover_rect.top = \
                (width - again_rect.width) // 2, \
                again_rect.bottom + 10
            screen.blit(gameover_image, gameover_rect)

            # 返回菜单提示
            menu_text_rect.center = (width // 2, gameover_rect.bottom + 40)
            screen.blit(menu_text, menu_text_rect)

            # 检测用户的鼠标操作
            if pygame.mouse.get_pressed()[0]:
                pos = pygame.mouse.get_pos()
                if again_rect.left < pos[0] < again_rect.right and \
                        again_rect.top < pos[1] < again_rect.bottom:
                    main(difficulty, bg_index)
                elif gameover_rect.left < pos[0] < gameover_rect.right and \
                        gameover_rect.top < pos[1] < gameover_rect.bottom:
                    return

        # 绘制暂停按钮
        screen.blit(paused_image, paused_rect)

        # 暂停时显示提示
        if paused:
            pause_overlay = pygame.Surface((width, height), pygame.SRCALPHA)
            pause_overlay.fill((0, 0, 0, 100))
            screen.blit(pause_overlay, (0, 0))

            pause_font = get_font(48)
            pause_text = pause_font.render("游戏暂停", True, WHITE)
            pause_text_rect = pause_text.get_rect(center=(width // 2, height // 2 - 30))
            screen.blit(pause_text, pause_text_rect)

            hint_font = get_font(20)
            hint_text = hint_font.render("按 ESC 继续  按 U 返回菜单", True, GRAY)
            hint_text_rect = hint_text.get_rect(center=(width // 2, height // 2 + 30))
            screen.blit(hint_text, hint_text_rect)

        # 切换图片
        if not (delay % 5):
            switch_image = not switch_image

        delay -= 1
        if not delay:
            delay = 100

        pygame.display.flip()
        clock.tick(60)


if __name__ == "__main__":
    try:
        while True:
            difficulty, bg_index = level_select()
            main(difficulty, bg_index)
    except SystemExit:
        pass
    except:
        traceback.print_exc()
        pygame.quit()
        input()