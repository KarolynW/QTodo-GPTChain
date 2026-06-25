FROM python:3.12-slim

# Because every production Dockerfile needs a comment explaining why
# we're not using alpine. We're not using alpine because opentimestamps
# builds native extensions and alpine's musl libc has opinions. Strong ones.
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .

# SQLite lives here. In production you'd mount a volume.
# In production you'd also use a real database. In production a lot of things
# would be different. But we are where we are.
RUN mkdir -p /data
ENV SQLITE_PATH=/data/todo.db

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
