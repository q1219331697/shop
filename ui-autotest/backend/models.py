"""
数据库模型与初始化
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data', 'autotest.db')


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_cases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            module TEXT DEFAULT '',
            priority TEXT DEFAULT 'P2',
            status TEXT DEFAULT 'draft',
            steps TEXT DEFAULT '[]',
            pre_condition TEXT DEFAULT '',
            expected_result TEXT DEFAULT '',
            tags TEXT DEFAULT '[]',
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS test_flows (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT DEFAULT '',
            status TEXT DEFAULT 'draft',
            created_at TEXT,
            updated_at TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flow_steps (
            id TEXT PRIMARY KEY,
            flow_id TEXT NOT NULL,
            case_id TEXT DEFAULT '',
            sort_order INTEGER DEFAULT 0,
            step_name TEXT DEFAULT '',
            step_type TEXT DEFAULT 'case',
            condition_expr TEXT DEFAULT '',
            wait_seconds INTEGER DEFAULT 0,
            FOREIGN KEY (flow_id) REFERENCES test_flows(id),
            FOREIGN KEY (case_id) REFERENCES test_cases(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS executions (
            id TEXT PRIMARY KEY,
            name TEXT DEFAULT '',
            type TEXT DEFAULT 'case',
            target_ids TEXT DEFAULT '[]',
            status TEXT DEFAULT 'pending',
            created_at TEXT,
            started_at TEXT,
            finished_at TEXT,
            result TEXT DEFAULT '',
            log TEXT DEFAULT ''
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS execution_steps (
            id TEXT PRIMARY KEY,
            execution_id TEXT NOT NULL,
            step_name TEXT DEFAULT '',
            status TEXT DEFAULT 'pending',
            duration REAL DEFAULT 0,
            error_msg TEXT DEFAULT '',
            screenshot TEXT DEFAULT '',
            started_at TEXT,
            finished_at TEXT,
            FOREIGN KEY (execution_id) REFERENCES executions(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_generations (
            id TEXT PRIMARY KEY,
            prompt TEXT NOT NULL,
            result TEXT DEFAULT '',
            case_id TEXT DEFAULT '',
            model TEXT DEFAULT '',
            created_at TEXT
        )
    ''')

    conn.commit()
    conn.close()
    print(f"数据库初始化完成: {DB_PATH}")


if __name__ == '__main__':
    init_db()
