'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  invoiceId: string;
}

export function CheckoutButton({ invoiceId }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices/' + invoiceId + '/checkout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Unable to create checkout session');
      }
      const data = await res.json();
      window.location.href = data.url;
    } catch (error: any) {
      toast.error(error.message ?? 'Unable to start checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? 'Preparing checkout…' : 'Send payment link'}
    </Button>
  );
}
