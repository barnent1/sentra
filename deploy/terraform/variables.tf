# Hetzner Cloud Configuration
variable "hcloud_token" {
  description = "Hetzner Cloud API token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key"
  type        = string
  default     = "~/.ssh/id_rsa.pub"
}

# Server Configuration
variable "server_name" {
  description = "Name of the server"
  type        = string
  default     = "quetrex-prod"
}

variable "server_type" {
  description = "Hetzner server type (cx32 = 4 vCPU, 8GB RAM, 80GB SSD)"
  type        = string
  default     = "cx32"
}

variable "image" {
  description = "OS image"
  type        = string
  default     = "ubuntu-24.04"
}

variable "location" {
  description = "Server location (fsn1=Falkenstein, nbg1=Nuremberg, hel1=Helsinki)"
  type        = string
  default     = "fsn1"
}

# Application Configuration
variable "domain" {
  description = "Domain name for SSL (optional, leave empty for IP-only)"
  type        = string
  default     = ""
}

variable "github_repo" {
  description = "GitHub repository URL"
  type        = string
  default     = "https://github.com/barnent1/quetrex.git"
}

# Database Configuration
variable "database_url" {
  description = "PostgreSQL database URL"
  type        = string
  sensitive   = true
}

variable "supabase_url" {
  description = "Supabase API URL"
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anonymous key"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret"
  type        = string
  sensitive   = true
}

variable "jwt_refresh_secret" {
  description = "JWT refresh token secret"
  type        = string
  sensitive   = true
}
