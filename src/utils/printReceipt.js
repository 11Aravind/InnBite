/**
 * Utility for rendering and printing standard 80mm thermal receipts
 */

export function printThermalReceipt(order, settings = {}) {
    if (!order) return;

    const restaurantName = settings.restaurantName || settings.appName || 'InnBite Restaurant';
    const address = settings.address || 'Main Street, City Center';
    const phone = settings.phone || settings.contactPhone || '';
    const gstNo = settings.gstNo || settings.taxId || '';

    const items = order.order_items || order.items || [];
    const dateStr = order.created_at
        ? new Date(order.created_at).toLocaleString('en-IN', {
            dateStyle: 'short',
            timeStyle: 'medium'
        })
        : new Date().toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' });

    const tableLabel = order.table_number
        ? `Table #${order.table_number}`
        : order.service_mode === 'SELF_SERVICE'
            ? 'Takeaway / Counter'
            : 'POS Direct';

    const paymentMethodLabel =
        order.payment_method === 'cash' || order.payment_method === 'cash_at_counter'
            ? 'CASH'
            : order.payment_method === 'upi'
                ? 'UPI / QR'
                : order.payment_method === 'card'
                    ? 'CARD'
                    : 'ONLINE / RAZORPAY';

    const isPaid = order.payment_status === 'SUCCESS' || order.payment_status === 'paid';

    const subtotal = Number(order.subtotal || order.total_amount || 0);
    const discount = Number(order.discount || 0);
    const tax = Number(order.tax_amount || order.tax || 0);
    const grandTotal = Number(order.total_amount || (subtotal - discount + tax));

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - Order #${order.order_number || order.id}</title>
      <style>
        @page {
          size: 80mm auto;
          margin: 0mm;
        }
        body {
          width: 78mm;
          margin: 0 auto;
          padding: 8px 4px;
          font-family: 'Courier New', Courier, monospace, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        .dashed-line {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-dashed-line {
          border-top: 2px dashed #000;
          margin: 8px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
        }
        th, td {
          padding: 2px 0;
          vertical-align: top;
        }
        th {
          border-bottom: 1px dashed #000;
          text-align: left;
          font-size: 11px;
        }
        .item-name { width: 55%; font-weight: bold; }
        .item-qty { width: 15%; text-align: center; }
        .item-amt { width: 30%; text-align: right; }
        .notes {
          font-size: 10px;
          font-style: italic;
          padding-left: 8px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
        }
        .grand-total {
          font-size: 15px;
          font-weight: bold;
          margin-top: 4px;
        }
        .status-badge {
          display: inline-block;
          padding: 2px 8px;
          border: 1px solid #000;
          font-weight: bold;
          margin-top: 4px;
          font-size: 11px;
        }
      </style>
    </head>
    <body>
      <div class="text-center">
        <div class="bold" style="font-size: 16px;">${restaurantName.toUpperCase()}</div>
        ${address ? `<div>${address}</div>` : ''}
        ${phone ? `<div>Ph: ${phone}</div>` : ''}
        ${gstNo ? `<div>GSTIN: ${gstNo}</div>` : ''}
      </div>

      <div class="double-dashed-line"></div>

      <div>
        <div class="bold">Order #: ${order.order_number || order.id}</div>
        <div>Date: ${dateStr}</div>
        <div>Type: ${tableLabel}</div>
        ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ''}
        ${order.customer_phone ? `<div>Phone: ${order.customer_phone}</div>` : ''}
      </div>

      <div class="dashed-line"></div>

      <table>
        <thead>
          <tr>
            <th class="item-name">ITEM</th>
            <th class="item-qty">QTY</th>
            <th class="item-amt">AMT (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
        const name = item.dish_name || item.name || 'Item';
        const qty = item.quantity || 1;
        const price = Number(item.unit_price_snapshot || item.unit_price || item.price || 0);
        const total = (price * qty).toFixed(2);
        const portion = item.portion_label ? ` (${item.portion_label})` : '';
        const note = item.special_instruction || item.specialInstruction || '';
        return `
              <tr>
                <td class="item-name">${name}${portion}</td>
                <td class="item-qty">${qty}</td>
                <td class="item-amt">${total}</td>
              </tr>
              ${note ? `<tr><td colspan="3" class="notes">* Note: ${note}</td></tr>` : ''}
            `;
    }).join('')}
        </tbody>
      </table>

      <div class="dashed-line"></div>

      <div>
        ${subtotal > 0 ? `
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal.toFixed(2)}</span>
          </div>
        ` : ''}
        ${discount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>- ₹${discount.toFixed(2)}</span>
          </div>
        ` : ''}
        ${tax > 0 ? `
          <div class="total-row">
            <span>GST / Tax:</span>
            <span>+ ₹${tax.toFixed(2)}</span>
          </div>
        ` : ''}
        <div class="total-row grand-total">
          <span>TOTAL:</span>
          <span>₹${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      <div class="dashed-line"></div>

      <div class="text-center">
        <div>PAYMENT METHOD: <span class="bold">${paymentMethodLabel}</span></div>
        <div class="status-badge">
          ${isPaid ? 'PAID / COMPLETED' : 'PAYMENT PENDING'}
        </div>
      </div>

      <div class="double-dashed-line"></div>

      <div class="text-center bold" style="font-size: 11px;">
        THANK YOU FOR YOUR VISIT!
        <br />
        HAVE A GREAT DAY!
      </div>
    </body>
    </html>
  `;

    // Create an invisible iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.contentWindow.focus();

    // Trigger print after rendering
    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    }, 250);
}
