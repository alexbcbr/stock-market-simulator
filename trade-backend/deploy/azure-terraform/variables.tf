variable "subscription_id" {
  description = "Azure subscription to deploy into (az account show --query id -o tsv)."
  type        = string
}

variable "location" {
  description = "Azure region."
  type        = string
  default     = "eastus2"
}

variable "prefix" {
  description = "Short name used to build resource names."
  type        = string
  default     = "trade"
}

variable "publisher_name" {
  description = "API Management publisher name."
  type        = string
  default     = "Trade Demo"
}

variable "publisher_email" {
  description = "API Management publisher email (required by Azure)."
  type        = string
}
