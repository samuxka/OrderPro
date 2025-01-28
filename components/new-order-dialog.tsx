"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, X, ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import jsPDF from "jspdf";
import * as face from "../types/orders"

const initialCustomerInfo: face.CustomerInfo = {
  personType: "fisica",
  cpf: "",
  cnpj: "",
  companyName: "",
  businessName: "",
  zipCode: "",
  address: "",
  complement: "",
  number: "",
  state: "",
  city: "",
  neighborhood: "",
  referencePoint: "",
  telephone: "",
  email: "",
  dateOfBirth: "",
  id: "",
  gender: "",
  name: ""
}

export function NewOrderDialog({ open, onOpenChange, onSave, lastOrderId, editOrder }: face.NewOrderDialogProps) {
  const [step, setStep] = useState(1)
  const [customerInfo, setCustomerInfo] = useState<face.CustomerInfo>(initialCustomerInfo)
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productQuantity, setProductQuantity] = useState("")
  const [products, setProducts] = useState<face.Product[]>([])
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null)

  useEffect(() => {
    if (editOrder) {
      setCustomerInfo({
        personType: editOrder.personType,
        cpf: editOrder.cpf,
        cnpj: editOrder.cnpj,
        companyName: editOrder.companyName,
        businessName: editOrder.businessName,
        zipCode: editOrder.zipCode,
        address: editOrder.address,
        complement: editOrder.complement,
        number: editOrder.number,
        state: editOrder.state,
        city: editOrder.city,
        neighborhood: editOrder.neighborhood,
        referencePoint: editOrder.referencePoint,
        telephone: editOrder.telephone,
        email: editOrder.email,
        dateOfBirth: editOrder.dateOfBirth,
        id: editOrder.id,
        gender: editOrder.gender,
        name: editOrder.name
      })
      setProducts(editOrder.products)
      setStep(2)
    } else {
      setCustomerInfo(initialCustomerInfo)
      setProducts([])
      setStep(1)
    }
    setEditingProductIndex(null)
  }, [editOrder, open])

  const orderId = editOrder ? editOrder.id : `ORD-${String(Number(lastOrderId.split("-")[1]) + 1).padStart(3, "0")}`

  const totalOrderValue = products.reduce((sum, product) => sum + product.total, 0)

  const handleCustomerInfoChange = (field: keyof face.CustomerInfo, value: string) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }))
  }

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
    if (!isCustomerInfoValid() || products.length === 0) return

    const newOrder: face.Order = {
      ...customerInfo,
      id: orderId,
      date: editOrder ? editOrder.date : new Date().toISOString().split("T")[0],
      total: totalOrderValue,
      products
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
    doc.text(`Nome do Cliente: ${customerInfo.name}`, 10, 30);
    doc.text(`Endereço: ${customerInfo.address}`, 10, 40);
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

  const isCustomerInfoValid = () => {
    const requiredFields: (keyof face.CustomerInfo)[] = [
      "personType",
      "zipCode",
      "address",
      "number",
      "state",
      "city",
      "neighborhood",
      "telephone",
      "email",
      "name",
    ]
    if (customerInfo.personType === "fisica") {
      requiredFields.push("cpf", "dateOfBirth", "id", "gender")
    } else {
      requiredFields.push("cnpj", "companyName", "businessName")
    }
    return requiredFields.every((field) => customerInfo[field] !== "")
  }

  const renderCustomerInfoStep = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pl-1 pr-1">
      <RadioGroup
        value={customerInfo.personType}
        onValueChange={(value) => handleCustomerInfoChange("personType", value)}
        className="flex space-x-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="fisica" id="fisica" />
          <Label htmlFor="fisica">Fisica</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="juridica" id="juridica" />
          <Label htmlFor="juridica">Juridica</Label>
        </div>
      </RadioGroup>

      <div className="fisica-head grid grid-cols-6  gap-4">
        <div className="fullName space-y-2 col-span-3">
          <Label htmlFor="name">Nome Completo</Label>
          <Input
            id="name"
            value={customerInfo.name}
            onChange={(e) => handleCustomerInfoChange("name", e.target.value)}
            required
          />
        </div>

        <div className="phone space-y-2 col-span-2">
          <Label htmlFor="telephone">Telefone</Label>
          <Input
            id="telephone"
            value={customerInfo.telephone}
            onChange={(e) => handleCustomerInfoChange("telephone", e.target.value)}
            required
          />
        </div>

        {customerInfo.personType === "fisica" ? (
          <div className="cpf space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={customerInfo.cpf}
              onChange={(e) => handleCustomerInfoChange("cpf", e.target.value)}
              required
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={customerInfo.cnpj}
                onChange={(e) => handleCustomerInfoChange("cnpj", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="companyName">Nome fantásia</Label>
              <Input
                id="companyName"
                value={customerInfo.companyName}
                onChange={(e) => handleCustomerInfoChange("companyName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="businessName">Razão social</Label>
              <Input
                id="businessName"
                value={customerInfo.businessName}
                onChange={(e) => handleCustomerInfoChange("businessName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleCustomerInfoChange("email", e.target.value)}
                required
              />
            </div>
          </>
        )}
      </div>

      <div className="fisica-mid grid grid-cols-10 gap-4">
        {customerInfo.personType === "fisica" && (
          <>
            <div className="rg space-y-2 col-span-2 row-start-1">
              <Label htmlFor="id">RG</Label>
              <Input
                id="id"
                value={customerInfo.id}
                onChange={(e) => handleCustomerInfoChange("id", e.target.value)}
                required
              />
            </div>

            <div className="birth space-y-2 col-span-2 row-start-1">
              <Label htmlFor="dateOfBirth">Nascimento</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={customerInfo.dateOfBirth}
                onChange={(e) => handleCustomerInfoChange("dateOfBirth", e.target.value)}
                required
                className="cursor-pointer"
              />
            </div>

            <div className="gen space-y-2 col-span-2">
              <Label htmlFor="gender">Genero</Label>
              <Select value={customerInfo.gender} onValueChange={(value) => handleCustomerInfoChange("gender", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar genero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male" className="cursor-pointer">Masculino</SelectItem>
                  <SelectItem value="female" className="cursor-pointer">Feminino</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="mail space-y-2 col-span-4">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => handleCustomerInfoChange("email", e.target.value)}
                required
              />
            </div>
          </>
        )}
      </div>

      <div className="address grid grid-cols-12 grid-rows-3 gap-4">
        <div className="cep space-y-2 col-span-2 row-start-1">
          <Label htmlFor="zipCode">CEP</Label>
          <Input
            id="zipCode"
            value={customerInfo.zipCode}
            onChange={(e) => handleCustomerInfoChange("zipCode", e.target.value)}
            required
          />
        </div>

        <div className="end space-y-2 col-span-8 row-start-1">
          <Label htmlFor="address">Endereço</Label>
          <Input
            id="address"
            value={customerInfo.address}
            onChange={(e) => handleCustomerInfoChange("address", e.target.value)}
            required
          />
        </div>

        <div className="num space-y-2 col-span-2 row-start-1">
          <Label htmlFor="number">Número</Label>
          <Input
            id="number"
            value={customerInfo.number}
            onChange={(e) => handleCustomerInfoChange("number", e.target.value)}
            required
          />
        </div>

        <div className="uf space-y-2 row-start-2">
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={customerInfo.state}
            onChange={(e) => handleCustomerInfoChange("state", e.target.value)}
            required
          />
        </div>
        <div className="ci space-y-2 col-span-6 row-start-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            value={customerInfo.city}
            onChange={(e) => handleCustomerInfoChange("city", e.target.value)}
            required
          />
        </div>
        <div className="bairro space-y-2 col-span-5 row-start-2">
          <Label htmlFor="neighborhood">Bairro</Label>
          <Input
            id="neighborhood"
            value={customerInfo.neighborhood}
            onChange={(e) => handleCustomerInfoChange("neighborhood", e.target.value)}
            required
          />
        </div>

        <div className="comp space-y-2 col-span-6 row-start-3">
          <Label htmlFor="complement">Complemento</Label>
          <Input
            id="complement"
            value={customerInfo.complement}
            onChange={(e) => handleCustomerInfoChange("complement", e.target.value)}
          />
        </div>

        <div className="pr space-y-2 col-span-6 row-start-3">
          <Label htmlFor="referencePoint">Ponto de referencia</Label>
          <Input
            id="referencePoint"
            value={customerInfo.referencePoint}
            onChange={(e) => handleCustomerInfoChange("referencePoint", e.target.value)}
          />
        </div>
      </div>
    </div>
  )

  const renderOrderDetailsStep = () => (
    <div className="grid gap-4 py-4">
      <div className="prod grid grid-cols-12 gap-4">
        <div className="prod-name col-span-5">
          <Input placeholder="Product Name" value={productName} onChange={(e) => setProductName(e.target.value)} />
        </div>
        <div className="price col-span-3">
          <Input
            type="number"
            placeholder="Price"
            value={productPrice}
            onChange={(e) => setProductPrice(e.target.value)}
          />
        </div>
        <div className="quantity col-span-2">
          <Input
            type="number"
            placeholder="Quantity"
            value={productQuantity}
            onChange={(e) => setProductQuantity(e.target.value)}
          />
        </div>
        <div className="btn col-span-2">
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
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell className="text-right">${product.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{product.quantity}</TableCell>
                  <TableCell className="text-right">${product.total.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditProduct(index)} className="h-8 w-8">
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
            Exportar pedido
          </Button>
        </div>
        <div className="text-lg font-semibold">Total: R${totalOrderValue.toFixed(2)}</div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-5">
        <DialogHeader>
          <DialogTitle>
            {editOrder ? "Edit Order" : "New Order"} - Step {step} of 2
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? renderCustomerInfoStep() : renderOrderDetailsStep()}

        <DialogFooter>
          {step === 2 && (
            <Button variant="outline" onClick={() => setStep(1)} className="mr-auto">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step === 1 ? (
            <Button onClick={() => setStep(2)} disabled={!isCustomerInfoValid()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} className="mb-4">
                Cancel
              </Button>
              <Button onClick={handleSave} className="bg-green-500 hover:bg-green-600 mb-4" disabled={products.length === 0}>
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

