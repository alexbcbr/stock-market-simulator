# API Management in front of the Function App. The Consumption tier deploys in minutes.
# (Developer/Basic tiers can take 30-45 minutes to create.)

resource "azurerm_api_management" "main" {
  name                = "apim-${local.name}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  publisher_name      = var.publisher_name
  publisher_email     = var.publisher_email
  sku_name            = "Consumption_0"
}

# The routes, request and response shapes come straight from the shared contract.
resource "azurerm_api_management_api" "trade" {
  name                  = "trade-api"
  resource_group_name   = azurerm_resource_group.main.name
  api_management_name   = azurerm_api_management.main.name
  revision              = "1"
  display_name          = "Trade API"
  path                  = "trade"
  protocols             = ["https"]
  service_url           = "https://${azurerm_function_app_flex_consumption.api.default_hostname}"
  subscription_required = false # public demo API, like the API Gateway stage

  import {
    content_format = "openapi"
    content_value  = file("${path.module}/../../api-contract/openapi.yaml")
  }
}

# APIM answers CORS (the Hono app is started with cors: false so headers are not duplicated).
resource "azurerm_api_management_api_policy" "cors" {
  api_name            = azurerm_api_management_api.trade.name
  api_management_name = azurerm_api_management.main.name
  resource_group_name = azurerm_resource_group.main.name

  xml_content = <<-XML
    <policies>
      <inbound>
        <base />
        <cors allow-credentials="false">
          <allowed-origins><origin>*</origin></allowed-origins>
          <allowed-methods><method>*</method></allowed-methods>
          <allowed-headers><header>*</header></allowed-headers>
        </cors>
      </inbound>
      <backend><base /></backend>
      <outbound><base /></outbound>
      <on-error><base /></on-error>
    </policies>
  XML
}
