Steps
  # 1. install terraform
  brew tap hashicorp/tap && brew install hashicorp/tap/terraform

  # 2. register the missing provider (free, takes a minute or two)
  az provider register --namespace Microsoft.Web --wait

  # 3. create your variables file (git-ignored)
  cd trade-backend/deploy/azure-terraform
  cp terraform.tfvars.example
  #   edit it: subscription_id = "8252bdc3-004c-4f2c-a3c4-cfd03f3d6ec0"
  #            publisher_email = "<your email>"

  # 4. preview, then create
  terraform init
  terraform plan          # read-only; check it lists about 17 resources to add
  terraform apply         # type "yes"; API Management can take several minutes

  # 5. publish the code and load the data
  ./publish-function.sh
  cd trade-backend/deploy/azure-terraform
  COSMOS_ENDPOINT=$(terraform output -raw cosmos_endpoint) bun ../../scripts/seed-cosmos.ts

  # 6. test
  bash ../../scripts/smoke.sh "$(terraform output -raw api_base_url)"

  # 7. clean up when done
  terraform destroy