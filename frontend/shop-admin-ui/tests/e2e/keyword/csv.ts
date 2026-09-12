import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// 用例步骤：一行 = 一个操作步骤
export interface Step {
  用例ID: string
  序号: string
  操作: string
  定位方式: string
  定位值: string
  输入值: string
  预期: string
  预期类型: string
  说明: string
}

// 用例：一个用例包含多行步骤
export interface Case {
  用例ID: string
  模块: string
  标题: string
  是否启用: string
  备注: string
  步骤: Step[]
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '../data')

// 读取 cases.csv 与 steps.csv，按用例ID 组装成用例结构
export function loadCases(): Case[] {
  const casesRaw = parse(readFileSync(resolve(DATA_DIR, 'cases.csv'), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[]

  const stepsRaw = parse(readFileSync(resolve(DATA_DIR, 'steps.csv'), 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  }) as Record<string, string>[]

  return casesRaw.map(c => ({
    用例ID: c.用例ID,
    模块: c.模块,
    标题: c.标题,
    是否启用: c.是否启用,
    备注: c.备注 ?? '',
    步骤: stepsRaw
      .filter(s => s.用例ID === c.用例ID)
      .sort((a, b) => Number(a.序号) - Number(b.序号))
      .map(s => ({
        用例ID: s.用例ID,
        序号: s.序号,
        操作: s.操作,
        定位方式: s.定位方式,
        定位值: s.定位值,
        输入值: s.输入值,
        预期: s.预期,
        预期类型: s.预期类型,
        说明: s.说明 ?? '',
      })),
  }))
}
