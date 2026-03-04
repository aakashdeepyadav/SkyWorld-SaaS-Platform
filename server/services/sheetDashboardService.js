import { google } from 'googleapis';
import { logger } from '../utils/logger.js';

// ─── Auth ────────────────────────────────────────────────────────────────────

const getSheetsClient = () => {
  const raw = process.env.GOOGLE_PRIVATE_KEY;
  if (!raw) throw new Error('GOOGLE_PRIVATE_KEY not set');
  let credentials;
  const trimmed = raw.trim();
  if (trimmed.startsWith('{')) {
    credentials = JSON.parse(trimmed);
  } else {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'auto-meet@meeting-489120.iam.gserviceaccount.com';
    credentials = { client_email: email, private_key: trimmed.replace(/\\n/g, '\n') };
  }
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
};

// ─── Colors (RGBA 0-1) ──────────────────────────────────────────────────────

const rgb = (r, g, b) => ({ red: r / 255, green: g / 255, blue: b / 255 });

const C = {
  dark:      rgb(15, 23, 42),
  primary:   rgb(14, 165, 233),
  green:     rgb(34, 197, 94),
  amber:     rgb(245, 158, 11),
  violet:    rgb(139, 92, 246),
  white:     rgb(255, 255, 255),
  offWhite:  rgb(248, 250, 252),
  lightBlue: rgb(240, 249, 255),
  lightGray: rgb(241, 245, 249),
  gray:      rgb(100, 116, 139),
  textDark:  rgb(15, 23, 42),
};

// ─── Formula Helpers ─────────────────────────────────────────────────────────

const DA = "'DailyAnalytics'";
const LR = `COUNTA(${DA}!A:A)`;

const last = (col) => `=IFERROR(INDEX(${DA}!${col}:${col},${LR}),"")`;
const mthSum = (col) =>
  `=SUMPRODUCT((LEFT(${DA}!A$2:A$9999,7)=TEXT(TODAY(),"YYYY-MM"))*${DA}!${col}$2:${col}$9999)`;
const allSum = (col) => `=SUM(${DA}!${col}$2:${col})`;

// ─── Formatting Helper ───────────────────────────────────────────────────────

const fmtCell = (sheetId, r1, r2, c1, c2, format) => ({
  repeatCell: {
    range: { sheetId, startRowIndex: r1, endRowIndex: r2, startColumnIndex: c1, endColumnIndex: c2 },
    cell: { userEnteredFormat: format },
    fields: 'userEnteredFormat',
  },
});

const colWidth = (sheetId, c1, c2, px) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: 'COLUMNS', startIndex: c1, endIndex: c2 },
    properties: { pixelSize: px },
    fields: 'pixelSize',
  },
});

const rowHeight = (sheetId, r1, r2, px) => ({
  updateDimensionProperties: {
    range: { sheetId, dimension: 'ROWS', startIndex: r1, endIndex: r2 },
    properties: { pixelSize: px },
    fields: 'pixelSize',
  },
});

// ─── Chart Builder ───────────────────────────────────────────────────────────

const lineChart = (title, sheetId, anchorSheetId, anchorRow, anchorCol, dataSheetId, xCol, yCol, color, type = 'LINE') => ({
  addChart: {
    chart: {
      spec: {
        title,
        titleTextFormat: { fontSize: 11, bold: true },
        basicChart: {
          chartType: type,
          legendPosition: 'NO_LEGEND',
          ...(type === 'LINE' ? { lineSmoothing: true } : {}),
          axis: [
            { position: 'BOTTOM_AXIS' },
            { position: 'LEFT_AXIS' },
          ],
          domains: [{
            domain: {
              sourceRange: {
                sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: 10000, startColumnIndex: xCol, endColumnIndex: xCol + 1 }],
              },
            },
          }],
          series: [{
            series: {
              sourceRange: {
                sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: 10000, startColumnIndex: yCol, endColumnIndex: yCol + 1 }],
              },
            },
            targetAxis: 'LEFT_AXIS',
            color,
          }],
          headerCount: 1,
        },
      },
      position: {
        overlayPosition: {
          anchorCell: { sheetId: anchorSheetId, rowIndex: anchorRow, columnIndex: anchorCol },
          widthPixels: 530,
          heightPixels: 310,
        },
      },
    },
  },
});

const stackedChart = (title, anchorSheetId, anchorRow, anchorCol, dataSheetId, xCol, yCols, colors) => ({
  addChart: {
    chart: {
      spec: {
        title,
        titleTextFormat: { fontSize: 11, bold: true },
        basicChart: {
          chartType: 'COLUMN',
          legendPosition: 'BOTTOM_LEGEND',
          stackedType: 'STACKED',
          axis: [
            { position: 'BOTTOM_AXIS' },
            { position: 'LEFT_AXIS' },
          ],
          domains: [{
            domain: {
              sourceRange: {
                sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: 10000, startColumnIndex: xCol, endColumnIndex: xCol + 1 }],
              },
            },
          }],
          series: yCols.map((col, i) => ({
            series: {
              sourceRange: {
                sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: 10000, startColumnIndex: col, endColumnIndex: col + 1 }],
              },
            },
            targetAxis: 'LEFT_AXIS',
            color: colors[i],
          })),
          headerCount: 1,
        },
      },
      position: {
        overlayPosition: {
          anchorCell: { sheetId: anchorSheetId, rowIndex: anchorRow, columnIndex: anchorCol },
          widthPixels: 530,
          heightPixels: 310,
        },
      },
    },
  },
});

const comboChart = (title, anchorSheetId, anchorRow, anchorCol, dataSheetId, xCol, barCol, lineCol, maxRow) => ({
  addChart: {
    chart: {
      spec: {
        title,
        titleTextFormat: { fontSize: 11, bold: true },
        basicChart: {
          chartType: 'COMBO',
          legendPosition: 'BOTTOM_LEGEND',
          axis: [
            { position: 'BOTTOM_AXIS' },
            { position: 'LEFT_AXIS', title: 'Revenue (₹)' },
            { position: 'RIGHT_AXIS', title: 'Meetings' },
          ],
          domains: [{
            domain: {
              sourceRange: {
                sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: maxRow, startColumnIndex: xCol, endColumnIndex: xCol + 1 }],
              },
            },
          }],
          series: [
            {
              series: {
                sourceRange: {
                  sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: maxRow, startColumnIndex: barCol, endColumnIndex: barCol + 1 }],
                },
              },
              targetAxis: 'LEFT_AXIS',
              type: 'COLUMN',
              color: C.green,
            },
            {
              series: {
                sourceRange: {
                  sources: [{ sheetId: dataSheetId, startRowIndex: 0, endRowIndex: maxRow, startColumnIndex: lineCol, endColumnIndex: lineCol + 1 }],
                },
              },
              targetAxis: 'RIGHT_AXIS',
              type: 'LINE',
              color: C.primary,
            },
          ],
          headerCount: 1,
        },
      },
      position: {
        overlayPosition: {
          anchorCell: { sheetId: anchorSheetId, rowIndex: anchorRow, columnIndex: anchorCol },
          widthPixels: 900,
          heightPixels: 360,
        },
      },
    },
  },
});

// ═════════════════════════════════════════════════════════════════════════════
// ══ MAIN SETUP ══════════════════════════════════════════════════════════════
// ═════════════════════════════════════════════════════════════════════════════

export const setupSpreadsheetDashboard = async () => {
  const spreadsheetId = process.env.GOOGLE_ANALYTICS_SHEET_ID || process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) throw new Error('No analytics spreadsheet ID configured');

  const sheets = getSheetsClient();
  logger.info('Setting up spreadsheet dashboard...');

  // ── 1. Metadata ────────────────────────────────────────────────────────────

  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets(properties,charts)',
  });
  const sheetsList = meta.data.sheets || [];
  const find = (name) => sheetsList.find((s) => s.properties.title === name);

  const dailySheet = find('DailyAnalytics');
  if (!dailySheet) throw new Error('DailyAnalytics tab not found — export data first.');
  const dailyId = dailySheet.properties.sheetId;

  // ── 2. Create / reset tabs ────────────────────────────────────────────────

  const prep = [];
  let dashId, monthlyId;

  const existDash = find('Dashboard');
  if (existDash) {
    dashId = existDash.properties.sheetId;
    (existDash.charts || []).forEach((ch) =>
      prep.push({ deleteEmbeddedObject: { objectId: ch.chartId } }),
    );
    prep.push({
      updateCells: { range: { sheetId: dashId }, fields: 'userEnteredValue,userEnteredFormat' },
    });
  } else {
    prep.push({ addSheet: { properties: { title: 'Dashboard', index: 0 } } });
  }

  const existMonthly = find('Monthly Summary');
  if (existMonthly) {
    monthlyId = existMonthly.properties.sheetId;
    (existMonthly.charts || []).forEach((ch) =>
      prep.push({ deleteEmbeddedObject: { objectId: ch.chartId } }),
    );
    prep.push({
      updateCells: { range: { sheetId: monthlyId }, fields: 'userEnteredValue,userEnteredFormat' },
    });
  } else {
    prep.push({ addSheet: { properties: { title: 'Monthly Summary', index: 1 } } });
  }

  if (prep.length) {
    const result = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: prep },
    });
    // Extract auto-assigned sheet IDs for newly created tabs
    (result.data.replies || []).forEach((reply) => {
      if (reply.addSheet) {
        const t = reply.addSheet.properties.title;
        const id = reply.addSheet.properties.sheetId;
        if (t === 'Dashboard') dashId = id;
        if (t === 'Monthly Summary') monthlyId = id;
      }
    });
  }

  // ── 3. Dashboard values & formulas ─────────────────────────────────────────

  const emailsLast = `=IFERROR(INDEX(${DA}!K:K,${LR})+INDEX(${DA}!M:M,${LR}),"")`;
  const reqsLast = `=IFERROR(INDEX(${DA}!S:S,${LR})+INDEX(${DA}!T:T,${LR}),"")`;
  const emailsMth = `=SUMPRODUCT((LEFT(${DA}!A$2:A$9999,7)=TEXT(TODAY(),"YYYY-MM"))*(${DA}!K$2:K$9999+${DA}!M$2:M$9999))`;
  const reqsMth = `=SUMPRODUCT((LEFT(${DA}!A$2:A$9999,7)=TEXT(TODAY(),"YYYY-MM"))*(${DA}!S$2:S$9999+${DA}!T$2:T$9999))`;
  const daysMth = `=COUNTIF(ARRAYFORMULA(LEFT(${DA}!A$2:A$9999,7)),TEXT(TODAY(),"YYYY-MM"))`;
  const emailsAll = `=SUM(${DA}!K$2:K)+SUM(${DA}!M$2:M)`;
  const reqsAll = `=SUM(${DA}!S$2:S)+SUM(${DA}!T$2:T)`;
  const daysAll = `=COUNTA(${DA}!A$2:A)`;
  const uptime = `=IFERROR(IF(INDEX(${DA}!O:O,${LR})="up","✓ ","✗ ")&INDEX(${DA}!O:O,${LR})&"  ·  "&IF(INDEX(${DA}!P:P,${LR})="up","✓ ","✗ ")&INDEX(${DA}!P:P,${LR}),"—")`;

  const dashValues = [
    /* 1  */ ['SKYWORLD VENTURES'],
    /* 2  */ ['Analytics Dashboard'],
    /* 3  */ [`="Last snapshot:  "&TEXT(IFERROR(INDEX(${DA}!A:A,${LR}),"—"),"YYYY-MM-DD")`],
    /* 4  */ [],
    /* 5  */ ['  LATEST SNAPSHOT'],
    /* 6  */ ['Meetings', 'Payments', 'Revenue (₹)', 'Emails Sent', 'Requests', 'New Users', 'Active Projects', 'System Status'],
    /* 7  */ [last('B'), last('F'), last('J'), emailsLast, reqsLast, last('V'), last('U'), uptime],
    /* 8  */ [],
    /* 9  */ ['  THIS MONTH'],
    /* 10 */ ['Meetings', 'Payments', 'Revenue (₹)', 'Emails Sent', 'Requests', 'New Users', 'Days Tracked', ''],
    /* 11 */ [mthSum('B'), mthSum('F'), mthSum('J'), emailsMth, reqsMth, mthSum('V'), daysMth, ''],
    /* 12 */ [],
    /* 13 */ ['  ALL TIME'],
    /* 14 */ ['Total Meetings', 'Total Payments', 'Total Revenue', 'Total Emails', 'Total Requests', 'Total New Users', 'Days Tracked', ''],
    /* 15 */ [allSum('B'), allSum('F'), allSum('J'), emailsAll, reqsAll, allSum('V'), daysAll, ''],
    /* 16 */ [],
    /* 17 */ ['  SYSTEM HEALTH (Latest)'],
    /* 18 */ ['Backend', 'Frontend', 'Database', 'Google OAuth'],
    /* 19 */ [last('O'), last('P'), last('Q'), last('R')],
    /* 20 */ [],
    /* 21 */ ['  DAILY TRENDS'],
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Dashboard!A1:H21',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: dashValues },
  });

  // ── 4. Monthly Summary values ──────────────────────────────────────────────

  const monthlyValues = [
    ['Month', 'Meetings', 'Payments', 'Revenue (₹)', 'Emails Sent', 'Requests', 'New Users', 'Days Tracked', 'Avg Daily Revenue'],
  ];

  for (let i = 0; i < 12; i++) {
    const monthsAgo = 11 - i; // ascending: oldest first → current month last
    const r = i + 2;
    monthlyValues.push([
      `=TEXT(EDATE(TODAY(),-${monthsAgo}),"YYYY-MM")`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*${DA}!$B$2:$B$9999)`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*${DA}!$F$2:$F$9999)`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*${DA}!$J$2:$J$9999)`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*(${DA}!$K$2:$K$9999+${DA}!$M$2:$M$9999))`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*(${DA}!$S$2:$S$9999+${DA}!$T$2:$T$9999))`,
      `=SUMPRODUCT((LEFT(${DA}!$A$2:$A$9999,7)=$A${r})*${DA}!$V$2:$V$9999)`,
      `=COUNTIF(ARRAYFORMULA(LEFT(${DA}!$A$2:$A$9999,7)),$A${r})`,
      `=IF(H${r}>0,D${r}/H${r},0)`,
    ]);
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "'Monthly Summary'!A1:I13",
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: monthlyValues },
  });

  // ── 5. Formatting + Charts ─────────────────────────────────────────────────

  const fmt = [];

  // ▸ Merge section header rows on Dashboard
  [0, 1, 2, 4, 8, 12, 16, 20].forEach((r) => {
    fmt.push({
      mergeCells: {
        range: { sheetId: dashId, startRowIndex: r, endRowIndex: r + 1, startColumnIndex: 0, endColumnIndex: 8 },
        mergeType: 'MERGE_ALL',
      },
    });
  });

  // ▸ Dashboard header band (rows 1-3)
  fmt.push(fmtCell(dashId, 0, 1, 0, 8, {
    backgroundColor: C.dark,
    textFormat: { foregroundColor: C.white, bold: true, fontSize: 16 },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
  }));
  fmt.push(fmtCell(dashId, 1, 2, 0, 8, {
    backgroundColor: C.dark,
    textFormat: { foregroundColor: C.lightGray, fontSize: 11 },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
  }));
  fmt.push(fmtCell(dashId, 2, 3, 0, 8, {
    backgroundColor: C.lightBlue,
    textFormat: { foregroundColor: C.gray, fontSize: 10 },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
  }));

  // ▸ Section headers (primary blue bg)
  [4, 8, 12, 16, 20].forEach((r) => {
    fmt.push(fmtCell(dashId, r, r + 1, 0, 8, {
      backgroundColor: C.primary,
      textFormat: { foregroundColor: C.white, bold: true, fontSize: 11 },
      horizontalAlignment: 'LEFT',
      verticalAlignment: 'MIDDLE',
    }));
  });

  // ▸ Label rows (light gray bg, small caps style)
  [5, 9, 13, 17].forEach((r) => {
    fmt.push(fmtCell(dashId, r, r + 1, 0, 8, {
      backgroundColor: C.lightGray,
      textFormat: { foregroundColor: C.gray, bold: true, fontSize: 9 },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    }));
  });

  // ▸ Value rows (large bold numbers)
  [6, 10, 14, 18].forEach((r) => {
    fmt.push(fmtCell(dashId, r, r + 1, 0, 8, {
      backgroundColor: C.white,
      textFormat: { foregroundColor: C.textDark, bold: true, fontSize: 14 },
      horizontalAlignment: 'CENTER',
      verticalAlignment: 'MIDDLE',
    }));
  });

  // ▸ Revenue cells green (col C = index 2, rows 7/11/15)
  [6, 10, 14].forEach((r) => {
    fmt.push(fmtCell(dashId, r, r + 1, 2, 3, {
      textFormat: { foregroundColor: C.green, bold: true, fontSize: 14 },
      numberFormat: { type: 'CURRENCY', pattern: '₹#,##0' },
      horizontalAlignment: 'CENTER',
    }));
  });

  // ▸ Column widths
  fmt.push(colWidth(dashId, 0, 8, 140));
  fmt.push(colWidth(monthlyId, 0, 1, 100));
  fmt.push(colWidth(monthlyId, 1, 9, 115));

  // ▸ Row heights
  fmt.push(rowHeight(dashId, 0, 1, 50));
  fmt.push(rowHeight(dashId, 1, 2, 32));
  [4, 8, 12, 16, 20].forEach((r) => fmt.push(rowHeight(dashId, r, r + 1, 34)));
  [6, 10, 14, 18].forEach((r) => fmt.push(rowHeight(dashId, r, r + 1, 42)));

  // ▸ Tab colors
  fmt.push({
    updateSheetProperties: {
      properties: { sheetId: dashId, tabColorStyle: { rgbColor: C.primary } },
      fields: 'tabColorStyle',
    },
  });
  fmt.push({
    updateSheetProperties: {
      properties: { sheetId: monthlyId, tabColorStyle: { rgbColor: C.green } },
      fields: 'tabColorStyle',
    },
  });

  // ▸ Monthly Summary header row
  fmt.push(fmtCell(monthlyId, 0, 1, 0, 9, {
    backgroundColor: C.dark,
    textFormat: { foregroundColor: C.white, bold: true, fontSize: 10 },
    horizontalAlignment: 'CENTER',
    verticalAlignment: 'MIDDLE',
  }));

  // ▸ Monthly data rows (alternating)
  for (let i = 1; i <= 12; i++) {
    const bg = i % 2 === 0 ? C.offWhite : C.white;
    fmt.push(fmtCell(monthlyId, i, i + 1, 0, 9, {
      backgroundColor: bg,
      textFormat: { fontSize: 10 },
      horizontalAlignment: 'CENTER',
    }));
  }

  // ▸ Monthly revenue col (D = index 3) green
  fmt.push(fmtCell(monthlyId, 1, 13, 3, 4, {
    textFormat: { foregroundColor: C.green, bold: true, fontSize: 10 },
    numberFormat: { type: 'CURRENCY', pattern: '₹#,##0' },
    horizontalAlignment: 'CENTER',
  }));

  // ▸ Monthly avg daily revenue col (I = index 8) blue
  fmt.push(fmtCell(monthlyId, 1, 13, 8, 9, {
    textFormat: { foregroundColor: C.primary, bold: true, fontSize: 10 },
    numberFormat: { type: 'CURRENCY', pattern: '₹#,##0' },
    horizontalAlignment: 'CENTER',
  }));

  // ▸ Monthly header row height
  fmt.push(rowHeight(monthlyId, 0, 1, 34));

  // ▸ Conditional formatting for health cells (Dashboard row 19 = index 18)
  const healthRange = { sheetId: dashId, startRowIndex: 18, endRowIndex: 19, startColumnIndex: 0, endColumnIndex: 4 };
  [
    { val: 'up', color: C.green },
    { val: 'connected', color: C.green },
    { val: 'down', color: { red: 0.94, green: 0.27, blue: 0.27 } },
    { val: 'disconnected', color: { red: 0.94, green: 0.27, blue: 0.27 } },
    { val: 'degraded', color: C.amber },
  ].forEach(({ val, color }, idx) => {
    fmt.push({
      addConditionalFormatRule: {
        rule: {
          ranges: [healthRange],
          booleanRule: {
            condition: { type: 'TEXT_EQ', values: [{ userEnteredValue: val }] },
            format: { textFormat: { foregroundColor: color, bold: true } },
          },
        },
        index: idx,
      },
    });
  });

  // ▸ Freeze header row on DailyAnalytics
  fmt.push({
    updateSheetProperties: {
      properties: { sheetId: dailyId, gridProperties: { frozenRowCount: 1 } },
      fields: 'gridProperties.frozenRowCount',
    },
  });

  // ── Charts on Dashboard ────────────────────────────────────────────────────
  // DailyAnalytics columns: A=0(Date), B=1(Meetings), J=9(Revenue), K=10(Brevo), M=12(Resend), V=21(NewUsers)

  // Chart 1: Daily Meetings (Line) — top-left
  fmt.push(lineChart('Daily Meetings', dailyId, dashId, 22, 0, dailyId, 0, 1, C.primary, 'LINE'));

  // Chart 2: Daily Revenue (Area) — top-right
  fmt.push(lineChart('Daily Revenue (₹)', dailyId, dashId, 22, 4, dailyId, 0, 9, C.green, 'AREA'));

  // Chart 3: Email Usage (Stacked Column) — bottom-left
  fmt.push(stackedChart('Email Usage (Brevo + Resend)', dashId, 42, 0, dailyId, 0, [10, 12], [C.primary, C.violet]));

  // Chart 4: New Users (Column) — bottom-right
  fmt.push(lineChart('New Users', dailyId, dashId, 42, 4, dailyId, 0, 21, C.amber, 'COLUMN'));

  // ── Chart on Monthly Summary ───────────────────────────────────────────────
  // Monthly Summary columns: A=0(Month), B=1(Meetings), D=3(Revenue)

  fmt.push(comboChart('Monthly Performance — Revenue & Meetings', monthlyId, 15, 0, monthlyId, 0, 3, 1, 13));

  // ── Execute all formatting + charts ────────────────────────────────────────

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: fmt },
  });

  // ── Add basic filter on DailyAnalytics ─────────────────────────────────────

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          setBasicFilter: {
            filter: {
              range: { sheetId: dailyId, startRowIndex: 0, endRowIndex: 10000, startColumnIndex: 0, endColumnIndex: 22 },
            },
          },
        }],
      },
    });
  } catch (err) {
    logger.warn('DailyAnalytics filter setup skipped:', err.message);
  }

  logger.info('Spreadsheet dashboard setup complete ✓');
  return { success: true, message: 'Sheet dashboard created with Dashboard, Monthly Summary, charts & filters' };
};
