#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

// 递归查找所有Vue文件
function findVueFiles(dir, fileList = []) {
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和.git目录
        if (file !== 'node_modules' && file !== '.git' && file !== '.idea' && file !== 'dist') {
          findVueFiles(filePath, fileList);
        }
      } else if (file.endsWith('.vue')) {
        fileList.push(filePath);
      }
    });
  } catch (err) {
    // 忽略无法访问的目录
  }
  
  return fileList;
}

// 移除注释内容
function removeComments(content) {
  // 移除HTML注释
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  // 移除单行注释
  content = content.replace(/\/\/.*$/gm, '');
  // 移除多行注释
  content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  return content;
}

// 解析Vue文件的template部分
function extractTemplate(content) {
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  if (templateMatch) {
    return templateMatch[1];
  }
  return '';
}

// 检查表格组件的问题
function checkTableIssues(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const template = extractTemplate(content);
  
  if (!template) {
    return [];
  }
  
  // 移除注释后的模板内容
  const cleanTemplate = removeComments(template);
  const lines = content.split('\n');
  const issues = [];
  
  // 检查el-table-column相关问题
  const tableColumnRegex = /<el-table-column[^>]*>/g;
  const matches = [...cleanTemplate.matchAll(tableColumnRegex)];
  
  matches.forEach(match => {
    const tag = match[0];
    const position = content.indexOf(tag);
    const lineNum = content.substring(0, position).split('\n').length;
    
    // 检查是否是自闭合标签
    if (!tag.endsWith('/>')) {
      // 查找对应的闭合标签
      const afterTag = cleanTemplate.substring(cleanTemplate.indexOf(tag) + tag.length);
      const nextColumnIndex = afterTag.search(/<el-table-column/);
      const closeTagIndex = afterTag.indexOf('</el-table-column>');
      
      // 检查是否有自定义内容
      const contentBetween = afterTag.substring(0, closeTagIndex > -1 ? closeTagIndex : nextColumnIndex);
      
      if (contentBetween.trim()) {
        // 有自定义内容，检查是否有template包装
        if (!contentBetween.includes('<template')) {
          // 检查是否使用了scope
          if (contentBetween.includes('scope.row') || contentBetween.includes('scope.$index')) {
            issues.push({
              line: lineNum,
              type: 'error',
              message: '使用了scope但缺少<template #default="scope">包装',
              suggestion: '将自定义内容包装在<template #default="scope">...</template>中'
            });
          } else if (/<[^>]+>/.test(contentBetween)) {
            // 包含其他标签元素
            issues.push({
              line: lineNum,
              type: 'warning',
              message: '包含自定义内容但可能缺少template包装',
              suggestion: '考虑使用<template #default="scope">包装自定义内容'
            });
          }
        }
      }
      
      if (closeTagIndex === -1 || (nextColumnIndex > -1 && nextColumnIndex < closeTagIndex)) {
        issues.push({
          line: lineNum,
          type: 'error',
          message: '缺少闭合标签</el-table-column>',
          suggestion: '在适当位置添加</el-table-column>'
        });
      }
    }
  });
  
  // 检查其他常见问题
  
  // 1. 检查错误的插槽语法（Vue 2 vs Vue 3）
  if (cleanTemplate.includes('slot-scope=')) {
    const lineNum = content.split('slot-scope=')[0].split('\n').length;
    issues.push({
      line: lineNum,
      type: 'warning',
      message: '使用了Vue 2的slot-scope语法',
      suggestion: '在Vue 3中应该使用 #default="scope" 或 v-slot:default="scope"'
    });
  }
  
  // 2. 检查常见组件是否正确包装
  const componentsNeedScope = ['dict-tag', 'el-tag', 'el-button', 'el-switch', 'el-link', 'el-input'];
  componentsNeedScope.forEach(comp => {
    const compRegex = new RegExp(`<${comp}[^>]*>`, 'g');
    const compMatches = [...cleanTemplate.matchAll(compRegex)];
    
    compMatches.forEach(match => {
      const beforeComp = cleanTemplate.substring(0, cleanTemplate.indexOf(match[0]));
      const lastColumnTag = beforeComp.lastIndexOf('<el-table-column');
      const lastTemplate = beforeComp.lastIndexOf('<template');
      
      if (lastColumnTag > -1 && lastColumnTag > lastTemplate) {
        const position = content.indexOf(match[0]);
        const lineNum = content.substring(0, position).split('\n').length;
        
        // 检查是否使用了scope相关的属性
        if (match[0].includes('scope.row') || match[0].includes('row.')) {
          issues.push({
            line: lineNum,
            type: 'error',
            message: `组件<${comp}>在el-table-column中使用了scope但可能缺少template包装`,
            suggestion: '确保使用<template #default="scope">包装'
          });
        }
      }
    });
  });
  
  return issues;
}

// 生成修复建议
function generateFixSuggestion(issue) {
  const suggestions = {
    'error': `${colors.red}[错误]${colors.reset}`,
    'warning': `${colors.yellow}[警告]${colors.reset}`
  };
  
  return `${suggestions[issue.type]} Line ${issue.line}: ${issue.message}
         ${colors.cyan}修复建议: ${issue.suggestion}${colors.reset}`;
}

// 主函数
function main() {
  console.log(`${colors.blue}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║     Element Plus 表格组件问题检查工具 v2.0              ║${colors.reset}`);
  console.log(`${colors.blue}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  const workspaceDir = process.argv[2] || '/workspace';
  console.log(`${colors.cyan}检查目录: ${workspaceDir}${colors.reset}\n`);
  
  const vueFiles = findVueFiles(workspaceDir);
  
  if (vueFiles.length === 0) {
    console.log(`${colors.yellow}⚠ 未找到Vue文件${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}找到 ${vueFiles.length} 个Vue文件${colors.reset}\n`);
  console.log('开始检查...\n');
  
  let totalIssues = 0;
  let errorCount = 0;
  let warningCount = 0;
  const filesWithIssues = [];
  
  vueFiles.forEach(file => {
    const relativePath = path.relative(workspaceDir, file);
    const issues = checkTableIssues(file);
    
    if (issues.length > 0) {
      totalIssues += issues.length;
      errorCount += issues.filter(i => i.type === 'error').length;
      warningCount += issues.filter(i => i.type === 'warning').length;
      filesWithIssues.push({ file: relativePath, issues });
      
      console.log(`${colors.red}✗${colors.reset} ${relativePath}`);
      issues.forEach(issue => {
        console.log('  ' + generateFixSuggestion(issue));
      });
      console.log('');
    } else {
      console.log(`${colors.green}✓${colors.reset} ${relativePath}`);
    }
  });
  
  // 总结报告
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.blue}检查报告${colors.reset}`);
  console.log('═'.repeat(60));
  
  if (totalIssues === 0) {
    console.log(`${colors.green}✨ 太棒了！未发现任何表格组件相关问题！${colors.reset}`);
  } else {
    console.log(`${colors.yellow}📊 统计信息:${colors.reset}`);
    console.log(`   • 检查文件数: ${vueFiles.length}`);
    console.log(`   • 问题文件数: ${filesWithIssues.length}`);
    console.log(`   • 错误数量: ${colors.red}${errorCount}${colors.reset}`);
    console.log(`   • 警告数量: ${colors.yellow}${warningCount}${colors.reset}`);
    console.log(`   • 问题总数: ${totalIssues}\n`);
    
    console.log(`${colors.cyan}💡 快速修复指南:${colors.reset}`);
    console.log('1. 所有el-table-column中的自定义内容都需要<template>包装');
    console.log('2. 正确格式: <template #default="scope">...内容...</template>');
    console.log('3. 确保每个<el-table-column>都有对应的</el-table-column>');
    console.log('4. 简单展示数据可以直接使用prop属性，无需template');
    
    if (filesWithIssues.length > 0) {
      console.log(`\n${colors.yellow}📝 需要修复的文件:${colors.reset}`);
      filesWithIssues.forEach(item => {
        console.log(`   • ${item.file} (${item.issues.length}个问题)`);
      });
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`${colors.green}检查完成！${colors.reset}`);
}

// 运行主函数
main();