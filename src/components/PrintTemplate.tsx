import itechLogo from "@/assets/itechlogo.png";

interface PrintItem {
  id: string;
  item_name?: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  tax_name?: string;
  tax_amount?: number;
  cgst_amount?: number;
  sgst_amount?: number;
  igst_amount?: number;
  total: number;
  unit?: string;
}

interface ShopSettings {
  shop_name: string;
  shop_address: string | null;
  shop_city: string | null;
  shop_state: string | null;
  shop_pincode: string | null;
  shop_phone: string | null;
  shop_email: string | null;
  shop_website: string | null;
  shop_gst: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_branch: string | null;
  upi_id: string | null;
  terms_and_conditions: string | null;
}

interface PrintTemplateProps {
  type: 'QUOTATION' | 'INVOICE';
  documentNumber: string | null;
  customerName: string;
  customerContact: string | null;
  customerEmail: string | null;
  customerAddress?: string | null;
  customerState?: string | null;
  items: PrintItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdDate: string;
  validityDate?: string;
  dueDate?: string | null;
  status: string;
  notes: string | null;
  shopSettings: ShopSettings | null;
}

export const getPrintStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 15px; font-size: 12px; color: #000; }
  
  .document-title { 
    text-align: center; 
    font-size: 16px; 
    font-weight: bold; 
    padding: 8px; 
    border: 1px solid #000;
    margin-bottom: 0;
  }
  
  .main-header {
    display: table;
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000;
    border-top: none;
  }
  
  .header-left {
    display: table-cell;
    width: 60%;
    vertical-align: top;
    border-right: 1px solid #000;
    padding: 0;
  }
  
  .header-right {
    display: table-cell;
    width: 40%;
    vertical-align: top;
  }
  
  .logo-company {
    display: flex;
    align-items: flex-start;
    padding: 10px;
  }
  
  .logo { 
    width: 70px; 
    height: auto;
    margin-right: 10px;
  }
  
  .company-details h2 { 
    font-size: 14px; 
    font-weight: bold;
    color: #c00;
    margin-bottom: 3px;
  }
  
  .company-details p { 
    font-size: 11px; 
    line-height: 1.4;
    margin: 1px 0;
  }
  
  .header-info-row {
    display: flex;
    border-bottom: 1px solid #000;
  }
  
  .header-info-row:last-child {
    border-bottom: none;
  }
  
  .header-info-cell {
    flex: 1;
    padding: 5px 8px;
    font-size: 11px;
    border-right: 1px solid #000;
  }
  
  .header-info-cell:last-child {
    border-right: none;
  }
  
  .header-info-cell strong {
    font-weight: normal;
  }
  
  .customer-section {
    border: 1px solid #000;
    border-top: none;
    padding: 10px;
  }
  
  .customer-section p {
    font-size: 11px;
    line-height: 1.5;
    margin: 2px 0;
  }
  
  .items-table { 
    width: 100%; 
    border-collapse: collapse; 
    margin-top: 0;
    border: 1px solid #000;
    border-top: none;
  }
  
  .items-table th { 
    background: #fff; 
    color: #000; 
    padding: 8px 5px; 
    text-align: center; 
    font-size: 10px;
    font-weight: bold;
    border: 1px solid #000;
  }
  
  .items-table td { 
    border: 1px solid #000; 
    padding: 6px 5px; 
    font-size: 11px;
    vertical-align: top;
  }
  
  .items-table td.text-center { text-align: center; }
  .items-table td.text-right { text-align: right; }
  .items-table td.text-left { text-align: left; }
  
  .items-table .description-cell {
    text-align: left;
    max-width: 180px;
  }
  
  .item-subtotal {
    font-size: 10px;
    color: #666;
    margin-top: 3px;
  }
  
  .totals-section {
    border: 1px solid #000;
    border-top: none;
    padding: 10px;
  }
  
  .totals-row {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 5px;
  }
  
  .totals-row span {
    min-width: 100px;
    text-align: right;
  }
  
  .totals-row.grand-total {
    font-weight: bold;
    font-size: 14px;
    border-top: 2px solid #000;
    padding-top: 5px;
    margin-top: 5px;
  }
  
  .bank-section {
    border: 1px solid #000;
    border-top: none;
    padding: 10px;
  }
  
  .bank-section h3 {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 8px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 5px;
  }
  
  .bank-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  
  .bank-section p {
    font-size: 11px;
    margin: 3px 0;
  }
  
  .terms-section {
    border: 1px solid #000;
    border-top: none;
    padding: 10px;
    background: #fffbf0;
  }
  
  .terms-section h3 {
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  
  .terms-section p {
    font-size: 10px;
    line-height: 1.4;
    white-space: pre-wrap;
  }
  
  .footer { 
    margin-top: 15px;
    text-align: center; 
    font-size: 10px;
    color: #666;
    border-top: 1px solid #000;
    padding-top: 8px;
  }
  
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    @page { margin: 10mm; }
  }
`;

const PrintTemplate = ({
  type,
  documentNumber,
  customerName,
  customerContact,
  customerEmail,
  customerAddress,
  customerState,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  createdDate,
  validityDate,
  dueDate,
  status,
  notes,
  shopSettings
}: PrintTemplateProps) => {
  const getShopAddress = () => {
    if (!shopSettings) return "";
    const parts = [
      shopSettings.shop_address,
      shopSettings.shop_city,
      shopSettings.shop_state,
      shopSettings.shop_pincode
    ].filter(Boolean);
    return parts.join(", ");
  };

  const shopAddress = getShopAddress();
  
  // Determine if interstate (IGST) or intrastate (CGST+SGST)
  const isInterState = customerState && shopSettings?.shop_state && customerState !== shopSettings.shop_state;
  
  // Calculate totals
  const cgstTotal = isInterState ? 0 : items.reduce((sum, item) => sum + (item.cgst_amount || (item.tax_amount || 0) / 2), 0);
  const sgstTotal = isInterState ? 0 : items.reduce((sum, item) => sum + (item.sgst_amount || (item.tax_amount || 0) / 2), 0);
  const igstTotal = isInterState ? items.reduce((sum, item) => sum + (item.igst_amount || item.tax_amount || 0), 0) : 0;

  return (
    <div className="print-template">
      {/* Document Title */}
      <div className="document-title">{type}</div>

      {/* Main Header with Logo, Company Info, and Document Details */}
      <div className="main-header">
        <div className="header-left">
          <div className="logo-company">
            <img src={itechLogo} alt="Logo" className="logo" />
            <div className="company-details">
              <h2>{shopSettings?.shop_name || "I TECH COMPUTERS"}</h2>
              {shopAddress && <p>{shopAddress}</p>}
              {shopSettings?.shop_gst && <p>GSTIN/UIN: {shopSettings.shop_gst}</p>}
              {shopSettings?.shop_state && <p>State Name: {shopSettings.shop_state}, Code: 32</p>}
              {shopSettings?.shop_email && <p>E-Mail: {shopSettings.shop_email}</p>}
            </div>
          </div>
        </div>
        <div className="header-right">
          <div className="header-info-row">
            <div className="header-info-cell" style={{ borderRight: '1px solid #000' }}>
              <strong>{type === 'QUOTATION' ? 'Quotation' : 'Invoice'} No.</strong><br />
              <b>{documentNumber || '-'}</b>
            </div>
            <div className="header-info-cell">
              <strong>Dated</strong><br />
              <b>{createdDate}</b>
            </div>
          </div>
          <div className="header-info-row">
            <div className="header-info-cell" style={{ borderRight: '1px solid #000' }}>
              <strong>Mode/Terms of Payment</strong><br />
              &nbsp;
            </div>
            <div className="header-info-cell">
              &nbsp;
            </div>
          </div>
          <div className="header-info-row">
            <div className="header-info-cell" style={{ borderRight: '1px solid #000' }}>
              <strong>Buyer's Ref./Order No.</strong><br />
              {documentNumber || '-'}
            </div>
            <div className="header-info-cell">
              <strong>Other Reference(s)</strong><br />
              &nbsp;
            </div>
          </div>
          <div className="header-info-row">
            <div className="header-info-cell" style={{ borderRight: '1px solid #000' }}>
              <strong>Despatch through</strong><br />
              &nbsp;
            </div>
            <div className="header-info-cell">
              <strong>Destination</strong><br />
              {customerState || ''}
            </div>
          </div>
          <div className="header-info-row">
            <div className="header-info-cell">
              <strong>Terms of Delivery</strong><br />
              {validityDate ? `Valid until: ${validityDate}` : dueDate ? `Due: ${dueDate}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Section */}
      <div className="customer-section">
        <p><strong>{type === 'QUOTATION' ? 'Invoice to' : 'Bill to'}</strong></p>
        <p><b>{customerName}</b></p>
        {customerAddress && <p>{customerAddress}</p>}
        {customerState && <p>State: {customerState}</p>}
        {customerContact && <p>Contact: {customerContact}</p>}
        {customerEmail && <p>Email: {customerEmail}</p>}
      </div>

      {/* Items Table */}
      <table className="items-table">
        <thead>
          <tr>
            <th style={{ width: '25px' }}>SI<br />No.</th>
            <th style={{ width: 'auto' }}>Description of Goods</th>
            <th style={{ width: '50px' }}>Tax<br />Rate</th>
            <th style={{ width: '50px' }}>Qty</th>
            <th style={{ width: '65px' }}>Rate<br />(Excl.)</th>
            <th style={{ width: '65px' }}>Rate<br />(Incl.)</th>
            <th style={{ width: '75px' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const rateExcl = item.unit_price;
            const taxPerUnit = item.tax_rate ? (item.unit_price * item.tax_rate / 100) : 0;
            const rateIncl = item.unit_price + taxPerUnit;
            const displayName = item.item_name || item.description;
            const displayDescription = item.item_name ? item.description : "";
            
            return (
              <tr key={item.id}>
                <td className="text-center">{index + 1}</td>
                <td className="description-cell">
                  <strong>{displayName}</strong>
                  {displayDescription && (
                    <div style={{ fontSize: '10px', fontWeight: 'normal', marginTop: '2px' }}>
                      {displayDescription}
                    </div>
                  )}
                </td>
                <td className="text-center">{item.tax_rate ? `${item.tax_rate}%` : '-'}</td>
                <td className="text-center">
                  {item.quantity} {item.unit || 'Nos'}
                </td>
                <td className="text-right">₹{rateExcl.toFixed(2)}</td>
                <td className="text-right">₹{rateIncl.toFixed(2)}</td>
                <td className="text-right"><b>₹{item.total.toFixed(2)}</b></td>
              </tr>
            );
          })}
          {/* Empty rows for spacing if needed */}
          {items.length < 5 && [...Array(5 - items.length)].map((_, i) => (
            <tr key={`empty-${i}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals Section */}
      <div className="totals-section">
        <div className="totals-row">
          <span style={{ marginRight: '20px' }}>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        {isInterState ? (
          <div className="totals-row">
            <span style={{ marginRight: '20px' }}>IGST:</span>
            <span>₹{igstTotal.toFixed(2)}</span>
          </div>
        ) : (
          <>
            <div className="totals-row">
              <span style={{ marginRight: '20px' }}>CGST:</span>
              <span>₹{cgstTotal.toFixed(2)}</span>
            </div>
            <div className="totals-row">
              <span style={{ marginRight: '20px' }}>SGST:</span>
              <span>₹{sgstTotal.toFixed(2)}</span>
            </div>
          </>
        )}
        <div className="totals-row">
          <span style={{ marginRight: '20px' }}>Round Off:</span>
          <span>₹{(Math.round(totalAmount) - totalAmount).toFixed(2)}</span>
        </div>
        <div className="totals-row grand-total">
          <span style={{ marginRight: '20px' }}>Total:</span>
          <span>₹{Math.round(totalAmount).toFixed(2)}</span>
        </div>
      </div>

      {/* Bank Details */}
      {shopSettings && (shopSettings.bank_name || shopSettings.upi_id) && (
        <div className="bank-section">
          <h3>Bank Details for Payment</h3>
          <div className="bank-details-grid">
            {shopSettings.bank_name && (
              <div>
                <p><strong>Bank:</strong> {shopSettings.bank_name}</p>
                {shopSettings.bank_branch && <p><strong>Branch:</strong> {shopSettings.bank_branch}</p>}
                {shopSettings.bank_account_name && <p><strong>A/C Name:</strong> {shopSettings.bank_account_name}</p>}
                {shopSettings.bank_account_number && <p><strong>A/C No:</strong> {shopSettings.bank_account_number}</p>}
                {shopSettings.bank_ifsc && <p><strong>IFSC:</strong> {shopSettings.bank_ifsc}</p>}
              </div>
            )}
            {shopSettings.upi_id && (
              <div>
                <p><strong>UPI ID:</strong> {shopSettings.upi_id}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms & Notes */}
      {(notes || shopSettings?.terms_and_conditions) && (
        <div className="terms-section">
          <h3>Terms & Conditions</h3>
          {notes && <p>{notes}</p>}
          {shopSettings?.terms_and_conditions && <p>{shopSettings.terms_and_conditions}</p>}
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <p>This is a Computer Generated Document</p>
      </div>
    </div>
  );
};

export default PrintTemplate;
export type { PrintItem, ShopSettings as PrintShopSettings };
