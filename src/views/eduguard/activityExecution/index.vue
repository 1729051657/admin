<template>
  <div class="app-container">
    <el-table :data="tableData" style="width: 100%">
      <!-- 错误的写法 - 缺少template标签和闭合标签 -->
      <!-- 
      <el-table-column label="执行状态" align="center" prop="executionStatus">
        <dict-tag :options="execution_status" :value="scope.row.executionStatus"/>
      <el-table-column label="开始时间" align="center" prop="startTime" width="180">
        <span>{{ parseTime(scope.row.startTime, '{y}-{m}-{d}') }}</span>
      <el-table-column label="结束时间" align="center" prop="endTime" width="180">
        <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
      -->

      <!-- 正确的写法 - 使用template标签和作用域插槽 -->
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

      <!-- 其他常见的表格列写法示例 -->
      
      <!-- 简单的文本列，不需要自定义内容 -->
      <el-table-column label="活动名称" align="center" prop="activityName" />
      
      <!-- 带操作按钮的列 -->
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button
            link
            type="primary"
            @click="handleEdit(scope.row)"
          >编辑</el-button>
          <el-button
            link
            type="danger"
            @click="handleDelete(scope.row)"
          >删除</el-button>
        </template>
      </el-table-column>

      <!-- 带条件渲染的列 -->
      <el-table-column label="状态" align="center">
        <template #default="scope">
          <el-tag v-if="scope.row.status === 1" type="success">启用</el-tag>
          <el-tag v-else type="danger">禁用</el-tag>
        </template>
      </el-table-column>

      <!-- 带格式化的列 -->
      <el-table-column label="创建时间" align="center" prop="createTime">
        <template #default="scope">
          {{ formatDate(scope.row.createTime) }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 示例数据
const tableData = ref([
  {
    executionStatus: 1,
    startTime: '2024-01-01',
    endTime: '2024-01-31',
    activityName: '活动1',
    status: 1,
    createTime: new Date()
  }
])

// 执行状态选项
const execution_status = ref([
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 }
])

// 工具函数
const parseTime = (time, format) => {
  // 时间格式化函数实现
  return time
}

const formatDate = (date) => {
  // 日期格式化函数实现
  return date
}

const handleEdit = (row) => {
  console.log('编辑', row)
}

const handleDelete = (row) => {
  console.log('删除', row)
}
</script>