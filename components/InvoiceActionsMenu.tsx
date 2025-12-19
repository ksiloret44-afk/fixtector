'use client'

import ActionsMenu from './ActionsMenu'

interface InvoiceActionsMenuProps {
  invoiceId: string
  paymentStatus: string
}

export default function InvoiceActionsMenu({ invoiceId, paymentStatus }: InvoiceActionsMenuProps) {
  return (
    <ActionsMenu
      type="invoice"
      id={invoiceId}
      status={paymentStatus}
    />
  )
}

