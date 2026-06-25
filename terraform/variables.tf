variable "aws_region" {
  description = "AWS region to deploy to. Pick somewhere close to you to reduce latency on your todo list. The todo list does not care."
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name used to name all resources. Change this and everything breaks. Don't change it."
  type        = string
  default     = "qtodo-gptchain"
}

variable "environment" {
  description = "Environment name. Use 'prod' when you're feeling brave. Use 'staging' when you're not."
  type        = string
  default     = "prod"
}

variable "backend_image" {
  description = "Docker image URI for the FastAPI backend (ECR or Docker Hub)"
  type        = string
}

variable "frontend_image" {
  description = "Docker image URI for the React frontend (nginx)"
  type        = string
}

variable "mcp_server_image" {
  description = "Docker image URI for the MCP server"
  type        = string
}

variable "evm_rpc_url" {
  description = "EVM RPC URL for the default blockchain account (optional; users can override in the UI)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "evm_private_key" {
  description = "EVM private key for the default blockchain account (stored in AWS Secrets Manager, not here)"
  type        = string
  default     = ""
  sensitive   = true
}

variable "evm_contract_address" {
  description = "Deployed Anchor.sol contract address"
  type        = string
  default     = ""
}

variable "evm_chain" {
  description = "EVM chain name (for logging and explorer links)"
  type        = string
  default     = "base-sepolia"
}

variable "evm_explorer" {
  description = "Block explorer URL prefix"
  type        = string
  default     = "https://sepolia.basescan.org"
}

variable "evm_mode" {
  description = "Anchor mode: 'lite' (events only) or 'full' (on-chain storage)"
  type        = string
  default     = "lite"
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS on the ALB. Leave empty for HTTP only (not recommended for production, but we respect your choices)."
  type        = string
  default     = ""
}

variable "domain_name" {
  description = "Domain name for the app (used in ALB listener rules). Optional."
  type        = string
  default     = ""
}
