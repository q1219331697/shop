import { writeFileSync } from 'fs'

import { Reporter, TestCase, TestResult } from '@playwright/test'

// 运行结束后将每个用例的执行结果回写到独立的报告文件
// 文件名为 cases-report-YYYYMMDDHHMMSS.csv，不污染源表
export default class CsvReporter implements Reporter {
  private rows: string[] = ['用例ID,标题,模块,实际结果,失败原因,执行日期']

  onTestEnd(test: TestCase, result: TestResult): void {
    const id = test.tags.find(t => t.startsWith('@'))?.slice(1) ?? ''
    const ok = result.status === 'passed' ? '通过' : '失败'
    const raw = ok === '失败' ? (result.errors[0]?.message ?? '') : '-'
    // Playwright 的报错信息带 ANSI 颜色转义序列，报告里需先剥离，故此处有意匹配控制字符 \u001b
    // eslint-disable-next-line no-control-regex
    const reason = raw.replace(/\u001b\[[0-9;]*m/g, '').replace(/\r?\n/g, ' ').slice(0, 200)
    this.rows.push(`${id},${test.title},-,${ok},"${reason}",${new Date().toISOString().slice(0, 10)}`)
  }

  onEnd(): void {
    const ts = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '') // YYYYMMDDHHMMSS
    // 写 UTF-8 BOM，保证 Excel 直接打开中文不乱码（与源表 cases.csv/steps.csv 保持一致）
    writeFileSync(`test-results/cases-report-${ts}.csv`, '\uFEFF' + this.rows.join('\n'), 'utf8')
  }
}
