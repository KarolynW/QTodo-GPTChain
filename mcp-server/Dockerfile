FROM python:3.12-slim

# The MCP server. It speaks Model Context Protocol over stdio or SSE.
# Most users will run it via Claude Desktop config (stdio).
# Container deployments will want SSE: pass --transport sse.
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

ENV QTODO_BACKEND_URL=http://backend:8000

# Default to SSE for containerised deployments
CMD ["python", "server.py", "--transport", "sse"]
