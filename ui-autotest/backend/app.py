"""AI UI自动化测试管理平台 - 后端服务"""
import os
import json
import uuid
import threading
import time
import random
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from models import init_db, get_db

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
CORS(app)


# ==================== 案例管理 ====================

@app.route('/api/cases', methods=['GET'])
def get_cases():
    db = get_db()
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)
    keyword = request.args.get('keyword', '')
    module = request.args.get('module', '')
    priority = request.args.get('priority', '')
    status = request.args.get('status', '')

    where_clauses = ["1=1"]
    params = []
    if keyword:
        where_clauses.append("(name LIKE ? OR description LIKE ?)")
        params.extend(['%' + keyword + '%', '%' + keyword + '%'])
    if module:
        where_clauses.append("module = ?")
        params.append(module)
    if priority:
        where_clauses.append("priority = ?")
        params.append(priority)
    if status:
        where_clauses.append("status = ?")
        params.append(status)

    where_sql = " AND ".join(where_clauses)
    count_row = db.execute("SELECT COUNT(*) as cnt FROM test_cases WHERE " + where_sql, params).fetchone()
    total = count_row['cnt']

    offset = (page - 1) * page_size
    rows = db.execute(
        "SELECT * FROM test_cases WHERE " + where_sql + " ORDER BY updated_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset]
    ).fetchall()

    return jsonify({
        'code': 0,
        'data': {
            'list': [dict(row) for row in rows],
            'total': total,
            'page': page,
            'pageSize': page_size
        }
    })


@app.route('/api/cases', methods=['POST'])
def create_case():
    db = get_db()
    data = request.json
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    case_id = str(uuid.uuid4())

    db.execute(
        "INSERT INTO test_cases (id, name, description, module, priority, status, steps, pre_condition, expected_result, tags, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [case_id, data.get('name'), data.get('description', ''),
         data.get('module', ''), data.get('priority', 'P2'),
         data.get('status', 'draft'),
         json.dumps(data.get('steps', []), ensure_ascii=False),
         data.get('pre_condition', ''),
         data.get('expected_result', ''),
         json.dumps(data.get('tags', []), ensure_ascii=False),
         now, now]
    )
    db.commit()

    row = db.execute("SELECT * FROM test_cases WHERE id = ?", [case_id]).fetchone()
    return jsonify({'code': 0, 'data': dict(row), 'message': '创建成功'})


@app.route('/api/cases/<case_id>', methods=['GET'])
def get_case(case_id):
    db = get_db()
    row = db.execute("SELECT * FROM test_cases WHERE id = ?", [case_id]).fetchone()
    if not row:
        return jsonify({'code': 404, 'message': '案例不存在'}), 404
    return jsonify({'code': 0, 'data': dict(row)})


@app.route('/api/cases/<case_id>', methods=['PUT'])
def update_case(case_id):
    db = get_db()
    data = request.json
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    fields = []
    params = []
    for key in ['name', 'description', 'module', 'priority', 'status', 'pre_condition', 'expected_result']:
        if key in data:
            fields.append(key + " = ?")
            params.append(data[key])
    if 'steps' in data:
        fields.append("steps = ?")
        params.append(json.dumps(data['steps'], ensure_ascii=False))
    if 'tags' in data:
        fields.append("tags = ?")
        params.append(json.dumps(data['tags'], ensure_ascii=False))
    fields.append("updated_at = ?")
    params.append(now)
    params.append(case_id)

    db.execute("UPDATE test_cases SET " + ", ".join(fields) + " WHERE id = ?", params)
    db.commit()

    row = db.execute("SELECT * FROM test_cases WHERE id = ?", [case_id]).fetchone()
    return jsonify({'code': 0, 'data': dict(row), 'message': '更新成功'})


@app.route('/api/cases/<case_id>', methods=['DELETE'])
def delete_case(case_id):
    db = get_db()
    db.execute("DELETE FROM test_cases WHERE id = ?", [case_id])
    db.commit()
    return jsonify({'code': 0, 'message': '删除成功'})


@app.route('/api/cases/batch-delete', methods=['POST'])
def batch_delete_cases():
    db = get_db()
    ids = request.json.get('ids', [])
    for cid in ids:
        db.execute("DELETE FROM test_cases WHERE id = ?", [cid])
    db.commit()
    return jsonify({'code': 0, 'message': '已删除' + str(len(ids)) + '条案例'})


# ==================== 流程管理 ====================

@app.route('/api/flows', methods=['GET'])
def get_flows():
    db = get_db()
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)
    keyword = request.args.get('keyword', '')

    where_sql = "1=1"
    params = []
    if keyword:
        where_sql += " AND (name LIKE ? OR description LIKE ?)"
        params.extend(['%' + keyword + '%', '%' + keyword + '%'])

    count_row = db.execute("SELECT COUNT(*) as cnt FROM test_flows WHERE " + where_sql, params).fetchone()
    total = count_row['cnt']

    offset = (page - 1) * page_size
    rows = db.execute(
        "SELECT * FROM test_flows WHERE " + where_sql + " ORDER BY updated_at DESC LIMIT ? OFFSET ?",
        params + [page_size, offset]
    ).fetchall()

    result = []
    for row in rows:
        flow = dict(row)
        steps = db.execute(
            "SELECT fs.*, tc.name as case_name, tc.module as case_module, tc.priority as case_priority FROM flow_steps fs LEFT JOIN test_cases tc ON fs.case_id = tc.id WHERE fs.flow_id = ? ORDER BY fs.sort_order",
            [flow['id']]
        ).fetchall()
        flow['steps'] = [dict(s) for s in steps]
        result.append(flow)

    return jsonify({
        'code': 0,
        'data': {
            'list': result,
            'total': total,
            'page': page,
            'pageSize': page_size
        }
    })


@app.route('/api/flows', methods=['POST'])
def create_flow():
    db = get_db()
    data = request.json
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    flow_id = str(uuid.uuid4())

    db.execute(
        "INSERT INTO test_flows (id, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [flow_id, data.get('name'), data.get('description', ''), data.get('status', 'draft'), now, now]
    )

    steps = data.get('steps', [])
    for idx, step in enumerate(steps):
        step_id = str(uuid.uuid4())
        db.execute(
            "INSERT INTO flow_steps (id, flow_id, case_id, sort_order, step_name, step_type, condition_expr, wait_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [step_id, flow_id, step.get('case_id', ''), idx,
             step.get('step_name', ''), step.get('step_type', 'case'),
             step.get('condition_expr', ''), step.get('wait_seconds', 0)]
        )

    db.commit()

    row = db.execute("SELECT * FROM test_flows WHERE id = ?", [flow_id]).fetchone()
    return jsonify({'code': 0, 'data': dict(row), 'message': '流程创建成功'})


@app.route('/api/flows/<flow_id>', methods=['GET'])
def get_flow(flow_id):
    db = get_db()
    row = db.execute("SELECT * FROM test_flows WHERE id = ?", [flow_id]).fetchone()
    if not row:
        return jsonify({'code': 404, 'message': '流程不存在'}), 404
    flow = dict(row)
    steps = db.execute(
        "SELECT fs.*, tc.name as case_name, tc.module as case_module, tc.priority as case_priority FROM flow_steps fs LEFT JOIN test_cases tc ON fs.case_id = tc.id WHERE fs.flow_id = ? ORDER BY fs.sort_order",
        [flow_id]
    ).fetchall()
    flow['steps'] = [dict(s) for s in steps]
    return jsonify({'code': 0, 'data': flow})


@app.route('/api/flows/<flow_id>', methods=['PUT'])
def update_flow(flow_id):
    db = get_db()
    data = request.json
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

    db.execute(
        "UPDATE test_flows SET name=?, description=?, status=?, updated_at=? WHERE id=?",
        [data.get('name'), data.get('description', ''), data.get('status', 'draft'), now, flow_id]
    )

    if 'steps' in data:
        db.execute("DELETE FROM flow_steps WHERE flow_id = ?", [flow_id])
        for idx, step in enumerate(data['steps']):
            step_id = str(uuid.uuid4())
            db.execute(
                "INSERT INTO flow_steps (id, flow_id, case_id, sort_order, step_name, step_type, condition_expr, wait_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                [step_id, flow_id, step.get('case_id', ''), idx,
                 step.get('step_name', ''), step.get('step_type', 'case'),
                 step.get('condition_expr', ''), step.get('wait_seconds', 0)]
            )

    db.commit()

    row = db.execute("SELECT * FROM test_flows WHERE id = ?", [flow_id]).fetchone()
    return jsonify({'code': 0, 'data': dict(row), 'message': '流程更新成功'})


@app.route('/api/flows/<flow_id>', methods=['DELETE'])
def delete_flow(flow_id):
    db = get_db()
    db.execute("DELETE FROM flow_steps WHERE flow_id = ?", [flow_id])
    db.execute("DELETE FROM test_flows WHERE id = ?", [flow_id])
    db.commit()
    return jsonify({'code': 0, 'message': '流程删除成功'})


# ==================== 执行管理 ====================

@app.route('/api/executions', methods=['GET'])
def get_executions():
    db = get_db()
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('pageSize', 20, type=int)

    count_row = db.execute("SELECT COUNT(*) as cnt FROM executions").fetchone()
    total = count_row['cnt']

    offset = (page - 1) * page_size
    rows = db.execute(
        "SELECT * FROM executions ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [page_size, offset]
    ).fetchall()

    result = []
    for row in rows:
        exec_data = dict(row)
        steps = db.execute(
            "SELECT * FROM execution_steps WHERE execution_id = ? ORDER BY started_at",
            [exec_data['id']]
        ).fetchall()
        exec_data['steps'] = [dict(s) for s in steps]
        result.append(exec_data)

    return jsonify({
        'code': 0,
        'data': {
            'list': result,
            'total': total,
            'page': page,
            'pageSize': page_size
        }
    })


@app.route('/api/executions', methods=['POST'])
def create_execution():
    db = get_db()
    data = request.json
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    exec_id = str(uuid.uuid4())

    exec_type = data.get('type', 'case')
    target_ids = data.get('target_ids', [])

    db.execute(
        "INSERT INTO executions (id, name, type, target_ids, status, created_at, started_at, finished_at, result, log) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [exec_id, data.get('name', ''), exec_type,
         json.dumps(target_ids, ensure_ascii=False),
         'pending', now, None, None, None, '']
    )
    db.commit()

    thread = threading.Thread(target=run_execution, args=(exec_id,))
    thread.daemon = True
    thread.start()

    return jsonify({'code': 0, 'data': {'id': exec_id}, 'message': '执行任务已创建'})


def run_execution(exec_id):
    db = get_db()
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    db.execute("UPDATE executions SET status='running', started_at=? WHERE id=?", [now, exec_id])
    db.commit()

    row = db.execute("SELECT * FROM executions WHERE id = ?", [exec_id]).fetchone()
    target_ids = json.loads(row['target_ids'])
    exec_type = row['type']

    step_results = []
    all_passed = True

    for idx, target_id in enumerate(target_ids):
        step_id = str(uuid.uuid4())
        step_start = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        if exec_type == 'case':
            case_row = db.execute("SELECT * FROM test_cases WHERE id = ?", [target_id]).fetchone()
            step_name = case_row['name'] if case_row else target_id
        else:
            flow_row = db.execute("SELECT * FROM test_flows WHERE id = ?", [target_id]).fetchone()
            step_name = flow_row['name'] if flow_row else target_id

        db.execute(
            "INSERT INTO execution_steps (id, execution_id, step_name, status, duration, error_msg, started_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [step_id, exec_id, step_name, 'running', 0, '', step_start]
        )
        db.commit()

        # 模拟执行
        duration = round(random.uniform(0.5, 3.0), 2)
        time.sleep(min(duration, 0.5))
        passed = random.random() > 0.15

        step_end = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        step_status = 'passed' if passed else 'failed'
        error_msg = '' if passed else '元素未找到或断言失败'

        db.execute(
            "UPDATE execution_steps SET status=?, duration=?, error_msg=?, finished_at=? WHERE id=?",
            [step_status, duration, error_msg, step_end, step_id]
        )
        db.commit()

        step_results.append({'name': step_name, 'status': step_status, 'duration': duration})
        if not passed:
            all_passed = False

    end_now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    final_status = 'passed' if all_passed else 'failed'
    result_json = json.dumps(step_results, ensure_ascii=False)

    db.execute(
        "UPDATE executions SET status=?, finished_at=?, result=? WHERE id=?",
        [final_status, end_now, result_json, exec_id]
    )
    db.commit()


@app.route('/api/executions/<exec_id>', methods=['GET'])
def get_execution(exec_id):
    db = get_db()
    row = db.execute("SELECT * FROM executions WHERE id = ?", [exec_id]).fetchone()
    if not row:
        return jsonify({'code': 404, 'message': '执行记录不存在'}), 404
    exec_data = dict(row)
    steps = db.execute(
        "SELECT * FROM execution_steps WHERE execution_id = ? ORDER BY started_at",
        [exec_id]
    ).fetchall()
    exec_data['steps'] = [dict(s) for s in steps]
    return jsonify({'code': 0, 'data': exec_data})


# ==================== AI辅助生成 ====================

@app.route('/api/ai/generate', methods=['POST'])
def ai_generate():
    db = get_db()
    data = request.json
    prompt = data.get('prompt', '')
    gen_type = data.get('type', 'case')
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    gen_id = str(uuid.uuid4())

    # 模拟AI生成结果
    if gen_type == 'case':
        result = generate_case_from_prompt(prompt)
    else:
        result = generate_flow_from_prompt(prompt)

    db.execute(
        "INSERT INTO ai_generations (id, prompt, result, model, created_at) VALUES (?, ?, ?, ?, ?)",
        [gen_id, prompt, json.dumps(result, ensure_ascii=False), 'AI-Simulator', now]
    )
    db.commit()

    return jsonify({'code': 0, 'data': result, 'message': 'AI生成完成'})


def generate_case_from_prompt(prompt):
    steps = [
        {"action": "navigate", "target": "首页", "value": ""},
        {"action": "click", "target": "登录按钮", "value": ""},
        {"action": "fill", "target": "用户名输入框", "value": "admin"},
        {"action": "fill", "target": "密码输入框", "value": "******"},
        {"action": "click", "target": "提交按钮", "value": ""},
        {"action": "assert", "target": "欢迎信息", "value": "登录成功"}
    ]
    return {
        "name": "AI生成: " + prompt[:30],
        "description": "基于描述自动生成: " + prompt,
        "module": "AI生成",
        "priority": "P2",
        "steps": steps,
        "pre_condition": "用户已注册",
        "expected_result": "操作成功完成，页面显示预期结果",
        "tags": ["AI生成"]
    }


def generate_flow_from_prompt(prompt):
    return {
        "name": "AI生成流程: " + prompt[:30],
        "description": "基于描述自动生成流程: " + prompt,
        "steps": [
            {"step_name": "打开页面", "step_type": "action", "case_id": "", "wait_seconds": 1},
            {"step_name": "执行登录", "step_type": "case", "case_id": "", "wait_seconds": 0},
            {"step_name": "验证结果", "step_type": "assert", "case_id": "", "wait_seconds": 0}
        ]
    }


# ==================== 统计接口 ====================

@app.route('/api/stats', methods=['GET'])
def get_stats():
    db = get_db()
    case_count = db.execute("SELECT COUNT(*) as cnt FROM test_cases").fetchone()['cnt']
    flow_count = db.execute("SELECT COUNT(*) as cnt FROM test_flows").fetchone()['cnt']
    exec_count = db.execute("SELECT COUNT(*) as cnt FROM executions").fetchone()['cnt']
    passed_count = db.execute("SELECT COUNT(*) as cnt FROM executions WHERE status='passed'").fetchone()['cnt']
    failed_count = db.execute("SELECT COUNT(*) as cnt FROM executions WHERE status='failed'").fetchone()['cnt']

    # 模块分布
    module_rows = db.execute("SELECT module, COUNT(*) as cnt FROM test_cases GROUP BY module").fetchall()
    module_dist = [dict(r) for r in module_rows]

    # 优先级分布
    priority_rows = db.execute("SELECT priority, COUNT(*) as cnt FROM test_cases GROUP BY priority").fetchall()
    priority_dist = [dict(r) for r in priority_rows]

    # 最近7天执行趋势
    recent_execs = db.execute(
        "SELECT date(created_at) as day, COUNT(*) as total, SUM(CASE WHEN status='passed' THEN 1 ELSE 0 END) as passed FROM executions GROUP BY date(created_at) ORDER BY day DESC LIMIT 7"
    ).fetchall()
    trend = [dict(r) for r in recent_execs]

    return jsonify({
        'code': 0,
        'data': {
            'caseCount': case_count,
            'flowCount': flow_count,
            'execCount': exec_count,
            'passedCount': passed_count,
            'failedCount': failed_count,
            'passRate': round(passed_count / max(exec_count, 1) * 100, 1),
            'moduleDist': module_dist,
            'priorityDist': priority_dist,
            'trend': trend
        }
    })


# ==================== 前端静态文件 ====================

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    dist_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')
    if path and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)
    return send_from_directory(dist_dir, 'index.html')


if __name__ == '__main__':
    init_db()
    print("=" * 50)
    print("AI UI自动化测试管理平台")
    print("访问地址: http://localhost:5321")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5321, debug=False)
