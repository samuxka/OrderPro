export interface Product {
  name: string
  price: number
  quantity: number
  total: number
}

export interface Order extends CustomerInfo {
  id: string
  name: string
  date: string
  total: number
  products: Product[]
}

export interface NewOrderDialogProps{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (order: Order) => void
  lastOrderId: String
  editOrder?: Order
}

export interface CustomerInfo{
  personType: "fisica" | "juridica"
  cpf: string
  cnpj: string
  companyName: string
  businessName: string
  zipCode: string
  address: string
  complement: string
  number: string
  state: string
  city: string
  neighborhood: string
  referencePoint: string
  telephone: string
  email: string
  dateOfBirth: string
  id: string
  gender: string
  name: string
}