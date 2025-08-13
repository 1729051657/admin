# Element Plus 表格组件 End Tag 错误修复指南

## 问题描述
在使用 Element Plus 的 `<el-table-column>` 组件时，如果需要自定义列内容，必须使用 `<template>` 标签和作用域插槽，否则会出现 "Element is missing end tag" 编译错误。

## 错误示例 ❌

```vue
<el-table-column label="执行状态" align="center" prop="executionStatus">
    <dict-tag :options="execution_status" :value="scope.row.executionStatus"/>
<el-table-column label="开始时间" align="center" prop="startTime" width="180">
    <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
<el-table-column label="结束时间" align="center" prop="endTime" width="180">
    <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
```

**问题分析：**
1. 缺少 `</el-table-column>` 闭合标签
2. 没有使用 `<template>` 标签包裹自定义内容
3. 没有定义作用域插槽 `scope`

## 正确示例 ✅

```vue
<el-table-column label="执行状态" align="center" prop="executionStatus">
  <template #default="scope">
    <dict-tag :options="execution_status" :value="scope.row.executionStatus"/>
  </template>
</el-table-column>

<el-table-column label="开始时间" align="center" prop="startTime" width="180">
  <template #default="scope">
    <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
  </template>
</el-table-column>

<el-table-column label="结束时间" align="center" prop="endTime" width="180">
  <template #default="scope">
    <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
  </template>
</el-table-column>
```

## 修复步骤

### 1. 基本修复模式
对于每个需要自定义内容的 `<el-table-column>`：

```vue
<!-- 修复前 -->
<el-table-column label="列名" prop="propName">
  自定义内容

<!-- 修复后 -->
<el-table-column label="列名" prop="propName">
  <template #default="scope">
    自定义内容
  </template>
</el-table-column>
```

### 2. 常见场景修复示例

#### 场景1：显示格式化数据
```vue
<!-- 修复前 -->
<el-table-column label="时间" prop="time">
  {{ formatTime(scope.row.time) }}

<!-- 修复后 -->
<el-table-column label="时间" prop="time">
  <template #default="scope">
    {{ formatTime(scope.row.time) }}
  </template>
</el-table-column>
```

#### 场景2：使用自定义组件
```vue
<!-- 修复前 -->
<el-table-column label="状态" prop="status">
  <dict-tag :value="scope.row.status" />

<!-- 修复后 -->
<el-table-column label="状态" prop="status">
  <template #default="scope">
    <dict-tag :value="scope.row.status" />
  </template>
</el-table-column>
```

#### 场景3：操作按钮列
```vue
<!-- 修复前 -->
<el-table-column label="操作">
  <el-button @click="handleEdit(scope.row)">编辑</el-button>
  <el-button @click="handleDelete(scope.row)">删除</el-button>

<!-- 修复后 -->
<el-table-column label="操作">
  <template #default="scope">
    <el-button @click="handleEdit(scope.row)">编辑</el-button>
    <el-button @click="handleDelete(scope.row)">删除</el-button>
  </template>
</el-table-column>
```

#### 场景4：条件渲染
```vue
<!-- 修复前 -->
<el-table-column label="状态">
  <el-tag v-if="scope.row.active" type="success">激活</el-tag>
  <el-tag v-else type="info">未激活</el-tag>

<!-- 修复后 -->
<el-table-column label="状态">
  <template #default="scope">
    <el-tag v-if="scope.row.active" type="success">激活</el-tag>
    <el-tag v-else type="info">未激活</el-tag>
  </template>
</el-table-column>
```

## 特殊情况

### 1. 不需要 template 的情况
如果只是显示简单的属性值，不需要自定义内容，可以直接使用 `prop` 属性：

```vue
<!-- 简单显示，不需要template -->
<el-table-column label="名称" align="center" prop="name" />
```

### 2. 表头自定义
如果需要自定义表头，使用 `#header` 插槽：

```vue
<el-table-column align="center" prop="name">
  <template #header>
    <span>自定义表头</span>
  </template>
  <template #default="scope">
    {{ scope.row.name }}
  </template>
</el-table-column>
```

### 3. Vue 2 vs Vue 3 语法差异

**Vue 2 + Element UI:**
```vue
<el-table-column label="名称">
  <template slot-scope="scope">
    {{ scope.row.name }}
  </template>
</el-table-column>
```

**Vue 3 + Element Plus:**
```vue
<el-table-column label="名称">
  <template #default="scope">
    {{ scope.row.name }}
  </template>
</el-table-column>
```

## 批量修复建议

如果有大量类似错误需要修复，可以使用以下正则表达式进行查找替换：

### 查找模式：
```regex
<el-table-column([^>]*)>\s*([^<]+(?:<(?!\/el-table-column)[^>]*>[^<]*<\/[^>]+>)?[^<]*)(?=<el-table-column|$)
```

### 替换模式：
```
<el-table-column$1>
  <template #default="scope">
    $2
  </template>
</el-table-column>
```

**注意：** 使用正则替换前请先备份代码，并逐个检查替换结果。

## 参考资源
- [Element Plus Table 组件文档](https://element-plus.org/zh-CN/component/table.html)
- [Vue 3 插槽文档](https://cn.vuejs.org/guide/components/slots.html)