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
 * `null` when they were not given; the email format is not checked. `company` (where the customer works), `date_of_birth` (ISO `YYYY-MM-DD`) and
 * `state_residence` (2-letter US state code, upper case) are optional and `null` when not given. `crm_managed` is always false on creation and
 * no route changes it.
 */
export interface Customer {
  customer_name: string;
  fullname: string | null;
  email: string | null;
  company: string | null;
  date_of_birth: string | null;
  state_residence: string | null;
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
  company?: string;
  date_of_birth?: string;
  state_residence?: string;
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
 * Missing `fullname`, `email`, `company`, `date_of_birth` and `state_residence` become `null`, a missing `allowed_contact` becomes false, and `crm_managed` is
 * always false.
 *
 * @param request - Output of `validateCreateCustomerRequest`.
 */
export function newCustomer(request: CreateCustomerRequest): Customer {
  return {
    customer_name: request.customer_name,
    fullname: request.fullname ?? null,
    email: request.email ?? null,
    company: request.company ?? null,
    date_of_birth: request.date_of_birth ?? null,
    state_residence: request.state_residence ?? null,
    allowed_contact: request.allowed_contact ?? false,
    crm_managed: false,
  };
}
