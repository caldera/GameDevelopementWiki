---
title: Vampire Survivors — 进化四种类型深入分析
sidebar_position: 3
tags: [game-design, roguelite, survivor-like, weapons, progression]
---

# Vampire Survivors — 进化四种类型深入分析

> **关联文档**：[Vampire Survivors 玩法拆解与设计分析](./vampire-survivors)

---

## 概述

武器进化（Evolution）在 Wiki 中被明确定义为一个总称，其下包含四种不同的子类型：**Evolution（标准进化）**、**Union（融合）**、**Gift（赠与）**、**Morph（形态变化）**。每种类型的触发条件、槽位消耗、奖励形式完全不同。本文用 Wiki 的精确数据逐一深挖。

---

## 类型 A：标准进化（Evolution）

### 基础公式

```
基础武器 Lv.8  +  对应被动道具 Lv.5  +  进化宝箱
→  基础武器消失，进化武器出现
```

典型示例：**Whip（鞭子）+ Hollow Heart（空心） → Bloody Tear（血鞭）**

### 完整进化对照表（基础游戏）

| 基础武器 | 进化催化剂 | 进化武器 | 进化效果变化 |
|---------|-----------|---------|-------------|
| Whip | Hollow Heart | Bloody Tear | 鞭击范围 +40%，击中回血 |
| Magic Wand | Empty Tome | Holy Wand | 自动追踪 + 无冷却（冷却 = 0） |
| Knife | Armor | Thousand Edge | 投射物大量增加，变成弹幕 |
| Axe | Candelabrador | Death Spiral | 全方向飞出回旋镖弹幕 |
| Cross | Clover | Heaven Sword | 从天而降的剑雨，范围极大 |
| King Bible | Spellbinder | Unholy Vespers | 从"环绕几秒消失"变成**永久环绕** |
| Fire Wand | Spinach | Hellfire | 巨大火柱，高伤害 AOE |
| Garlic | Pummarola | Soul Eater | 回血免疫，伤害更高 |
| Santa Water | Attractorb | La Borra | 从单体放置变成**持续存在的毒池** |
| Runetracer | Bracer | NO FUTURE | 反弹更久，弹道更快 |
| Lightning Ring | Duplicator | Thunder Loop | 自动全屏范围闪电 |
| Pentagram | Stone Mask | Gorgeous Moon | 全屏清 + 生成大量经验宝石 |
| Gatti Amari | Stone Mask | Vicious Hunger | 猫召唤物更多 + 掉落金币 |
| Song of Mana | Skull O'Maniac | Mannajja | 音波范围增大 + 减速效果 |
| Shadow Pinion | Shadow Pinion (自身) | Valkyrie Turner | 弹射触发双倍伤害 |
| Clock Lancet | Silver Ring + Gold Ring | Infinite Corridor | 冻结光环 + 百分比伤害 |
| Laurel | Metaglio Left + Metaglio Right | Crimson Shroud | 无限护盾 + 反弹伤害 |
| Bone | (Chaos Malachite 遗物) | Anima of Mortaccio | 见 Morph 类型 |
| Cherry Bomb | Torrona's Box | Carozza! | 爆炸范围 + 减速 |
| Carréllo | Torrona's Box | Profusione D'Amore | 弹幕扩散范围增大 |
| Celestial Dusting | Torrona's Box | — | 粉尘范围扩大 |
| Flames of Misspell | Torrona's Box + Spellbinder | Ashes of Muspell | AOE 持续伤害增强 |
| Night Sword | Pummarola + Metalaglio L+R | Muramasa | 吸血剑 + 极高回复 |
| Victory Sword | Torrona's Box + Spellbinder | Sole Solution | 超大剑气 |
| SpellString | (见 Union) | — | 三合一融合武器 |
| Espada Ropera | Parm Aegis | Dress Sword | 攻防一体 |

### 被动道具是否会消耗？

| 进化类型 | 被动道具状态 |
|---------|-----------|
| 标准进化（大部分） | 被动道具**保留不变** |
| 关卡特殊道具（银戒/金戒/Metaglio） | **消耗**，从槽位移除 |
| Torrona's Box 系列 | **消耗** |
| 需高阶进化的（Infinite Corridor/Crimson Shroud） | **消耗所有相关被动** |

**关键设计决策**：

大多数进化中被动道具保留 → 你可以继续享受属性加成 + 无需重新找被动

少数特殊进化中被动道具消耗 → 因为这些被动道具（银戒/金戒）是专门为了进化存在的，没有保留价值

Torrona's Box 消耗 → 因为它太强（+25% 所有属性），必须付出代价

### Bracelet 系列：不需要被动道具的进化

Bracelet Lv.8 → 不需要被动道具 → 进化成 Bi-Bracelet（更高级别）

Bi-Bracelet Lv.8 → 不需要被动道具 → 进化成 Tri-Bracelet（最高级别）

这类武器的进化不需要被动道具，只需要武器满级 + 宝箱。条件最宽松，但进化效果也相对温和。

### 多重进化宝箱

大多数地图一次只能进化一个武器。但存在特殊的**多重进化宝箱**：

| 地图/来源 | 最大同时进化数 |
|----------|-------------|
| Il Molise（9/11/13 分钟非 Arcana 宝箱） | 5 |
| Dairy Plant（10 分钟宝箱） | 3 |
| Gallo Tower（10 分钟宝箱） | 3 |
| Cappella Magna（10 分钟宝箱） | 3 |
| Giant Enemy Crab 掉落 | 5 |
| Bat Country / Tiny Bridge（所有进化宝箱） | 全部多重 |

打开一个宝箱 → 3-5 个武器同时进化 → 满屏特效爆发，这是游戏中最爽的瞬间。

---

## 类型 B：融合（Union）

### 定义

```
武器 A Lv.8  +  武器 B Lv.8（有时还需要被动道具）+ 宝箱
→  两种基础武器消失，融合武器出现
→  腾出一个武器槽
```

融合是 VS 中少数能让玩家**真正多出一个武器槽**的途径。

### 现存的所有融合武器

| 编号 | 融合武器 | 基础武器 A | 基础武器 B | 额外条件 |
|------|---------|-----------|-----------|---------|
| 1 | **Vandalier** | Peachone Lv.8 | Ebony Wings Lv.8 | 无 |
| 2 | **Phieraggi** | Phiera Der Tuphello Lv.8 | Eight The Sparrow Lv.8 | 无 |
| 3 | **Fuwalafuwaloo** | Vento Sacro Lv.8 | Bloody Tear Lv.8 | 无 |
| 4 | **SpellStrom** | SpellString Lv.6 | SpellStream Lv.6 + SpellStrike Lv.6 | ⚠ 三武器融合 |

### 融合武器详解

#### Vandalier（双鸟合一）

**属性数据**（来自 Wiki）：

| 属性 | 数值 |
|------|------|
| 伤害 | 28 (-2 相比单独鸟) |
| Amount | 20 (-2) |
| 冷却 | 1.0秒 (+0.5) |
| 范围 | 2.2 |
| 持续时间 | 4.0秒 |
| Pool Limit | 100 (+40) |

**特性**：
- 两只彩鸟绕着玩家飞行，在两个圆形轨道上投弹
- 一个顺时钟、一个逆时钟
- 有 8 个等级，每个等级增加范围或减少冷却
- 当 Vandalier 达到 Lv.5 后，冷却比单独 Peachone 或 Ebony Wings 满级更低，**进化收益超过两者的总和**
- **融合后的效果**：
  - 两个武器合并成一个 → 腾出一个武器槽
  - 保留了两只鸟的攻击模式（顺+逆时钟）
  - 损失了少量基础伤害（-2）和投射物量（-2）
  - 但获得了更大的范围、更多的池空间

#### Fuwalafuwaloo（Vento Sacro + Bloody Tear）

Vento Sacro（风元素） + Bloody Tear（血鞭） 融合 → Fuwalafuwaloo

- 这是唯一一个需要**进化后的武器**作为融合材料的融合
- 必须先进化出 Bloody Tear，再拿 Vento Sacro，然后两者融合
- 融合效果：龙卷风带群控，同时吸血

#### SpellStrom（三武器融合）

**来自 Tides of the Foscari DLC**（Wiki 标注 DLC 专属）

```
SpellString Lv.6 + SpellStream Lv.6 + SpellStrike Lv.6 → SpellStrom
```

这是第一把**三武器融合**武器。**仅需 Lv.6 而非 Lv.8**（因为三个武器凑满 6+6+6=18 级已经付出了足够代价）。

**属性**：

| 属性 | 数值 |
|------|------|
| 伤害 | 15 |
| 冷却 | 3.9秒 |
| 持续时间 | 0.3秒（单个） |
| 特殊效果 | Singularity（奇点爆发） |

**核心机制**：
- SpellStrom 保留 SpellString、SpellStream、SpellStrike 的全部效果
- 三个效果同时出现：蓝色粒子 + 两个重力井环绕角色
- 每隔一段时间触发 **Singularity**（奇点）：
  - 两个重力井螺旋相撞
  - 对全屏敌人造成伤害
  - Singularity 伤害计算公式：`(基础伤害 + 累计持续时间 + 弹道速度 + 范围) × 投射物数量`
  - 基础冷却 40 秒（20 秒不可减少 + 20 秒可减少到 2 秒）
  - 每次触发 Singularity → 伤害 +5（无限叠加）
- 与大多数武器不同，SpellStrom **保留 Limit Break 的属性加成**

### 融合时机的战略意义

```
融合前：武器 [Peachone][Ebony Wings][C][D][E][F] → 满槽
融合后：武器 [Vandalier][C][D][E][F][ ] → 空出一个槽

如果你在满 6 槽后才融合：
→ 空出一槽
→ 可以再拿一个新武器
→ 相当于一局能带 7 个武器（间接突破上限）
```

---

## 类型 C：赠与（Gift）

### 定义

```
满足条件 → 获得额外武器/道具
→ 基础武器保留（不移除）
→ 赠品是额外的，不占槽位
```

### Super Candybox II Turbo

这是最典型的 Gift。来自 Wiki 的精确数据：

| 属性 | 数值 |
|------|------|
| ID | CANDYBOX2 |
| 类型 | Gift |
| 稀有度 | 0.1（极其稀有） |
| 伤害 | — |
| 范围 | 100% |
| 冷却 | 0秒 |

**获取条件**：
1. 所有已装备武器 + 被动道具全部满级
2. 本局已经获得过 Candybox（可以复制任何武器的特殊武器）
3. 打开宝箱 → 宝箱内所有奖励变成 Coin Bag（因为已满级）
4. Super Candybox II Turbo 以极低概率（0.1 × Luck）替代一个 Coin Bag
5. 5 级宝箱（5 次奖励）**保证**在满足条件后触发一次

**效果**：
- 打开后列出**大部分已解锁的进化武器**让你挑选
- 你可以得到一个本局还没拿到的进化武器
- 不占用武器槽（它是"赠予"的额外武器）

### 其他 Gift 形式的进化

Gift 形式的武器在游戏中很少，Super Candybox II Turbo 是最主要的例子。其他形式包括：

- 某些特殊关卡道具：玩家触碰后获得不占槽的武器
- 某些角色的初始 Arcana 效果（Avatar Infernas 自带 Heart of Fire）

**Gift 的设计意图**：
- 打破了 6 槽限制（赠品不占槽）
- 但获取条件极其苛刻（全部满级 + 极低概率）
- 所以它是"顶端玩家"的奖励，不是常规玩法

---

## 类型 D：形态变化（Morph）

### 定义

```
角色达到特定等级 + 持有对应遗物（Relic）
→ 角色自动变化形态
→ 初始武器自动进化（不需要宝箱）
→ 角色属性提升
```

Morph 是**角色独有**的机制，不是通用进化路线。

### 四个 Morph 角色

| 角色 | 初始武器 | 遗物需求 | 等级需求 | 进化后果 |
|------|---------|---------|---------|---------|
| **Mortaccio** | Bone | Chaos Malachite | Lv.80 → Anima of Mortaccio | +2 Armor, +1 Amount, +100 Max HP |
| **Yatta Cavallo** | Cherry Bomb | Chaos Malachite | Lv.80 → Yatta Daikarin | 同上 |
| **Bianca Ramba** | Celestial Dusting | Chaos Malachite | Lv.80 → Profusione D'Amore | 同上 |
| **O'Sole Meeo** | La Robba | Chaos Malachite | Lv.80 → Carozza! | 同上 |

注意到 **Mortaccio、Cavallo、Ramba、O'Sole** 四个角色共享相同的被动加成（每 20 级 +1 Amount，最多 +3），而且属性完全一致，唯一的区别就是初始武器。

### Mortaccio Morph 完整数据（来自 Wiki）

**Morph 前**（Mortaccio 默认）：

| 等级 | Amount 加成 |
|------|-----------|
| Lv.1-19 | 0 |
| Lv.20-39 | +1 |
| Lv.40-59 | +2 |
| Lv.60+ | +3 |

**获得 Chaos Malachite 后，达到 Lv.80**：

→ 角色变成 Goshadokuro（骸骨巨鬼形态）
→ Bone 自动进化成 **Anima of Mortaccio**
→ 获得 +2 Armor
→ 获得 +1 Amount（相当于总共 +4）
→ 获得 +100 Max HP

**关键设计点**：

1. **不需要宝箱** — 这是唯一不需要宝箱的"进化"方式
2. **自动触发** — 达到等级 + 持有遗物 → 瞬间完成，无需玩家额外操作
3. **角色也变化** — 不只是武器变化，角色外形和属性都变了
4. **可以封印** — 从 v1.4.200 开始，玩家可以在菜单中 Seal（封印）Chaos Malachite，阻止 Morph 发生

### 为什么 Morph 不需要宝箱？

从设计角度分析：

- 宝箱是"标准进化"的仪式感容器
- Morph 是角色自身的成长，与宝箱无关
- 也符合角色设定：Mortaccio 达到 Lv.80 时"觉醒"为强大形态
- 这给了角色一个独特的长期目标（Lv.80 在一局中需要约 20-25 分钟才能达到）

### 与其他进化类型的对比

| 维度 | Evolution | Union | Gift | Morph |
|------|-----------|-------|------|-------|
| 基础武器 | 消失 | 消失（两个） | 保留 | 消失 |
| 槽位变化 | 不变（进化武器占原槽） | **腾出一槽** | 无变化（额外武器） | 不变 |
| 触发条件 | 被动 Lv.5 + 宝箱 | 两个武器各 Lv.8 + 宝箱 | 全部满级 + 稀有宝箱 | 角色 Lv.80 + 遗物 |
| 宝箱需求 | ✅ 必须 | ✅ 必须 | ✅ 必须 | ❌ **不需要** |
| 形式 | 基础 + 被动 → 进化 | 武器 + 武器 → 融合 | 额外获得 | 角色变身 |
| 唯一性 | 通用 | 少数组合 | 极少数 | 仅 4 个角色 |

---

## 四个进化类型的互补设计

| 类型 | 设计目的 |
|------|---------|
| **Evolution (A)** | 核心循环：被动道具变成进化催化剂，制造"养等 → 质变" |
| **Union (B)** | 高回报融合：两个武器换一个 + 腾槽，奖励高风险配置 |
| **Gift (C)** | 突破极限：满配后的额外奖励，给顶端玩家更多的追求 |
| **Morph (D)** | 角色独有：每个角色有自己的成长弧线，不止是初始武器区别 |

这四个类型覆盖了从基础玩法到顶端挑战的不同阶段：
- A：每局 4-6 次 — 核心体验
- B：少数局 1 次 — 特殊配装奖励
- C：极少数局 1 次 — 顶端玩家奖励
- D：特定角色必出 — 角色专属体验

---

## 数据来源

- [Vampire Survivors Wiki — Evolution](https://vampire.survivors.wiki/w/Evolution)
- [Vampire Survivors Wiki — Combos](https://vampire.survivors.wiki/w/Combos)
- [Vampire Survivors Wiki — Super Candybox II Turbo](https://vampire.survivors.wiki/w/Super_Candybox_II_Turbo)
- [Vampire Survivors Wiki — Vandalier](https://vampire.survivors.wiki/w/Vandalier)
- [Vampire Survivors Wiki — SpellStrom](https://vampire.survivors.wiki/w/SpellStrom)
- [Vampire Survivors Wiki — Mortaccio](https://vampire.survivors.wiki/w/Mortaccio)
- [Vampire Survivors Wiki — Weapons](https://vampire.survivors.wiki/w/Weapons)
