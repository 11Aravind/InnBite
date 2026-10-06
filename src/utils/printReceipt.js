/**
 * Utility for rendering and printing standard 80mm thermal receipts
 * includes Address, GSTIN, Phone, Bill No, Unit Price, Qty, CGST, SGST, and Round off
 */

export function printThermalReceipt(order, settings = {}) {
    if (!order) return;

    const restaurantName = settings.restaurantName || settings.appName || settings.restaurant_name || 'InnBite Restaurant';
    const address = settings.address || settings.contact_address || '';
    const phone = settings.phone || settings.contact_phone || settings.contactPhone || '';
    const gstNo = settings.gstNo || settings.gst_no || settings.taxId || settings.tax_id || '';

    const billNo = order.bill_no || order.billNo || order.order_number || order.id;
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

    // Calculate total quantity
    const totalQty = items.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);

    // Calculate item subtotal
    const calculatedItemsTotal = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.unit_price_snapshot || item.unit_price || item.price || 0);
        return sum + (price * qty);
    }, 0);

    const subtotal = Number(order.subtotal || calculatedItemsTotal || 0);
    const discount = Number(order.discount || 0);

    // Extract dynamic CGST & SGST rates from settings (default 2.5% each)
    const cgstRate = settings.cgstRate !== undefined ? Number(settings.cgstRate) : (settings.cgst_rate !== undefined ? Number(settings.cgst_rate) : 2.5);
    const sgstRate = settings.sgstRate !== undefined ? Number(settings.sgstRate) : (settings.sgst_rate !== undefined ? Number(settings.sgst_rate) : 2.5);

    const taxableAmount = Math.max(0, subtotal - discount);
    const rawTax = Number(order.tax_amount || order.tax || 0);
    let cgst = 0;
    let sgst = 0;

    if (rawTax > 0) {
        cgst = rawTax / 2;
        sgst = rawTax / 2;
    } else {
        cgst = Number((taxableAmount * (cgstRate / 100)).toFixed(2));
        sgst = Number((taxableAmount * (sgstRate / 100)).toFixed(2));
    }

    const exactTotal = subtotal - discount + cgst + sgst;
    const finalGrandTotal = Math.round(exactTotal);
    const roundOff = finalGrandTotal - exactTotal;
    const roundOffStr = (roundOff >= 0 ? '+' : '') + roundOff.toFixed(2);

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - Bill No #${billNo}</title>
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
          font-size: 11px;
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
          padding: 3px 0;
          vertical-align: top;
        }
        th {
          border-bottom: 1px dashed #000;
          font-size: 10px;
          font-weight: bold;
        }
        .col-item { width: 44%; text-align: left; font-weight: bold; }
        .col-price { width: 18%; text-align: right; }
        .col-qty { width: 14%; text-align: center; font-weight: bold; }
        .col-total { width: 24%; text-align: right; font-weight: bold; }

        .notes {
          font-size: 9px;
          font-style: italic;
          padding-left: 6px;
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
      <!-- Header: Restaurant Name, Address, Contact & GSTIN -->
      <div class="text-center">
        <div class="bold" style="font-size: 15px;">${restaurantName.toUpperCase()}</div>
        ${address ? `<div>${address}</div>` : ''}
        ${phone ? `<div>Ph: ${phone}</div>` : ''}
        ${gstNo ? `<div class="bold">GSTIN: ${gstNo}</div>` : ''}
      </div>

      <div class="double-dashed-line"></div>

      <!-- Bill No & Order Details -->
      <div>
        <div class="bold" style="font-size: 12px;">Bill No: #${billNo}</div>
        <div>Date: ${dateStr}</div>
        <div>Type: ${tableLabel}</div>
        ${order.customer_name ? `<div>Customer: ${order.customer_name}</div>` : ''}
        ${order.customer_phone ? `<div>Phone: ${order.customer_phone}</div>` : ''}
      </div>

      <div class="dashed-line"></div>

      <!-- Item Table with ITEM, PRICE (Unit Price), QTY (Quantity), TOTAL -->
      <table>
        <thead>
          <tr>
            <th class="col-item">ITEM</th>
            <th class="col-price">PRICE</th>
            <th class="col-qty">QTY</th>
            <th class="col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const name = item.dish_name || item.name || 'Item';
            const qty = item.quantity || 1;
            const unitPrice = Number(item.unit_price_snapshot || item.unit_price || item.price || 0);
            const total = (unitPrice * qty).toFixed(2);
            const portion = item.portion_label || item.portion ? ` (${item.portion_label || item.portion})` : '';
            const note = item.special_instruction || item.specialInstruction || '';
            return `
              <tr>
                <td class="col-item">${name}${portion}</td>
                <td class="col-price">${unitPrice.toFixed(2)}</td>
                <td class="col-qty">${qty}</td>
                <td class="col-total">${total}</td>
              </tr>
              ${note ? `<tr><td colspan="4" class="notes">* Note: ${note}</td></tr>` : ''}
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="dashed-line"></div>

      <!-- Summary: Total Qty, Subtotal, CGST, SGST, Round off, Grand Total -->
      <div>
        <div class="total-row">
          <span>Total Qty: <strong class="bold">${totalQty}</strong></span>
          <span>Sub Total: &nbsp;<strong>${subtotal.toFixed(2)}</strong></span>
        </div>

        ${discount > 0 ? `
          <div class="total-row">
            <span>Discount:</span>
            <span>- ${discount.toFixed(2)}</span>
          </div>
        ` : ''}

        ${cgstRate > 0 || cgst > 0 ? `
          <div class="total-row">
            <span>CGST@${cgstRate}%:</span>
            <span>${cgst.toFixed(2)}</span>
          </div>
        ` : ''}

        ${sgstRate > 0 || sgst > 0 ? `
          <div class="total-row">
            <span>SGST@${sgstRate}%:</span>
            <span>${sgst.toFixed(2)}</span>
          </div>
        ` : ''}

        <div class="dashed-line"></div>

        <div class="total-row">
          <span>Round off</span>
          <span>${roundOffStr}</span>
        </div>

        <div class="total-row grand-total">
          <span>Grand Total</span>
          <span>₹${finalGrandTotal.toFixed(2)}</span>
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
