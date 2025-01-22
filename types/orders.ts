export interface Product {
  name: string
  price: number
  quantity: number
  total: number
}

export interface Order {
  id: string
  name: string
  address: string
  date: string
  total: number
  products: Product[]
}

