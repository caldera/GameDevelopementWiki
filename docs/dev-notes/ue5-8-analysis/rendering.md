---
sidebar_position: 4
tags: [ue5, ue5-8, rendering, rhi, d3d12, vulkan, gpu]
---

# 渲染系统 RHI & Renderer

UE5.8 的渲染系统分为三层：**RHI**（硬件接口抽象）→ **RenderCore**（渲染核心工具）→ **Renderer**（渲染管线）。

## RHI — 渲染硬件接口

```
Runtime/RHI/Public/
├── RHI.h                ← 核心 RHIImmediateCommandContext
├── RHIDefinitions.h     ← 枚举和类型定义
├── RHICommandList.h     ← 命令列表（GPU 命令录制）
├── RHITransition.h      ← 资源状态转换
├── RHIAccess.h          ← 资源访问权限
├── RHIBuffer.h          ← GPU Buffer
├── RHITexture.h         ← 纹理
├── RHIShader.h          ← 着色器
├── RHISampler.h         ← 采样器
├── RHIRenderPass.h      ← RenderPass
├── RHIFence.h           ← GPU 同步
└── DynamicRHI.h         ← 动态 RHI 创建
```

RHI 是跨平台 GPU 接口的抽象层，所有平台特定的 RHI（D3D12、Vulkan、Metal）都实现同一接口。

### D3D12RHI 实现 (DirectX 12)

```
Runtime/D3D12RHI/Private/
├── D3D12RHI.cpp            ← 主 RHI 实现
├── D3D12CommandList.cpp    ← Command List 管理
├── D3D12CommandQueue.cpp   ← Command Queue
├── D3D12DescriptorCache.cpp ← 描述符缓存
├── D3D12PipelineState.cpp  ← PSO 管理
├── D3D12RayTracing.cpp     ← 光线追踪
/Public/
├── D3D12RHIPrivate.h       ← 内部头文件
├── D3D12Resources.h        ← GPU 资源管理
├── D3D12Util.h             ← 工具函数
└── D3D12View.h             ← View/RTV/DSV/SRV/UAV
```

### VulkanRHI 实现

```
Runtime/VulkanRHI/Private/
├── VulkanRHI.cpp           ← 主 RHI
├── VulkanCommandList.cpp
├── VulkanPipelineState.cpp
├── VulkanRayTracing.cpp
└── VulkanMemory.cpp         ← VMA 内存管理
```

## RenderCore — 渲染核心库

```
Runtime/RenderCore/Public/
├── RenderTargetPool.h       ← RT 池
├── Shader.h                 ← 着色器基类
├── ShaderParameter.h        ← 着色器参数绑定
├── ShaderCore.h             ← 着色器核心
├── ShaderResource.h         ← 着色器资源
├── RenderGraph.h            ← RDG (Render Graph)
├── RenderGraphUtils.h       ← RDG 工具
├── RDGResources.h           ← RDG 资源
├── RDGBuilder.h             ← RDG 构建器
└── RenderResource.h         ← 渲染资源基类
```

### Render Graph (RDG)

UE5 引入了 Render Graph（渲染图）框架，在 UE5.8 中进一步成熟：

```
1. 声明 Pass → 描述输入/输出资源
2. 构建 RDG → 自动分析依赖、合并 Pass、管理生命周期
3. 执行 → 自动插入 Barrier、按序提交 Command List
```

核心文件：`RenderGraph.h`, `RDGBuilder.h`, `RDGResources.h`

## Renderer — 渲染管线 Pass

```
Runtime/Renderer/Private/
├── BasePassRendering.cpp/h   ← 基础 Pass（不透明/遮罩）
├── TranslucencyPass.cpp      ← 半透明 Pass
├── PostProcess/              ← 后处理
├── DeferredShadingRenderer.h ← 延迟渲染主入口
├── ForwardShadingRenderer.h  ← 前向渲染
├── SceneVisibility.cpp       ← 场景可见性裁剪
├── SceneOcclusion.cpp        ← 遮挡剔除
├── AnisotropyRendering.cpp   ← 各向异性渲染
├── CapsuleShadowRendering.cpp ← 胶囊阴影
├── ClusteredDeferredShadingPass.cpp ← 簇式延迟着色
├── CustomDepthRendering.cpp  ← 自定义深度
├── DebugProbeRendering.cpp   ← Debug Probe
├── LumenDiffuseIndirect.cpp  ← Lumen 间接漫反射
├── LumenReflections.cpp      ← Lumen 反射
├── Nanite/                   ← Nanite 渲染
├── SkyLighting.cpp           ← 天空光照
├── SubsurfaceScattering.cpp  ← 次表面散射
├── DistanceFieldAOScreenGrid.cpp ← DF AO
├── HairRendering.cpp         ← 毛发渲染
└── GPUScene.cpp              ← GPU Scene
```

### 主要 Pass 管线

```
Frame 渲染流程（简化）:
1. GPUScene 更新（GPUScene.cpp）
2. 可见性计算（SceneVisibility.cpp）
3. 深度 PrePass（DepthRendering.cpp）
4. BasePass（不透明/遮罩材质渲染）
5. Shadow Depth Passes（阴影深度）
6. 延迟光照（DeferredLighting）
7. Lumen 间接漫反射 + 反射
8. 半透明 Pass
9. PostProcessing
10. UI/Overlay
```

### Nanite

源码位于 `Runtime/Renderer/Private/Nanite/`

Nanite 是 UE5 的虚拟几何体系统，在 5.8 中持续优化：

- 集群化 Mesh 处理
- 基于 Visibility Buffer 的渲染
- 软件光栅化 + 硬件光栅化组合
- 流式 LOD 管理

### Lumen

Lumen 是 UE5 的动态全局光照和反射系统：

- `LumenDiffuseIndirect.cpp` — 间接漫反射
- `LumenReflections.cpp` — 反射
- 支持 Software Ray Tracing 和 Hardware RT（DXR）
- UE5.8 中持续优化性能和内存占用

## 渲染架构关键特性总结

| 特性 | 文件/模块 | 说明 |
|------|----------|------|
| Render Graph | `RDG*` | Pass 自动依赖管理 |
| Nanite | `Renderer/Private/Nanite/` | 虚拟几何体 |
| Lumen | `Renderer/Private/Lumen*.cpp` | 动态全局光照 |
| Virtual Shadow Maps | `VSM*` | 虚拟阴影映射 |
| Hair | `HairRendering.cpp` | 毛发渲染 |
| Anisotropy | `AnisotropyRendering.cpp` | 各向异性材质 |
| Subsurface | `SubsurfaceScattering.cpp` | 次表面散射 |
| Debug Probes | `DebugProbeRendering.cpp` | 调试探针 |
