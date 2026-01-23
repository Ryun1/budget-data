import React from 'react'
import Link from 'next/link'
import { type Transaction } from '../lib/api'

interface TransactionCardProps {
  transaction: Transaction
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div style={{ flex: 1 }}>
          <Link href={`/transactions/${transaction.tx_hash}`}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>
              <code style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                {transaction.tx_hash.substring(0, 32)}...
              </code>
            </h3>
          </Link>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
            <strong>Slot:</strong> {transaction.slot.toLocaleString()}
          </p>
          {transaction.event_type && (
            <p style={{ color: '#666', fontSize: '0.875rem' }}>
              <strong>Event:</strong>{' '}
              <span className={`status ${transaction.event_type.toLowerCase()}`}>
                {transaction.event_type}
              </span>
            </p>
          )}
        </div>
        <div>
          <Link 
            href={`/transactions/${transaction.tx_hash}`}
            className="link-button"
            style={{ fontSize: '0.875rem', padding: '0.25rem 0.75rem' }}
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}
