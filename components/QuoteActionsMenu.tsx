'use client'

import ActionsMenu from './ActionsMenu'

interface QuoteActionsMenuProps {
  quoteId: string
  status: string
  repairId?: string
}

export default function QuoteActionsMenu({ quoteId, status, repairId }: QuoteActionsMenuProps) {
  return (
    <ActionsMenu
      type="quote"
      id={quoteId}
      status={status}
      repairId={repairId}
    />
  )
}

