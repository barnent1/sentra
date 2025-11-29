terraform {
  required_providers {
    hcloud = {
      source  = "hetznercloud/hcloud"
      version = "~> 1.45"
    }
  }
  required_version = ">= 1.0"
}

provider "hcloud" {
  token = var.hcloud_token
}

# SSH Key
resource "hcloud_ssh_key" "quetrex" {
  name       = "quetrex-deploy"
  public_key = file(var.ssh_public_key_path)
}

# Firewall
resource "hcloud_firewall" "quetrex" {
  name = "quetrex-firewall"

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "22"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "80"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "tcp"
    port      = "443"
    source_ips = ["0.0.0.0/0", "::/0"]
  }

  rule {
    direction = "in"
    protocol  = "icmp"
    source_ips = ["0.0.0.0/0", "::/0"]
  }
}

# Server
resource "hcloud_server" "quetrex" {
  name        = var.server_name
  server_type = var.server_type
  image       = var.image
  location    = var.location
  ssh_keys    = [hcloud_ssh_key.quetrex.id]
  firewall_ids = [hcloud_firewall.quetrex.id]

  user_data = templatefile("${path.module}/cloud-init.yaml", {
    database_url              = var.database_url
    supabase_url              = var.supabase_url
    supabase_anon_key         = var.supabase_anon_key
    supabase_service_role_key = var.supabase_service_role_key
    jwt_secret                = var.jwt_secret
    jwt_refresh_secret        = var.jwt_refresh_secret
    domain                    = var.domain
    github_repo               = var.github_repo
  })

  labels = {
    environment = "production"
    app         = "quetrex"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Outputs
output "server_ip" {
  description = "Public IP of the Quetrex server"
  value       = hcloud_server.quetrex.ipv4_address
}

output "server_status" {
  description = "Server status"
  value       = hcloud_server.quetrex.status
}

output "ssh_command" {
  description = "SSH command to connect"
  value       = "ssh root@${hcloud_server.quetrex.ipv4_address}"
}

output "app_url" {
  description = "Application URL"
  value       = var.domain != "" ? "https://${var.domain}" : "http://${hcloud_server.quetrex.ipv4_address}"
}

output "dns_setup" {
  description = "DNS A record setup (if using domain)"
  value       = var.domain != "" ? "Add A record: ${var.domain} -> ${hcloud_server.quetrex.ipv4_address}" : "No domain configured"
}
