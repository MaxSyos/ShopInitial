export interface ShippingAddress {
  addressId?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface OrderConfirmation {
  shippingAddress: ShippingAddress;
}
