"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Order, Product } from "../types/orders"
import jsPDF from "jspdf";

interface NewOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (order: Order) => void
  lastOrderId: string
  editOrder?: Order
}

export function NewOrderDialog({ open, onOpenChange, onSave, lastOrderId, editOrder }: NewOrderDialogProps) {
  const [clientName, setClientName] = useState("")
  const [clientAddress, setClientAddress] = useState("")
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productQuantity, setProductQuantity] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)

  useEffect(() => {
    if (editOrder) {
      setClientName(editOrder.name)
      setClientAddress(editOrder.address)
      setProducts(editOrder.products)
    } else {
      setClientName("")
      setClientAddress("")
      setProducts([])
    }
    setEditingProductIndex(null)
  }, [editOrder, open])

  const orderId = editOrder ? editOrder.id : `ORD-${String(Number(lastOrderId.split("-")[1]) + 1).padStart(3, "0")}`

  const totalOrderValue = products.reduce((sum, product) => sum + product.total, 0)

  const handleAddOrUpdateProduct = () => {
    if (!productName || !productPrice || !productQuantity) return

    const price = Number.parseFloat(productPrice)
    const quantity = Number.parseInt(productQuantity)
    const total = price * quantity

    if (editingProductIndex !== null) {
      const updatedProducts = [...products]
      updatedProducts[editingProductIndex] = { name: productName, price, quantity, total }
      setProducts(updatedProducts)
      setEditingProductIndex(null)
    } else {
      setProducts([...products, { name: productName, price, quantity, total }])
    }

    setProductName("")
    setProductPrice("")
    setProductQuantity("")
  }

  const handleEditProduct = (index: number) => {
    const productToEdit = products[index]
    setProductName(productToEdit.name)
    setProductPrice(productToEdit.price.toString())
    setProductQuantity(productToEdit.quantity.toString())
    setEditingProductIndex(index)
  }

  const handleDeleteProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
    if (editingProductIndex === index) {
      setEditingProductIndex(null)
      setProductName("")
      setProductPrice("")
      setProductQuantity("")
    }
  }

  const handleSave = () => {
    if (!clientName || !clientAddress || products.length === 0) return

    const newOrder: Order = {
      id: orderId,
      name: clientName,
      address: clientAddress,
      date: editOrder ? editOrder.date : new Date().toISOString().split("T")[0],
      total: totalOrderValue,
      products,
    }

    onSave(newOrder)
    onOpenChange(false)
  }

  const handleExportPDF = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text("Gerenciador de Pedido", 10, 10);
    doc.setFontSize(12);
    doc.text(`ID: ${orderId}`, 10, 20);
    doc.text(`Nome do Cliente: ${clientName}`, 10, 30);
    doc.text(`Endereço: ${clientAddress}`, 10, 40);
    doc.text(`Data do Pedido: ${new Date().toLocaleDateString()}`, 10, 50);
  
    doc.setFontSize(14);
    doc.text("Produtos:", 10, 60);
  
    let yOffset = 70;
    products.forEach((product, index) => {
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${product.name}`, 10, yOffset);
      doc.text(`Preço: $${product.price.toFixed(2)}`, 60, yOffset);
      doc.text(`Qtd: ${product.quantity}`, 100, yOffset);
      doc.text(`Total: $${product.total.toFixed(2)}`, 140, yOffset);
      yOffset += 10;
    });
  

    doc.setFontSize(14);
    doc.text(`Valor Total: R$${totalOrderValue.toFixed(2)}`, 10, yOffset + 10);
  
    doc.save(`Pedido_${orderId}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{editOrder ? "Edit Order" : "New Order"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-7 gap-4">
            <div>
              <Input value={orderId} readOnly />
            </div>
            <div className="col-span-3">
              <Input placeholder="Client name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="col-span-3">
              <Input
                placeholder="Client address"
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5">
              <Input placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
            </div>
            <div className="col-span-3">
              <Input
                type="number"
                placeholder="Price"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                placeholder="Quantity"
                value={productQuantity}
                onChange={(e) => setProductQuantity(e.target.value)}
              />
            </div>
            <div className="col-span-2">
              <Button onClick={handleAddOrUpdateProduct} className="w-full">
                {editingProductIndex !== null ? (
                  <>
                    <Pencil className="h-4 w-4 mr-2" />
                    Update
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={index} className="cursor-pointer">
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{product.quantity}</TableCell>
                      <TableCell className="text-right">${product.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(index)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(index)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No products added
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="space-x-2">
              <Button variant="outline" onClick={handleExportPDF}>
                Export Order
              </Button>
            </div>
            <div className="text-lg font-semibold">Total: ${totalOrderValue.toFixed(2)}</div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

