import { getProxiedImageUrl } from './utils';

export const downloadInspectionPdf = (note: string) => {
  if (typeof window === 'undefined') return;

  const lines = note.split('\n');
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;
  let headerInfo: { overall?: string; action?: string; value?: string; inspector?: string } = {};

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.startsWith('####')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: trimmed.replace(/^####\s*/, ''),
        items: []
      };
      return;
    }

    if (trimmed.startsWith('###')) return;

    if (trimmed.startsWith('**Overall Condition:**')) {
      const match1 = trimmed.match(/\*\*Overall Condition:\*\*\s*([^\s|]+)/i);
      const match2 = trimmed.match(/\*\*Recommended Action:\*\*\s*([^\s|]+)/i);
      if (match1) headerInfo.overall = match1[1];
      if (match2) headerInfo.action = match2[1];
      return;
    }

    if (trimmed.startsWith('**Estimated Value:**')) {
      const match = trimmed.match(/\*\*Estimated Value:\*\*\s*(.*)/i);
      if (match) headerInfo.value = match[1];
      return;
    }

    if (trimmed.startsWith('**Inspector:**')) {
      const match = trimmed.match(/\*\*Inspector:\*\*\s*(.*)/i);
      if (match) headerInfo.inspector = match[1];
      return;
    }

    if (trimmed.startsWith('-')) {
      if (currentSection) {
        currentSection.items.push(trimmed.replace(/^-\s*/, ''));
      }
    } else {
      if (currentSection) {
        currentSection.items.push(trimmed);
      }
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF.');
    return;
  }

  const sectionsHtml = sections.map(sec => {
    const isMedia = sec.title.toLowerCase().includes('media') || sec.title.toLowerCase().includes('photo');
    
    let itemsHtml = '';
    if (isMedia) {
      const mediaList = sec.items.map(item => {
        const parts = item.split('**');
        if (parts.length >= 3) {
          const url = parts.slice(2).join('').trim().replace(/^:\s*/, '');
          const label = parts[1].replace(':', '');
          const isPdf = url.startsWith('data:application/pdf') || url.toLowerCase().includes('.pdf');
          if (isPdf) {
            return `<li style="display: inline-block; width: 140px; margin-right: 10px; margin-bottom: 10px; vertical-align: top; font-size: 11px;"><strong>${label}:</strong> PDF Document Attached</li>`;
          } else {
            return `<li style="display: inline-block; width: 140px; margin-right: 10px; margin-bottom: 10px; vertical-align: top; font-size: 11px;"><strong>${label}:</strong> <br/><img src="${getProxiedImageUrl(url)}" style="max-width: 130px; max-height: 100px; border-radius: 4px; margin-top: 5px; border: 1px solid #ddd; object-fit: cover;" /></li>`;
          }
        }
        return `<li style="display: inline-block; width: 140px; margin-right: 10px; margin-bottom: 10px; vertical-align: top; font-size: 11px;">${item}</li>`;
      }).join('');
      itemsHtml = `<ul style="list-style: none; padding: 0; margin: 0; display: block; font-size: 0;">${mediaList}</ul>`;
    } else {
      const listItems = sec.items.map(item => {
        const parts = item.split('**');
        if (parts.length >= 3) {
          return `<li style="font-size: 13px; margin-bottom: 6px; display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 3px;">
            <span style="color: #666; font-weight: 500;">${parts[1].replace(':', '')}</span>
            <span style="font-weight: 600; color: #111;">${parts.slice(2).join('').trim().replace(/^:\s*/, '')}</span>
          </li>`;
        }
        return `<li style="font-size: 13px; margin-bottom: 6px; color: #333;">${item}</li>`;
      }).join('');
      itemsHtml = `<ul style="list-style: none; padding: 0; margin: 0;">${listItems}</ul>`;
    }

    return `
      <div class="grid-item" style="background: #fafafa; border: 1px solid #e1e8f0; border-radius: 8px; padding: 15px; page-break-inside: avoid; break-inside: avoid;">
        <h4 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #e10613; border-bottom: 2px solid #e10613; padding-bottom: 4px; text-transform: uppercase;">
          ${sec.title}
        </h4>
        ${itemsHtml}
      </div>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Inspection_Report_${headerInfo.inspector ? headerInfo.inspector.replace(/\s+/g, '_') : 'Car'}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #111;
            margin: 0;
            padding: 40px;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #e10613;
            letter-spacing: -0.5px;
          }
          .logo-sub {
            color: #111;
          }
          .title {
            text-align: right;
            font-size: 16px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-box {
            background: #1e293b;
            color: #fff;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .meta-title {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
          }
          .meta-subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .badges {
            display: flex;
            gap: 8px;
          }
          .badge {
            font-size: 11px;
            font-weight: 750;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            color: #fff;
          }
          .badge.value { background: #e10613; }
          .badge.rating { background: #3b82f6; }
          .badge.action { background: #10b981; }
          
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
          }
          .footer-sig {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sig-line {
            width: 200px;
            border-top: 1.5px solid #000;
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
            font-weight: 600;
          }
          @media print {
            body {
              padding: 0;
            }
            .grid {
              display: block !important;
              font-size: 0 !important;
            }
            .grid-item {
              display: inline-block !important;
              width: 48% !important;
              vertical-align: top !important;
              margin-right: 4% !important;
              margin-bottom: 20px !important;
              font-size: 14px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .grid-item:nth-child(2n) {
              margin-right: 0 !important;
            }
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="logo">AUTO <span class="logo-sub">BOURN</span></div>
              <div style="font-size: 11px; color: #666; margin-top: 4px; font-weight: 500;">PREMIUM LUXURY CARS</div>
            </td>
            <td class="title">
              Vehicle Inspection Report
            </td>
          </tr>
        </table>

        <div class="meta-box">
          <div>
            <h3 class="meta-title">Used Car Evaluation Checklist</h3>
            <div class="meta-subtitle">Inspector: ${headerInfo.inspector || '—'}</div>
          </div>
          <div class="badges">
            <span class="badge value">Value: ${headerInfo.value || '—'}</span>
            <span class="badge rating">Rating: ${headerInfo.overall || '—'}</span>
            <span class="badge action">${headerInfo.action || '—'}</span>
          </div>
        </div>

        <div class="grid">
          ${sectionsHtml}
        </div>

        <div class="footer-sig">
          <div>
            <div style="font-size: 12px; color: #333; font-weight: 700;">AUTO BOURN MOTORS</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">Certified Pre-Owned Inspection Program</div>
          </div>
          <div class="sig-line">
            Inspector Signature
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const openPdf = (url: string) => {
  if (typeof window === 'undefined') return;
  if (url.startsWith('data:application/pdf')) {
    const pdfWindow = window.open("");
    if (pdfWindow) {
      pdfWindow.document.write(
        `<iframe width='100%' height='100%' src='${url}' style='border:0;position:fixed;top:0;left:0;right:0;bottom:0;'></iframe>`
      );
    }
  } else {
    window.open(url, '_blank');
  }
};

export const downloadLeadsPdf = (leads: any[], filterStatus: string, search: string) => {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF.');
    return;
  }

  const formatBudget = (n: number | null): string => {
    if (!n) return '—';
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };

  const statusLabels: Record<string, string> = {
    new: 'New Lead',
    contacted: 'Contacted',
    interested: 'Interested',
    follow_up_pending: 'Follow-up Pending',
    test_drive_scheduled: 'Test Drive Scheduled',
    negotiation: 'Negotiation',
    booking_done: 'Booking Done',
    sold: 'Sold',
    lost: 'Lost',
  };

  const statusColors: Record<string, string> = {
    new: '#6366f1',
    contacted: '#3b82f6',
    interested: '#06b6d4',
    follow_up_pending: '#f59e0b',
    test_drive_scheduled: '#8b5cf6',
    negotiation: '#ec4899',
    booking_done: '#22c55e',
    sold: '#E10613',
    lost: '#6b7280',
  };

  const tableRows = leads.map((lead, idx) => {
    const statusLabel = statusLabels[lead.lead_status] || lead.lead_status;
    const statusColor = statusColors[lead.lead_status] || '#111';
    const createdDate = new Date(lead.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const budgetStr = formatBudget(lead.budget);
    const assignedName = lead.assigned_employee?.name || 'Unassigned';

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #1e293b;">${lead.customer_name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${lead.phone}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #e10613;">${lead.interested_car || '—'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600;">${budgetStr}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${assignedName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; text-transform: uppercase;">
          <span style="color: ${statusColor}; background: ${statusColor}1A; padding: 4px 8px; border-radius: 4px; display: inline-block;">${statusLabel}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${createdDate}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Leads_Report_${new Date().toISOString().split('T')[0]}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #e10613;
            letter-spacing: -0.5px;
          }
          .logo-sub {
            color: #111;
          }
          .title {
            text-align: right;
            font-size: 16px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-box {
            background: #1e293b;
            color: #fff;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .meta-title {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
          }
          .meta-subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .badges {
            display: flex;
            gap: 8px;
          }
          .badge {
            font-size: 11px;
            font-weight: 750;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            color: #fff;
          }
          .badge.count { background: #e10613; }
          .badge.filter { background: #3b82f6; }
          
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .report-table th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          .footer-sig {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sig-line {
            width: 200px;
            border-top: 1.5px solid #000;
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="logo">AUTO <span class="logo-sub">BOURN</span></div>
              <div style="font-size: 11px; color: #666; margin-top: 4px; font-weight: 500;">PREMIUM LUXURY CARS</div>
            </td>
            <td class="title">
              CRM Leads Export Report
            </td>
          </tr>
        </table>

        <div class="meta-box">
          <div>
            <h3 class="meta-title">Customer Lead Management Summary</h3>
            <div class="meta-subtitle">Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="badges">
            <span class="badge count">Leads Count: ${leads.length}</span>
            <span class="badge filter">Status: ${filterStatus.toUpperCase()}</span>
            ${search ? `<span class="badge" style="background: #eab308; color: #1e293b;">Search: "${search}"</span>` : ''}
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">S.No</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Interested Car</th>
              <th>Budget</th>
              <th>Assigned To</th>
              <th>Status</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No leads matching filters</td></tr>'}
          </tbody>
        </table>

        <div class="footer-sig">
          <div>
            <div style="font-size: 12px; color: #333; font-weight: 700;">AUTO BOURN MOTORS</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">CRM Lead System Registry Report</div>
          </div>
          <div class="sig-line">
            Manager Signature
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const downloadMissedFollowUpsPdf = (followUps: any[]) => {
  if (typeof window === 'undefined') return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download/print the PDF.');
    return;
  }

  const priorityColors: Record<string, string> = {
    high: '#EF4444',
    normal: '#3B82F6',
    low: '#64748B',
  };

  const typeLabels: Record<string, string> = {
    call: 'Call',
    whatsapp: 'WhatsApp',
    sms: 'SMS',
    meeting: 'Meeting',
    test_drive: 'Test Drive',
    email: 'Email',
  };

  const tableRows = followUps.map((fu, idx) => {
    const lead = fu.lead || {};
    const empName = fu.employee?.name || 'Unassigned';
    const dt = new Date(fu.scheduled_at);
    const scheduledDate = dt.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const scheduledTime = dt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const typeLabel = typeLabels[fu.follow_up_type] || fu.follow_up_type;
    const priorityColor = priorityColors[fu.priority?.toLowerCase()] || '#64748B';

    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 700; color: #1e293b;">
          ${lead.customer_name || 'Unknown'}
          <div style="font-size: 10px; color: #64748b; font-weight: 400; margin-top: 2px;">${lead.phone || '—'}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 600; color: #e10613;">${lead.interested_car || '—'}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">
          ${scheduledDate}
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${scheduledTime}</div>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569;">${empName}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 700; text-transform: uppercase;">
          <span style="color: ${priorityColor}; background: ${priorityColor}1A; padding: 4px 8px; border-radius: 4px; display: inline-block;">${fu.priority || 'Normal'}</span>
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569; font-weight: 500;">${typeLabel}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #475569; font-style: italic; max-width: 200px; word-wrap: break-word;">${fu.notes || '—'}</td>
      </tr>
    `;
  }).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Missed_FollowUps_Report_${new Date().toISOString().split('T')[0]}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 40px;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 26px;
            font-weight: 800;
            color: #e10613;
            letter-spacing: -0.5px;
          }
          .logo-sub {
            color: #111;
          }
          .title {
            text-align: right;
            font-size: 16px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .meta-box {
            background: #1e293b;
            color: #fff;
            border-radius: 8px;
            padding: 15px 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .meta-title {
            font-size: 18px;
            font-weight: 800;
            margin: 0;
          }
          .meta-subtitle {
            font-size: 12px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .badges {
            display: flex;
            gap: 8px;
          }
          .badge {
            font-size: 11px;
            font-weight: 750;
            padding: 4px 10px;
            border-radius: 4px;
            text-transform: uppercase;
            color: #fff;
          }
          .badge.count { background: #e10613; }
          .badge.status { background: #ef4444; }
          
          .report-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }
          .report-table th {
            background: #f8fafc;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 12px 10px;
            border-bottom: 2px solid #cbd5e1;
            text-align: left;
          }
          .footer-sig {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          .sig-line {
            width: 200px;
            border-top: 1.5px solid #000;
            margin-top: 60px;
            text-align: center;
            font-size: 12px;
            color: #666;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td>
              <div class="logo">AUTO <span class="logo-sub">BOURN</span></div>
              <div style="font-size: 11px; color: #666; margin-top: 4px; font-weight: 500;">PREMIUM LUXURY CARS</div>
            </td>
            <td class="title">
              CRM Missed Follow-ups Report
            </td>
          </tr>
        </table>

        <div class="meta-box">
          <div>
            <h3 class="meta-title">Missed & Overdue Customer Follow-ups</h3>
            <div class="meta-subtitle">Generated on: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div class="badges">
            <span class="badge count">Overdue Count: ${followUps.length}</span>
            <span class="badge status">Status: MISSED</span>
          </div>
        </div>

        <table class="report-table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">S.No</th>
              <th>Customer</th>
              <th>Interested Car</th>
              <th>Scheduled Time</th>
              <th>Assigned Consultant</th>
              <th>Priority</th>
              <th>Channel</th>
              <th>Notes / Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #64748b;">No missed follow-ups found</td></tr>'}
          </tbody>
        </table>

        <div class="footer-sig">
          <div>
            <div style="font-size: 12px; color: #333; font-weight: 700;">AUTO BOURN MOTORS</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">CRM Overdue Follow-ups Registry</div>
          </div>
          <div class="sig-line">
            Manager Signature
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
