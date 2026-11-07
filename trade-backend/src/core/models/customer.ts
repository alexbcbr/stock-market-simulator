/**
 * Customer models shared by every target.
 *
 * @packageDocumentation
 */

/**
 * A stored customer.
 *
 * @remarks
 * `customer_name` is the key and holds the same text as `Trade.customer_name`, but nothing enforces the link: a
 * trade can exist for a name that has no customer, and a customer can have no trades. `fullname` and `email` are
 * `null` when they were not given; the email format is not checked. `crm_managed` is always false on creation and
 * no route changes it.
 */
export interface Customer {
  customer_name: string;
  fullname: string | null;
  email: string | null;
  allowed_contact: boolean;
  crm_managed: boolean;
}

/**
 * Body of a create-customer request, after validation.
 *
 * @remarks
 * Only `customer_name` is required. A `crm_managed` sent by the caller is not part of the request and is ignored.
 */
export interface CreateCustomerRequest {
  customer_name: string;
  fullname?: string;
  email?: string;
  allowed_contact?: boolean;
}

/** Thrown by `CustomerRepository.create` when `customer_name` is already stored. */
export class CustomerAlreadyExistsError extends Error {
  constructor(customerName: string) {
    super(`Customer "${customerName}" already exists`);
    this.name = 'CustomerAlreadyExistsError';
  }
}

/**
 * Builds the customer to store from a validated request.
 *
 * @remarks
 * Missing `fullname` and `email` become `null`, a missing `allowed_contact` becomes false, and `crm_managed` is
 * always false.
 *
 * @param request - Output of `validateCreateCustomerRequest`.
 */
export function newCustomer(request: CreateCustomerRequest): Customer {
  return {
    customer_name: request.customer_name,
    fullname: request.fullname ?? null,
    email: request.email ?? null,
    allowed_contact: request.allowed_contact ?? false,
    crm_managed: false,
  };
}
