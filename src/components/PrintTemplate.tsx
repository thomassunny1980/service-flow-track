import { useState, useEffect } from "react";
import itechLogo from "@/assets/itechlogo.png";

// Convert image to base64 for print compatibility
const getBase64Logo = (): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => resolve(itechLogo);
    img.src = itechLogo;
  });
};

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
  amountPaid?: number;
  createdDate: string;
  validityDate?: string;
  dueDate?: string | null;
  status: string;
  notes: string | null;
  shopSettings: ShopSettings | null;
}

// Number to words converter for Indian currency
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
  };

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remaining = num % 1000;

  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (remaining > 0) result += convertLessThanThousand(remaining);

  return result.trim() + ' Only';
};

export const getPrintStyles = () => `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; padding: 15px; font-size: 11px; color: #000; }
  
  .document-title { 
    text-align: center; 
    font-size: 16px; 
    font-weight: bold; 
    padding: 8px; 
    margin-bottom: 0;
  }
  
  .main-container {
    border: 1px solid #000;
  }
  
  .main-header {
    display: table;
    width: 100%;
    border-collapse: collapse;
  }
  
  .header-left {
    display: table-cell;
    width: 55%;
    vertical-align: top;
    border-right: 1px solid #000;
    padding: 0;
  }
  
  .header-right {
    display: table-cell;
    width: 45%;
    vertical-align: top;
  }
  
  .logo-company {
    display: flex;
    align-items: flex-start;
    padding: 8px;
  }
  
  .logo { 
    width: 60px; 
    height: auto;
    margin-right: 8px;
  }
  
  .company-details h2 { 
    font-size: 13px; 
    font-weight: bold;
    color: #c00;
    margin-bottom: 2px;
  }
  
  .company-details p { 
    font-size: 10px; 
    line-height: 1.3;
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
    padding: 4px 6px;
    font-size: 10px;
    border-right: 1px solid #000;
  }
  
  .header-info-cell:last-child {
    border-right: none;
  }
  
  .header-info-cell strong {
    font-weight: normal;
  }
  
  .customer-section {
    border-top: 1px solid #000;
    padding: 8px;
  }
  
  .customer-section p {
    font-size: 10px;
    line-height: 1.4;
    margin: 1px 0;
  }
  
  .customer-label {
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .items-table { 
    width: 100%; 
    border-collapse: collapse;
    border-top: 1px solid #000;
  }
  
  .items-table th { 
    background: #fff; 
    color: #000; 
    padding: 6px 4px; 
    text-align: center; 
    font-size: 10px;
    font-weight: bold;
    border: 1px solid #000;
    border-top: none;
  }
  
  .items-table td { 
    border: 1px solid #000; 
    padding: 4px; 
    font-size: 10px;
    vertical-align: top;
  }
  
  .items-table td.text-center { text-align: center; }
  .items-table td.text-right { text-align: right; }
  .items-table td.text-left { text-align: left; }
  
  .items-table .description-cell {
    text-align: left;
  }
  
  .tax-row td {
    border-top: none !important;
  }
  
  .total-row td {
    font-weight: bold;
    border-top: 2px solid #000 !important;
  }
  
  .amount-words-section {
    padding: 6px 8px;
    font-size: 10px;
    border-top: 1px solid #000;
  }
  
  .amount-words-section strong {
    font-weight: bold;
  }

  .terms-section {
    border-top: 1px solid #000;
    padding: 8px;
    font-size: 10px;
    page-break-inside: avoid;
  }

  .terms-section h4 {
    font-size: 10px;
    text-decoration: underline;
    margin-bottom: 4px;
  }

  .terms-section p {
    white-space: pre-line;
    line-height: 1.4;
  }
  
  .footer-section {
    display: table;
    width: 100%;
    border-top: 1px solid #000;
  }
  
  .declaration-section {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding: 8px;
    border-right: 1px solid #000;
    font-size: 10px;
  }
  
  .declaration-section h4 {
    font-size: 10px;
    text-decoration: underline;
    margin-bottom: 4px;
  }
  
  .bank-signature-section {
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding: 8px;
    font-size: 10px;
  }
  
  .bank-details h4 {
    font-size: 10px;
    text-decoration: underline;
    margin-bottom: 4px;
  }
  
  .bank-details p {
    margin: 2px 0;
  }
  
  .company-signature {
    text-align: right;
    margin-top: 20px;
    font-weight: bold;
  }
  
  .authorised-signatory {
    text-align: right;
    margin-top: 30px;
    font-size: 10px;
    border-top: 1px solid #000;
    padding-top: 4px;
    display: inline-block;
    float: right;
  }
  
  .document-footer { 
    margin-top: 8px;
    text-align: center; 
    font-size: 10px;
    color: #000;
  }
  
  .eoe-text {
    text-align: right;
    font-size: 10px;
    font-style: italic;
  }
  
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    @page { margin: 8mm; }
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
  amountPaid,
  createdDate,
  validityDate,
  dueDate,
  status,
  notes,
  shopSettings
}: PrintTemplateProps) => {
  const [logoBase64, setLogoBase64] = useState<string>(itechLogo);

  useEffect(() => {
    getBase64Logo().then(setLogoBase64);
  }, []);

  const getShopAddress = () => {
    if (!shopSettings) return "";
    const parts = [
      shopSettings.shop_address,
      shopSettings.shop_city,
      shopSettings.shop_state
    ].filter(Boolean);
    return parts.join(", ");
  };

  const shopAddress = getShopAddress();
  
  // Determine if interstate (IGST) or intrastate (CGST+SGST)
  const customerStateLower = customerState?.toLowerCase().trim() || "";
  const shopStateLower = shopSettings?.shop_state?.toLowerCase().trim() || "";
  const isInterState = customerStateLower !== "" && shopStateLower !== "" && customerStateLower !== shopStateLower;
  
  // Calculate totals
  const cgstTotal = isInterState ? 0 : items.reduce((sum, item) => sum + (item.cgst_amount || (item.tax_amount || 0) / 2), 0);
  const sgstTotal = isInterState ? 0 : items.reduce((sum, item) => sum + (item.sgst_amount || (item.tax_amount || 0) / 2), 0);
  const igstTotal = isInterState ? items.reduce((sum, item) => sum + (item.igst_amount || item.tax_amount || 0), 0) : 0;
  
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const roundedTotal = Math.round(totalAmount);
  const roundOff = roundedTotal - totalAmount;
  
  // Get state code (for Kerala it's 32)
  const getStateCode = (state: string | null | undefined): string => {
    if (!state) return "";
    const stateCodeMap: { [key: string]: string } = {
      'kerala': '32',
      'tamil nadu': '33',
      'karnataka': '29',
      'andhra pradesh': '37',
      'telangana': '36',
      'maharashtra': '27',
      'gujarat': '24',
      'rajasthan': '08',
      'delhi': '07',
      'uttar pradesh': '09',
      'west bengal': '19',
    };
    return stateCodeMap[state.toLowerCase().trim()] || "";
  };

  const shopStateCode = getStateCode(shopSettings?.shop_state);
  const customerStateCode = getStateCode(customerState);
  const termsAndConditions = shopSettings?.terms_and_conditions?.trim() || "";

  return (
    <div className="print-template">
      {/* Document Title */}
      <div className="document-title">{type}</div>

      <div className="main-container">
        {/* Main Header with Logo, Company Info, and Document Details */}
        <div className="main-header">
          <div className="header-left">
            <div className="logo-company">
              <img src={logoBase64} alt="Logo" className="logo" />
              <div className="company-details">
                <h2>{shopSettings?.shop_name || "I TECH COMPUTERS"}</h2>
                {shopAddress && <p>{shopAddress}</p>}
                {shopSettings?.shop_gst && <p>GSTIN/UIN: {shopSettings.shop_gst}</p>}
                {shopSettings?.shop_state && <p>State Name : {shopSettings.shop_state}, Code : {shopStateCode}</p>}
                {shopSettings?.shop_phone && (
                  <p>Phone : {shopSettings.shop_phone.split(",").map(p => p.trim()).filter(Boolean).join(" / ")}</p>
                )}
                {shopSettings?.shop_email && <p>E-Mail : {shopSettings.shop_email}</p>}
              </div>
            </div>
          </div>
          <div className="header-right">
            <div className="header-info-row">
              <div className="header-info-cell">
                <strong>{type === 'QUOTATION' ? 'Quotation' : 'Invoice'} No.</strong><br />
                <b>{documentNumber || '-'}</b>
              </div>
              <div className="header-info-cell">
                <strong>Dated</strong><br />
                <b>{createdDate}</b>
              </div>
            </div>
            <div className="header-info-row">
              <div className="header-info-cell" style={{ flex: 2 }}>
                <strong>Mode/Terms of Payment</strong><br />
                &nbsp;
              </div>
            </div>
            <div className="header-info-row">
              <div className="header-info-cell">
                <strong>Buyer's Ref./Order No.</strong><br />
                {documentNumber || '-'}
              </div>
              <div className="header-info-cell">
                <strong>Other Reference(s)</strong><br />
                &nbsp;
              </div>
            </div>
            <div className="header-info-row">
              <div className="header-info-cell">
                <strong>Despatch through</strong><br />
                &nbsp;
              </div>
              <div className="header-info-cell">
                <strong>Destination</strong><br />
                {customerState || ''}
              </div>
            </div>
            <div className="header-info-row">
              <div className="header-info-cell" style={{ flex: 2 }}>
                <strong>Terms of Delivery</strong><br />
                &nbsp;
              </div>
            </div>
          </div>
        </div>

        {/* Customer Section */}
        <div className="customer-section">
          <p className="customer-label">Buyer</p>
          <p><b>{customerName}</b></p>
          {customerAddress && <p>{customerAddress}</p>}
          {customerContact && <p>{customerContact}</p>}
          {customerState && <p>State Name{' '}{' '}{' '}{' '}: {customerState}, Code : {customerStateCode}</p>}
        </div>

        {/* Items Table */}
        <table className="items-table">
          <thead>
            <tr>
              <th style={{ width: '30px' }}>Sl<br />No.</th>
              <th>Description of Goods</th>
              <th style={{ width: '45px' }}>GST<br />Rate</th>
              <th style={{ width: '50px' }}>Due on</th>
              <th style={{ width: '55px' }}>Quantity</th>
              <th style={{ width: '70px' }}>Rate</th>
              <th style={{ width: '35px' }}>per</th>
              <th style={{ width: '80px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const displayName = item.item_name || item.description;
              const displayDescription = item.item_name ? item.description : "";
              
              return (
                <tr key={item.id}>
                  <td className="text-center">{index + 1}</td>
                  <td className="description-cell">
                    <strong>{displayName}</strong>
                    {displayDescription && (
                      <div style={{ fontSize: '9px', fontWeight: 'normal', marginTop: '2px', fontStyle: 'italic' }}>
                        {displayDescription}
                      </div>
                    )}
                  </td>
                  <td className="text-center">{item.tax_rate ? `${item.tax_rate} %` : '-'}</td>
                  <td className="text-center">{validityDate ? '10 Days' : ''}</td>
                  <td className="text-center">
                    <b>{item.quantity}</b> {item.unit || 'Nos'}
                  </td>
                  <td className="text-right">{item.unit_price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-center">{item.unit || 'Nos'}</td>
                  <td className="text-right">{(item.quantity * item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              );
            })}
            
            {/* Empty rows for spacing */}
            {items.length < 3 && [...Array(3 - items.length)].map((_, i) => (
              <tr key={`empty-${i}`}>
                <td>&nbsp;</td>
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

        {/* Tax, Round Off & Total Table - Separate from items */}
        <table className="items-table" style={{ borderTop: '2px solid #000' }}>
          <tbody>
            {/* Tax rows - grouped by rate */}
            {(() => {
              const taxGroups: { [rate: number]: { cgst: number; sgst: number; igst: number } } = {};
              items.forEach(item => {
                const rate = item.tax_rate || 0;
                if (rate === 0) return;
                if (!taxGroups[rate]) taxGroups[rate] = { cgst: 0, sgst: 0, igst: 0 };
                if (isInterState) {
                  taxGroups[rate].igst += item.igst_amount || item.tax_amount || 0;
                } else {
                  taxGroups[rate].cgst += item.cgst_amount || (item.tax_amount || 0) / 2;
                  taxGroups[rate].sgst += item.sgst_amount || (item.tax_amount || 0) / 2;
                }
              });
              const rates = Object.keys(taxGroups).map(Number).sort((a, b) => a - b);

              return isInterState ? (
                rates.map(rate => (
                  <tr key={`igst-${rate}`}>
                    <td style={{ width: '30px' }}></td>
                    <td className="text-right"><strong><em>IGST @ {rate}%</em></strong></td>
                    <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
                    <td className="text-right" style={{ width: '80px' }}>{taxGroups[rate].igst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))
              ) : (
                rates.flatMap(rate => [
                  <tr key={`cgst-${rate}`}>
                    <td style={{ width: '30px' }}></td>
                    <td className="text-right"><strong><em>CGST @ {rate / 2}%</em></strong></td>
                    <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
                    <td className="text-right" style={{ width: '80px' }}>{taxGroups[rate].cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>,
                  <tr key={`sgst-${rate}`}>
                    <td style={{ width: '30px' }}></td>
                    <td className="text-right"><strong><em>SGST @ {rate / 2}%</em></strong></td>
                    <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
                    <td className="text-right" style={{ width: '80px' }}>{taxGroups[rate].sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ])
              );
            })()}
            
            {/* Round Off row */}
            <tr>
              <td style={{ width: '30px' }}></td>
              <td className="text-right"><strong><em>Round Off</em></strong></td>
              <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
              <td className="text-right" style={{ width: '80px' }}>{roundOff.toFixed(2)}</td>
            </tr>
            
            {/* Total row */}
            <tr className="total-row">
              <td style={{ width: '30px' }}></td>
              <td className="text-right"><strong>Total</strong></td>
              <td style={{ width: '45px' }}></td>
              <td style={{ width: '50px' }}></td>
              <td className="text-center" style={{ width: '55px' }}><b>{totalQuantity}</b> Nos</td>
              <td style={{ width: '70px' }}></td>
              <td style={{ width: '35px' }}></td>
              <td className="text-right" style={{ width: '80px' }}><b>₹ {roundedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
            </tr>
            
            {/* Amount Paid / Advance & Balance Due */}
            {amountPaid != null && amountPaid > 0 && (
              <>
                <tr>
                  <td style={{ width: '30px' }}></td>
                  <td className="text-right"><strong><em>{type === 'QUOTATION' ? 'Less: Advance Paid' : 'Less: Amount Paid'}</em></strong></td>
                  <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
                  <td className="text-right" style={{ width: '80px' }}>₹ {amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                {roundedTotal - amountPaid > 0 && (
                  <tr className="total-row">
                    <td style={{ width: '30px' }}></td>
                    <td className="text-right"><strong>Balance Due</strong></td>
                    <td style={{ width: '45px' }}></td><td style={{ width: '50px' }}></td><td style={{ width: '55px' }}></td><td style={{ width: '70px' }}></td><td style={{ width: '35px' }}></td>
                    <td className="text-right" style={{ width: '80px' }}><b>₹ {(roundedTotal - amountPaid).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>

        {/* Amount in words */}
        <div className="amount-words-section">
          <span>Amount Chargeable (in words)</span>
          <span className="eoe-text" style={{ float: 'right' }}>E. & O.E</span>
          <br />
          <strong>INR {numberToWords(roundedTotal)}</strong>
        </div>

        {termsAndConditions && (
          <div className="terms-section">
            <h4>Terms & Conditions</h4>
            <p>{termsAndConditions}</p>
          </div>
        )}

        {/* Footer section with Declaration and Bank Details */}
        <div className="footer-section">
          <div className="declaration-section">
            <h4>Declaration</h4>
            <p>We declare that this {type.toLowerCase()} shows the actual price of the goods described and that all particulars are true and correct.</p>
          </div>
          <div className="bank-signature-section">
            <div className="bank-details">
              <h4>Company's Bank Details</h4>
              {shopSettings?.bank_name && (
                <>
                  <p>Bank Name{' '}{' '}{' '}{' '}{' '}{' '}: <strong>{shopSettings.bank_name}</strong></p>
                  {shopSettings.bank_account_number && <p>A/c No.{' '}{' '}{' '}{' '}{' '}{' '}{' '}{' '}{' '}{' '}: <strong>{shopSettings.bank_account_number}</strong></p>}
                  {shopSettings.bank_branch && shopSettings.bank_ifsc && (
                    <p>Branch & IFS Code: <strong>{shopSettings.bank_branch} & {shopSettings.bank_ifsc}</strong></p>
                  )}
                </>
              )}
            </div>
            <div className="company-signature">
              for {shopSettings?.shop_name || "I TECH COMPUTERS"}
            </div>
            <div className="authorised-signatory">
              Authorised Signatory
            </div>
          </div>
        </div>
      </div>

      {/* Document Footer */}
      <div className="document-footer">
        <p>This is a Computer Generated Document</p>
      </div>
    </div>
  );
};

export default PrintTemplate;
export type { PrintItem, ShopSettings as PrintShopSettings };
