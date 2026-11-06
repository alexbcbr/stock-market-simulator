output "api_base_url" {
  description = "Base URL for the UI (VITE_URL_TRADE_SERVICES) and scripts/smoke.sh."
  value       = "${azurerm_api_management.main.gateway_url}/trade/"
}

output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "function_app_name" {
  value = azurerm_function_app_flex_consumption.api.name
}

output "cosmos_endpoint" {
  value = azurerm_cosmosdb_account.main.endpoint
}
