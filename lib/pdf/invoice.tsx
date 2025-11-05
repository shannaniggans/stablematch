import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatCurrency } from '@/lib/utils';
import type { Invoice, InvoiceItem, Practice, Client } from '@prisma/client';
import { pdf } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1f2937',
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 12,
  },
  section: {
    marginBottom: 16,
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingVertical: 6,
  },
  colDescription: {
    flex: 3,
  },
  colQty: { flex: 1, textAlign: 'center' },
  colPrice: { flex: 1, textAlign: 'right' },
  totals: {
    marginTop: 16,
    marginLeft: 'auto',
    width: 200,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
  },
  muted: {
    color: '#6b7280',
  },
});

type InvoiceWithRelations = Invoice & {
  practice: Practice;
  client: Client;
  items: InvoiceItem[];
};

function InvoicePdf({ invoice }: { invoice: InvoiceWithRelations }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{invoice.practice.name}</Text>
          <Text style={styles.muted}>{invoice.practice.timezone}</Text>
        </View>

        <View style={styles.section}>
          <Text>Invoice Number: {invoice.number}</Text>
          <Text>Issued: {new Date(invoice.issuedAt).toLocaleDateString()}</Text>
          <Text>Due: {new Date(invoice.dueAt).toLocaleDateString()}</Text>
        </View>

        <View style={styles.section}>
          <Text>Bill To:</Text>
          <Text>{invoice.client.firstName + ' ' + invoice.client.lastName}</Text>
          {invoice.client.email ? <Text style={styles.muted}>{invoice.client.email}</Text> : null}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colPrice}>Amount</Text>
          </View>
          {invoice.items.map((item) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.colDescription}>{item.description}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colPrice}>{formatCurrency(item.unitPriceCents * item.qty)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Subtotal</Text>
            <Text>{formatCurrency(invoice.subtotalCents)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Tax</Text>
            <Text>{formatCurrency(invoice.taxCents)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Total</Text>
            <Text>{formatCurrency(invoice.totalCents)}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(invoice: InvoiceWithRelations) {
  const file = await pdf(<InvoicePdf invoice={invoice} />).toBuffer();
  return file;
}
