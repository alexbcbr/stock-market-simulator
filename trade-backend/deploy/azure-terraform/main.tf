# Azure counterpart of the AWS stacks:
#   DynamoDB          -> Cosmos DB (serverless, NoSQL API)
#   Lambda            -> Azure Functions (one HTTP trigger running the Hono app)
#   API Gateway       -> API Management (imports api-contract/openapi.yaml)
#   IAM role          -> managed identity + Cosmos DB data-plane role (no keys in app settings)

data "azurerm_client_config" "current" {}

resource "random_string" "suffix" {
  length  = 5
  upper   = false
  special = false
}

locals {
  name = "${var.prefix}-${random_string.suffix.result}"
  # Built-in role "Cosmos DB Built-in Data Contributor"
  cosmos_data_contributor = "${azurerm_cosmosdb_account.main.id}/sqlRoleDefinitions/00000000-0000-0000-0000-000000000002"
}

resource "azurerm_resource_group" "main" {
  name     = "rg-${local.name}"
  location = var.location
}

# ---------- Cosmos DB ----------

resource "azurerm_cosmosdb_account" "main" {
  name                         = "cosmos-${local.name}"
  location                     = azurerm_resource_group.main.location
  resource_group_name          = azurerm_resource_group.main.name
  offer_type                   = "Standard"
  kind                         = "GlobalDocumentDB"
  local_authentication_enabled = false # Entra ID only, no account keys

  capabilities {
    name = "EnableServerless"
  }

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }
}

resource "azurerm_cosmosdb_sql_database" "trade" {
  name                = "trade"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

resource "azurerm_cosmosdb_sql_container" "market_price" {
  name                = "market_price"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.trade.name
  partition_key_paths = ["/symbol"]
}

resource "azurerm_cosmosdb_sql_container" "market_symbol" {
  name                = "market_symbol"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.trade.name
  partition_key_paths = ["/symbol"]
}

# Partitioned by trade_id so create and sell are point operations (see src/adapters/cosmos).
resource "azurerm_cosmosdb_sql_container" "trade" {
  name                = "trade"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_sql_database.trade.name
  partition_key_paths = ["/trade_id"]
}

# ---------- Function App ----------

resource "azurerm_storage_account" "func" {
  name                     = "st${replace(local.name, "-", "")}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "func" {
  name                = "plan-${local.name}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "Y1" # Consumption
}

resource "azurerm_linux_function_app" "api" {
  name                       = "func-${local.name}"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  service_plan_id            = azurerm_service_plan.func.id
  storage_account_name       = azurerm_storage_account.func.name
  storage_account_access_key = azurerm_storage_account.func.primary_access_key
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      node_version = "20"
    }
  }

  app_settings = {
    COSMOS_ENDPOINT = azurerm_cosmosdb_account.main.endpoint
    COSMOS_DATABASE = azurerm_cosmosdb_sql_database.trade.name
  }
}

# ---------- Cosmos DB data-plane access ----------

resource "random_uuid" "function_role" {}
resource "random_uuid" "deployer_role" {}

resource "azurerm_cosmosdb_sql_role_assignment" "function" {
  name                = random_uuid.function_role.result
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = local.cosmos_data_contributor
  principal_id        = azurerm_linux_function_app.api.identity[0].principal_id
  scope               = azurerm_cosmosdb_account.main.id
}

# Lets the person running terraform seed data with scripts/seed-cosmos.ts.
resource "azurerm_cosmosdb_sql_role_assignment" "deployer" {
  name                = random_uuid.deployer_role.result
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
  role_definition_id  = local.cosmos_data_contributor
  principal_id        = data.azurerm_client_config.current.object_id
  scope               = azurerm_cosmosdb_account.main.id
}
