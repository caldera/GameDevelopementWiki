---
sidebar_position: 1
tags: [ue5, actionrpg, gas, boss-system, project-analysis]
---

# ActionRPG Game V5 项目分析

**项目路径：** `H:\3D Game Dev\ActionRPGGameV5`  
**引擎版本：** UE 5.7（C++ + Blueprint 混合）  
**解决方案：** `AdvancedActionRPG.sln`  
**核心系统：** GAS / EnhancedInput / MotionWarping / JSON 配置驱动  
**架构模式：** Component-based 分层架构（Combat、UI、Input）  
**主角模型：** 殷（Yin），使用 ParagonYin 资源

---

## 📐 项目架构总览

```
Source/AdvancedActionRPG (C++ 130+ 文件)
├── AbilitySystem/              ← GAS 核心
│   ├── ActionRPGAbilitySystemComponent
│   ├── ActionRPGAttributeSet
│   ├── Abilities/              ← GameplayAbility 体系
│   └── GEExecCalc/             ← 伤害计算执行器
├── Characters/                 ← 角色层级
│   ├── ActionRPGBaseCharacter  ← ASC + AttributeSet + MotionWarping
│   ├── ActionRPGHeroCharacter  ← 相机、输入、连招
│   └── ActionRPGEnemyCharacter ← JSON 配置、Boss 系统
├── Components/                 ← 组件式功能拆分
│   ├── Combat/                 ← 战斗组件（Pawn/Hero/Enemy）
│   ├── Input/                  ← 输入组件
│   ├── UI/                     ← UI 组件（Pawn/Hero/Enemy）
│   ├── BossComponent           ← Boss 战管理器
│   ├── DodgeComponent          ← 闪避组件
│   └── StaggerSystemComponent  ← 韧性/硬直
├── BossSystem/                 ← Boss 战斗子系统（19 文件）
│   ├── CombatStateMachine      ← 9 态战斗状态机
│   ├── PlayerStateMachine      ← 11 态玩家状态机
│   ├── QTEManager              ← 终结技 QTE
│   ├── CameraManager           ← Boss 战相机
│   └── ...
├── GameConfig/                 ← JSON 配置系统
│   ├── GameConfigTypes.h       ← 全部配置结构体
│   ├── ActionRPGConfigManager  ← 配置管理器
│   └── ActionRPGConfigHelper   ← 配置应用桥梁
├── GameModes/                  ← 游戏模式
├── Items/                      ← 武器/拾取物/宝箱
├── Controllers/                ← AI + 玩家控制器
├── Dialogs/                    ← JSON 对话
└── Interfaces/                 ← 解耦接口层

GameData/ (JSON 数据驱动)
├── Enemies/                    ← 敌人配置（FrostGiant, Goblin 等）
├── Items/                      ← 物品配置（消耗品/装备/任务道具）
├── Player/                     ← 玩家配置（英雄/闪避/专注/药水/架势）
└── Dialogs/                    ← 对话配置

Content/ActionRPGGame (蓝图资产)
├── PlayerCharacter/            ← 玩家蓝图
├── EnemyCharacter/             ← 敌人蓝图
├── GameModes/                  ← 游戏模式蓝图
├── Widgets/                    ← UI 控件
├── Effects/                    ← 特效
└── ...
```

---

## 🧱 核心架构模式

### Component-based 三层分层

项目采用**面向接口的 Component 架构**：

```
I/F 接口层               实现层                  使用层
PawnCombatInterface ── PawnCombatComponent ── BaseCharacter
                    ├── HeroCombatComponent ── HeroCharacter
                    └── EnemyCombatComponent ── EnemyCharacter
```

| 分层 | 职责 | 示例 |
|------|------|------|
| **Interface** | 定义契约，解耦调用方与实现 | `PawnCombatInterface` |
| **Component** | 功能实现，挂载到角色上 | `HeroCombatComponent` |
| **Character** | 组合组件，协调业务逻辑 | `AActionRPGHeroCharacter` |

### 配置驱动模式

```
GameData/*.json → ActionRPGConfigManager → ConfigHelper → Character/Component
```

所有可变数据（敌人属性、物品参数、架势配置）存储在 JSON 中，运行时由 `UActionRPGConfigManager`（UGameInstanceSubsystem）加载和分发。

---

## ⚔️ GAS 架构详解

### 角色继承链

```
AActor
└── APawn
    └── AActionRPGPawn <PawnCombatInterface, PawnUIInterface>
        └── AActionRPGBaseCharacter <ASC, AttributeSet, MotionWarping>
            ├── AActionRPGHeroCharacter <相机, 输入, 连招>
            └── AActionRPGEnemyCharacter <EnemyConfigID, Boss系统>
```

### Ability 继承链

```
UActionRPGGameplayAbility (基类)
├── UActionRPGHeroGameplayAbility  (英雄专属)
└── UActionRPGEnemyGameplayAbility (敌人专属)
    └── GA_Hero_Execute / GA_Hero_Immobilize / GA_Hero_IronShield
```

### 属性集

```cpp
class UActionRPGAttributeSet : public UAttributeSet
{
    // 核心属性
    UPROPERTY(ReplicatedUsing=OnRep_Health)
    FGameplayAttributeData Health;
    
    UPROPERTY(ReplicatedUsing=OnRep_MaxHealth)
    FGameplayAttributeData MaxHealth;
    
    UPROPERTY(ReplicatedUsing=OnRep_Stamina)
    FGameplayAttributeData Stamina;
    
    // 战斗属性
    FGameplayAttributeData AttackPower;
    FGameplayAttributeData DefensePower;
    FGameplayAttributeData DamageTakenMultiplier;
    
    // 伤害后置修正
    FGameplayAttributeData HitDirection;     // 受击方向
    FGameplayAttributeData HitReactWeight;   // 受击反应权重
};
```

### 伤害计算流程

```
GA 触发攻击 → ApplyGameplayEffectToTarget
  ↓
GEExecCalc_DamageTaken (ExecutionCalculation)
  ├── 采集攻击方属性 (AttackPower, DamageTags)
  ├── 采集防御方属性 (DefensePower, DamageTakenMultiplier)
  ├── 伤害公式: BaseDamage × （1 - DefenseReduction）× HitReactWeight
  └── 应用伤害 → SetByCaller Damage → Health 衰减
```

---

## 🤖 Boss 系统深度分析

Boss 系统是项目最复杂的部分，经过多轮迭代融合（black11 + black12），最终架构如下：

### 组件架构

```
AActionRPGEnemyCharacter
  ├── UBossComponent (ActorComponent) ← Boss 战主控
  │     ├── UCombatStateMachine       ← 9 态战斗状态机
  │     ├── UInvincibilityManager     ← 无敌帧管理
  │     ├── UQTEManager               ← QTE 终结技
  │     ├── UVFXSFXManager            ← 特效/音效
  │     ├── UAudioManager             ← BGM/音效
  │     └── UMontageManager           ← 蒙太奇管理
  ├── UStaggerSystemComponent         ← 韧性/硬直
  ├── UDodgeBlockManager              ← 闪避/格挡
  ├── UComboManager                   ← 连击计数/倍率
  ├── UCameraManager (UComponent)     ← Boss 战相机
  ├── ULockOnComponent                ← 锁定组件
  └── UHitReactAnimLayer              ← 受击动画分层
```

### CombatStateMachine — 9 态

```
Idle → Battle → Attack → Dodge → Block → Stagger → Cast → Execute → Death
```

### PlayerStateMachine — 11 态

```
待战 → 移动 → 轻击 → 重击 → 连招 → 闪避 → 格挡 → 硬直 → 击倒 → 施法 → 死亡
```

### 机制池设计

Boss 的阶段性能力通过**机制池 + 阶段引用**设计：

```json
"Mechanics": [
    {"MechanicID": "FrenzyMode", "DamageMultiplier": 1.3, "TriggerCondition": "OnPhaseEnter"},
    {"MechanicID": "IceAOETrap", "Cooldown": 12.0, "TriggerCondition": "TimeInterval"}
],
"PhaseConfigs": [{
    "PhaseName": "Phase1",
    "ActiveMechanicIDs": []
}, {
    "PhaseName": "Phase2_Frenzy",
    "ActiveMechanicIDs": ["FrenzyMode", "IceAOETrap"]
}]
```

### JSON 配置驱动的敌人系统

```json
{
    "EnemyID": "FrostGiant",
    "EnemyName": "Frost Giant",
    "DefaultValues": {
        "Health": 5000,
        "AttackPower": 15.0
    },
    "PhaseConfigs": [...],
    "LootTable": [...],
    "DropsOnDeath": {...}
}
```

---

## 🌊 开发历程与技术决策

### 版本演进

| 版本 | 阶段 | 核心变更 |
|------|------|---------|
| black5 | 基础框架 | AnimNotify_ComboWindow |
| black3 | 相机/锁定 | CameraManager, LockOnComponent |
| black7 | 动画/蒙太奇 | MontageManager, HitReactAnimLayer |
| black9 | 状态机 | PlayerStateMachine, AudioManager |
| black10 | Boss 状态机 | CombatStateMachine, InvincibilityManager |
| black11 | 接口重构 | 7 个 `I*Interface` + Stagger + Transform 系统 |
| black12 | 战斗系统 | QTEManager, VFXSFXManager, DodgeBlockManager, ComboManager |

### 关键技术决策

| 决策 | 方案 | 理由 |
|------|------|------|
| 配置格式 | JSON + UGameInstanceSubsystem | 热重载，非程序员可编辑 |
| 角色架构 | 接口 + 组件组合 | 避免深继承，高内聚低耦合 |
| Boss 战斗 | 独立 BossSystem 模块 | 与基础战斗系统分离，可独立迭代 |
| 受击反馈 | 动画分层 + 权重系统 | 不打断基础动画 |
| AI | 行为树 + BossAIController | 标准 UE 方案 |
| 状态机 | 9 态战斗 + 11 态玩家 | 精确控制每帧行为 |

---

## 🔧 工程实践亮点

| 实践 | 说明 |
|------|------|
| **配置热重载** | `rpg.ReloadConfigs` 控制台命令，修改 JSON 无需重启 |
| **Boss 调试命令** | `rpg.StartBossFight` / `rpg.AdvancePhase` / `rpg.ShowBossDebug` |
| **控制台日志追踪** | 每个 Boss 阶段转换输出精确日志流 |
| **UE5.7 兼容修复** | 针对 API 变更的系统性修复方案 |
| **.h 前置声明** | .h 文件用前置声明减少编译依赖，.cpp 包含完整头文件 |
| **world 拆除保护** | `bIsTearingDown` 检查避免 SpawnActor 失败警告 |

---

## 📋 关键数据

| 指标 | 数值 |
|------|------|
| C++ 源文件 | 130+ 文件 |
| JSON 配置文件 | 20+ 文件 |
| 已知敌人类型 | 7 种（含 Boss） |
| 玩家架势 | 3 种（立棒/劈棒/拙棒） |
| 战斗状态 | Boss 9 态 + 玩家 11 态 |
| 接口数量 | 9 个（含 black11 合并） |
| BossSystem 文件 | 19 个 |
| 地图数量 | 30 张 |
