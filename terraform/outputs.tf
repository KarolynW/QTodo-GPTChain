output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer. Point your domain here."
  value       = aws_lb.main.dns_name
}

output "alb_url" {
  description = "HTTP URL of the application. Add HTTPS once you've set up a certificate."
  value       = "http://${aws_lb.main.dns_name}"
}

output "mcp_server_url" {
  description = "MCP server SSE endpoint. Add this to your Claude Desktop or agent config."
  value       = "http://${aws_lb.main.dns_name}/mcp/sse"
}

output "efs_id" {
  description = "EFS filesystem ID (for SQLite persistence). Back this up if you care about your data."
  value       = aws_efs_file_system.sqlite.id
}

output "ecs_cluster_name" {
  description = "ECS cluster name (for aws ecs commands)"
  value       = aws_ecs_cluster.main.name
}

output "evm_secret_arn" {
  description = "Secrets Manager ARN for the EVM private key. Update this with your real key after apply."
  value       = aws_secretsmanager_secret.evm_key.arn
}

output "setup_commands" {
  description = "Post-deploy steps — run these after terraform apply"
  value = <<-EOT
    # 1. Update the EVM private key in Secrets Manager (if you're using blockchain features):
    aws secretsmanager put-secret-value \
      --secret-id "${aws_secretsmanager_secret.evm_key.id}" \
      --secret-string "0xYOUR_PRIVATE_KEY"

    # 2. Add to Claude Desktop config (~/.claude/claude_desktop_config.json):
    # {
    #   "mcpServers": {
    #     "qtodo": {
    #       "url": "http://${aws_lb.main.dns_name}/mcp/sse"
    #     }
    #   }
    # }

    # 3. Or for local stdio mode (no server needed):
    # {
    #   "mcpServers": {
    #     "qtodo-local": {
    #       "command": "python",
    #       "args": ["${path.root}/../mcp-server/server.py"],
    #       "env": { "QTODO_BACKEND_URL": "http://localhost:8000" }
    #     }
    #   }
    # }

    # 4. Open the app:
    echo "App URL: http://${aws_lb.main.dns_name}"
  EOT
}
