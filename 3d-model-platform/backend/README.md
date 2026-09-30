# 后端

当前 V0.2，提供只读模型和部件元数据。使用 SQLAlchemy / SQLite，不提供 CRUD 或迁移框架。

在此目录安装和启动：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m app.run
```

app.run 默认从统一配置读取端口并开启开发重载；加 --no-reload 可关闭。端口占用明确报错。
也可从项目根目录使用 scripts/start-dev.ps1 -Service backend。

- GET /api/health：健康状态。
- GET /api/models：两个模型的摘要，含独立 version。
- GET /api/models/{id}：模型详情与部件。
- GET /api/models/{id}/parts：部件列表。
- 未知模型返回 404 和 MODEL_NOT_FOUND。
- 默认 API 文档：<http://127.0.0.1:8000/docs>。

app/config.py 集中读取根 .env、backend/.env 与 shell 环境。
DATABASE_PATH 相对项目根目录解析；DATABASE_URL 可覆盖；BACKEND_PORT 默认 8000，CORS 默认跟随根 FRONTEND_PORT。
配置模板位于根 .env.example 和 backend/.env.example。

启动创建 model_assets / model_parts，并读取 metadata/*.json。已存在的模型记录不覆盖。
旧版 SQLite 仅兼容补充 version 列，默认 1.0.0，保留已有数据。尚无通用迁移或多版本资产存储。

测试和依赖检查：

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m pip check
```

requirements.txt 包含锁定的直接与传递依赖，当前验证 Python 3.13.13。
