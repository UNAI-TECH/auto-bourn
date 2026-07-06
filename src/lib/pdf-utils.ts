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
