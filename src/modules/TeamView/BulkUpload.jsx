import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import Pill from '../../components/Pill.jsx'

// Excel parser is large (~500KB). We dynamically import it the first time
// the user uploads an .xlsx file or clicks "Download Excel template" so it
// doesn't bloat the initial page load.
let xlsxLib = null
async function getXlsx() {
  if (!xlsxLib) xlsxLib = await import('xlsx')
  return xlsxLib
}

// ─────────────────────────────────────────────────────────────────────────────
// USER TEMPLATE
//
// Hierarchy is captured by two columns:
//   Manager Email — the user's direct manager (the chain is built by matching
//                   this field to another row's Email)
//   Line          — L1..L6 levels defined by the customer's org chart
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_HEADERS = [
  'User ID',
  'User Name',
  'Role',
  'Email',
  'Job Title',
  'Manager Name',
  'Manager Email',
  'Country',
  'Region',
  'City',
  'Line',
  'Phone',
]

const TEMPLATE_SAMPLE_ROWS = [
  ['', 'Mariam Al Director', 'admin',   'md@avanza.health',         'Managing Director',       '',                      '',                          'UAE', 'Western',  'Jeddah', 'L1', '+971 50 000 0001'],
  ['', 'Tarek Oncology',     'manager', 'bu.onco@avanza.health',    'Business Unit Head',      'Mariam Al Director',    'md@avanza.health',          'UAE', 'Eastern',  'Riyadh', 'L2', '+971 50 000 0002'],
  ['', 'Rana Al Sales',      'manager', 'sales.onco@avanza.health', 'National Sales Manager',  'Tarek Oncology',        'bu.onco@avanza.health',     'UAE', 'Central',  'Makkah', 'L3', '+971 50 000 0003'],
  ['', 'Fadi Saleh',         'manager', 'fadi.mgr@avanza.health',   'District Sales Manager',  'Rana Al Sales',         'sales.onco@avanza.health',  'UAE', 'Southern', 'Abha',   'L4', '+971 50 000 0004'],
  ['', 'Omar Khalifa',       'learner', 'omar.rep@avanza.health',   'Medical Rep',             'Fadi Saleh',            'fadi.mgr@avanza.health',    'UAE', '',         '',       'L6', '+971 50 555 0100'],
  ['', 'Sara Najjar',        'learner', 'sara.msl@avanza.health',   'MSL',                     'Rana Al Sales',         'sales.onco@avanza.health',  'UAE', '',         '',       'L5', '+971 50 555 0101'],
]

const VALID_LINES = ['L1', 'L2', 'L3', 'L4', 'L5', 'L6']

// Header aliases — every accepted variant maps to one canonical column.
// Comparison is normalized (lowercase, no spaces / punctuation / dashes /
// underscores) so "Manager E-mail", "manager_email", "MANAGER EMAIL" all
// resolve to "Manager Email".
const HEADER_ALIASES = {
  'User ID':       ['user id', 'userid', 'employee id', 'empid', 'emp id', 'staff id', 'id'],
  'User Name':     ['user name', 'username', 'name', 'full name', 'fullname', 'employee name'],
  'Role':          ['role', 'user role', 'access role', 'access level', 'system role'],
  'Email':         ['email', 'e-mail', 'email address', 'mail', 'work email', 'corporate email'],
  'Job Title':     ['job title', 'jobtitle', 'title', 'position', 'designation'],
  'Manager Name':  ['manager name', 'manager', 'reports to', 'reportsto', 'line manager', 'supervisor'],
  'Manager Email': ['manager email', 'manageremail', 'manager e-mail', 'reports to email', 'supervisor email'],
  'Country':       ['country'],
  'Region':        ['region', 'territory', 'area'],
  'City':          ['city', 'town', 'location'],
  'Line':          ['line', 'level', 'seniority', 'grade', 'tier', 'l'],
  'Phone':         ['phone', 'phone number', 'phonenumber', 'mobile', 'mobile number', 'cell', 'tel', 'telephone', 'contact'],
}

function normalizeHeader(s) {
  return String(s || '').toLowerCase().replace(/[\s_\-./]+/g, '').trim()
}

const ALIAS_LOOKUP = (() => {
  const map = new Map()
  for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
    for (const alias of aliases) map.set(normalizeHeader(alias), canonical)
    map.set(normalizeHeader(canonical), canonical)
  }
  return map
})()

// Map a detected header to its canonical form, or null if unrecognized.
function canonicalize(header) {
  return ALIAS_LOOKUP.get(normalizeHeader(header)) || null
}

function escapeCSV(cell) {
  if (cell === null || cell === undefined) return ''
  const s = String(cell)
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function buildCSV(rows) {
  return rows.map((r) => r.map(escapeCSV).join(',')).join('\r\n')
}

function downloadFile(content, filename, mime) {
  const blob = new Blob(['﻿' + content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function downloadTemplate() {
  const csv = buildCSV([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE_ROWS])
  downloadFile(csv, 'avanza-users-template.csv', 'text/csv;charset=utf-8')
}

// Excel template — admins comfortable with spreadsheets get a real .xlsx
// file with the headers in row 1 and sample rows below, ready to fill in.
export async function downloadExcelTemplate() {
  const XLSX = await getXlsx()
  const ws = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...TEMPLATE_SAMPLE_ROWS])
  // Auto-size columns based on header length so headers are readable
  ws['!cols'] = TEMPLATE_HEADERS.map((h) => ({ wch: Math.max(12, h.length + 2) }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Users')
  XLSX.writeFile(wb, 'avanza-users-template.xlsx')
}

// Parse an Excel workbook (xlsx/xls) into the same { headers, rows } shape
// the rest of the pipeline expects — same as parseDelimited returns for CSV.
//
// Auto-detects the header row: scans the first 10 rows and picks the one
// with the highest number of recognizable headers (so files with a
// title/note row above the actual headers still parse).
async function parseExcel(arrayBuffer) {
  const XLSX = await getXlsx()
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  if (!wb.SheetNames.length) return { headers: [], rows: [], rawHeaders: [] }
  const ws = wb.Sheets[wb.SheetNames[0]]  // first sheet only
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false })
  if (matrix.length < 2) return { headers: [], rows: [], rawHeaders: [] }

  // Find the row that looks most like a header row (most cells canonicalize)
  let bestIdx = 0, bestScore = -1
  const scanLimit = Math.min(matrix.length, 10)
  for (let i = 0; i < scanLimit; i++) {
    const score = matrix[i].reduce((acc, cell) => acc + (canonicalize(cell) ? 1 : 0), 0)
    if (score > bestScore) { bestScore = score; bestIdx = i }
  }

  const rawHeaders = matrix[bestIdx].map((h) => String(h || '').trim())
  const headers = rawHeaders.map((h) => canonicalize(h) || h)
  const rows = matrix.slice(bestIdx + 1)
    .filter((r) => r.some((cell) => String(cell ?? '').trim() !== ''))
    .map((cells) => {
      const obj = {}
      headers.forEach((h, i) => { obj[h] = String(cells[i] ?? '').trim() })
      return obj
    })
  return { headers, rows, rawHeaders }
}

function parseCSVLine(line) {
  const cells = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++ }
      else if (c === '"') { inQuotes = false }
      else cur += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { cells.push(cur); cur = '' }
      else cur += c
    }
  }
  cells.push(cur)
  return cells
}

function parseTSVLine(line) {
  return line.split('\t')
}

function parseDelimited(text) {
  // Accept both CSV (comma) and TSV (tab) — auto-detected per file.
  const clean = text.replace(/^﻿/, '').replace(/^﻿/, '')
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return { headers: [], rows: [], rawHeaders: [] }
  const isTSV = lines[0].split('\t').length > lines[0].split(',').length
  const parseLine = isTSV ? parseTSVLine : parseCSVLine
  const rawHeaders = parseLine(lines[0]).map((h) => h.trim())
  // Convert each detected header to its canonical form (or keep the raw
  // header when no alias matches, so the user can still see what came in).
  const headers = rawHeaders.map((h) => canonicalize(h) || h)
  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line)
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (cells[i] ?? '').trim() })
    return obj
  })
  return { headers, rows, rawHeaders }
}

// Business-role → system-role mapper. Accepts loose values like "Rep",
// "Sales Rep", "Medical Rep", "MR", "MSL", "KAM", "DM", "District Manager",
// "BU Manager", "Marketing", "L&D", etc. and routes them to the four
// system roles the LMS recognizes.
function mapRole(raw) {
  const v = String(raw || '').toLowerCase().replace(/[\s_\-./]+/g, '').trim()
  if (!v) return 'learner'
  // Exact system-role passthrough
  if (['admin', 'manager', 'learner', 'auditor'].includes(v)) return v
  // Admin
  if (/^(admin|administrator|owner|superadmin|landdirector|landmanager)$/.test(v)) return 'admin'
  // Auditor
  if (/^(auditor|compliance|qa|qc)$/.test(v)) return 'auditor'
  // Manager
  if (/^(.*manager.*|dm|districtmanager|rsm|regionalsalesmanager|nsm|nationalsalesmanager|bumanager|bumanger|busin?essunitmanager|bum|head)$/.test(v)) return 'manager'
  // Default: everyone else is a learner (reps, MSLs, KAMs, marketing, etc.)
  return 'learner'
}

// Line normalizer — accepts "L2", "L 2", "Level 2", "L2(CNS)", "L3 OTC"
// and returns canonical "L1".."L6". Returns '' for unparseable values.
function normalizeLine(raw) {
  const m = String(raw || '').toUpperCase().match(/L\s*([1-6])/)
  return m ? `L${m[1]}` : ''
}

function rowToRecord(r) {
  const rawRole = r['Role'] || ''
  return {
    userId:        r['User ID']      || '',
    name:          r['User Name']    || r['Name']  || '',
    role:          mapRole(rawRole),
    roleRaw:       rawRole,                         // preserved for category coloring
    email:         r['Email']        || '',
    jobTitle:      r['Job Title']    || '',
    managerName:   r['Manager Name'] || '',
    managerEmail:  r['Manager Email']|| '',
    country:       r['Country']      || '',
    region:        r['Region']       || '',
    city:          r['City']         || '',
    line:          normalizeLine(r['Line']),
    phone:         r['Phone']        || '',
  }
}

function validate(records) {
  const errors = []
  const emails = new Set()
  records.forEach((r, i) => {
    const row = i + 2
    if (!r.email) errors.push({ row, field: 'Email', msg: 'Required' })
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) errors.push({ row, field: 'Email', msg: `Invalid: ${r.email}` })
    else if (emails.has(r.email)) errors.push({ row, field: 'Email', msg: `Duplicate: ${r.email}` })
    else emails.add(r.email)
    if (!r.name) errors.push({ row, field: 'User Name', msg: 'Required' })
    if (!['admin', 'manager', 'learner', 'auditor'].includes(r.role)) errors.push({ row, field: 'Role', msg: `Must be admin / manager / learner / auditor (got "${r.role}")` })
    if (r.line && !VALID_LINES.includes(r.line)) errors.push({ row, field: 'Line', msg: `Must be L1–L6 (got "${r.line}")` })
    if (r.managerEmail && r.managerEmail === r.email) errors.push({ row, field: 'Manager Email', msg: 'Cannot manage yourself' })
  })
  return errors
}

function buildHierarchyStats(records) {
  const byEmail = new Map(records.map((r) => [r.email, r]))
  const byLine = (line) => records.filter((r) => r.line === line).length
  return {
    L1: byLine('L1'), L2: byLine('L2'), L3: byLine('L3'),
    L4: byLine('L4'), L5: byLine('L5'), L6: byLine('L6'),
    total: records.length,
    orphans: records.filter((r) => r.managerEmail && !byEmail.has(r.managerEmail)).length,
    countries: new Set(records.map((r) => r.country).filter(Boolean)).size,
  }
}

export default function BulkUploadModal({ onClose }) {
  const { t, addUsers, logAction } = useApp()
  const [filename, setFilename] = useState(null)
  const [records, setRecords] = useState([])
  const [errors, setErrors] = useState([])
  const [stats, setStats] = useState(null)
  const [parseError, setParseError] = useState(null)

  // Common post-parse handler — used by both CSV/TSV and Excel paths
  const ingestParsed = ({ headers, rows, rawHeaders = [] }) => {
    if (rows.length === 0) {
      setParseError(t('No data rows found.', 'لا توجد صفوف بيانات.'))
      setRecords([]); setErrors([]); setStats(null)
      return
    }
    // Only the truly load-bearing columns are required. Optional columns
    // (Job Title, Country, Region, City, Phone, User ID) can be missing —
    // rowToRecord falls back to '' for those.
    const REQUIRED = ['User Name', 'Email', 'Role']
    const missingRequired = REQUIRED.filter((h) => !headers.includes(h))
    if (missingRequired.length > 0) {
      const detected = rawHeaders.length ? rawHeaders.join(', ') : '—'
      setParseError(
        t(
          `File is missing required column(s): ${missingRequired.join(', ')}. Detected headers: ${detected}. Download the Excel template and copy the column names exactly.`,
          `يفتقد الملف الأعمدة المطلوبة: ${missingRequired.join('، ')}. الأعمدة الموجودة: ${detected}. حمّل قالب Excel وانسخ أسماء الأعمدة كما هي.`
        )
      )
      setRecords([]); setErrors([]); setStats(null)
      return
    }
    const recs = rows.map(rowToRecord)
    const errs = validate(recs)
    const valid = recs.filter((r, i) => !errs.some((ee) => ee.row === i + 2))
    setRecords(recs)
    setErrors(errs)
    setStats(buildHierarchyStats(valid))
    setParseError(null)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFilename(file.name)

    const ext = file.name.toLowerCase().split('.').pop()
    const isExcel = ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || ext === 'xlsb'
    const reader = new FileReader()

    if (isExcel) {
      reader.onload = async () => {
        try {
          const parsed = await parseExcel(reader.result)
          ingestParsed(parsed)
        } catch (err) {
          setParseError(t('Could not parse Excel file: ', 'تعذر قراءة ملف Excel: ') + err.message)
        }
      }
      reader.onerror = () => setParseError(t('Could not read file.', 'تعذر قراءة الملف.'))
      reader.readAsArrayBuffer(file)
      return
    }

    // CSV / TSV / TXT path
    reader.onload = () => {
      try {
        // Try UTF-8 first; if it looks broken (BOM/garbled), retry as UTF-16
        let text = reader.result
        const looksUtf16 = typeof text === 'string' && text.charCodeAt(0) === 0xFEFF && text.indexOf(' ') !== -1
        if (looksUtf16) {
          // Fallback re-decode
          text = text.replace(/ /g, '')
        }
        ingestParsed(parseDelimited(text))
      } catch (err) {
        setParseError(t('Could not parse file: ', 'تعذر قراءة الملف: ') + err.message)
      }
    }
    reader.onerror = () => setParseError(t('Could not read file.', 'تعذر قراءة الملف.'))
    reader.readAsText(file, 'UTF-8')
  }

  const handleConfirm = () => {
    const valid = records.filter((r, i) => !errors.some((e) => e.row === i + 2))
    if (valid.length === 0) return
    const result = addUsers(valid)
    logAction('users_bulk_imported', `${valid.length}-users`, {
      source: filename,
      lines: { L1: stats?.L1, L2: stats?.L2, L3: stats?.L3, L4: stats?.L4, L5: stats?.L5, L6: stats?.L6 },
    })
    onClose(result)
  }

  const validCount = records.length - new Set(errors.map((e) => e.row)).size

  return (
    <div className="modal-backdrop">
      <div className="modal" style={{ maxWidth: 760 }}>
        <div className="modal-head">
          <h3>{t('Bulk upload users', 'رفع جماعي للمستخدمين')}</h3>
          <button className="icon-btn" onClick={() => onClose(null)}><Icon name="x" size={16} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12, lineHeight: 1.55, marginTop: 0 }}>
            {t('Upload an Excel (.xlsx) or CSV/TSV file with your team. Hierarchy is built from the "Manager Email" column — each row points to its direct manager. Use the "Line" column to record seniority (L1 = top → L6 = bottom).',
               'ارفع ملف Excel أو CSV/TSV لفريقك. يتم بناء التسلسل الهرمي عبر "Manager Email" — كل صف يشير إلى مديره المباشر. سجّل المستوى في عمود "Line" (L1 = الأعلى → L6 = الأسفل).')}
          </p>

          <div className="row" style={{ marginBottom: 14, gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn" onClick={downloadExcelTemplate}>
              <Icon name="download" size={14} /> &nbsp; {t('Download Excel template', 'تنزيل قالب Excel')}
            </button>
            <button type="button" className="btn" onClick={downloadTemplate}>
              <Icon name="download" size={14} /> &nbsp; {t('CSV template', 'قالب CSV')}
            </button>
            <span className="muted" style={{ fontSize: 11 }}>
              {t('Both open in Excel · UTF-8 with BOM · support Arabic', 'كلاهما يفتح في Excel · UTF-8 · يدعم العربية')}
            </span>
          </div>

          <div className="card-tight" style={{ background: 'var(--bg)', borderRadius: 'var(--r3)', padding: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '.3px', marginBottom: 6 }}>
              {t('Required columns (in order)', 'الأعمدة المطلوبة (بالترتيب)')}
            </div>
            <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {TEMPLATE_HEADERS.map((h) => <Pill key={h} variant="gray">{h}</Pill>)}
            </div>
            <div className="muted" style={{ fontSize: 11, marginTop: 8, lineHeight: 1.5 }}>
              {t('Line values must be L1, L2, L3, L4, L5, or L6.',
                 'قيم العمود Line يجب أن تكون L1، L2، L3، L4، L5، أو L6.')}
            </div>
          </div>

          <div className="field">
            <label>{t('Upload your file', 'ارفع ملفك')}</label>
            <input
              type="file"
              accept=".xlsx,.xls,.xlsm,.xlsb,.csv,text/csv,.tsv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFile}
            />
            {filename && (
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {filename} · {records.length} {t('rows', 'صفوف')}
                {errors.length > 0 && <> · <span style={{ color: 'var(--red)' }}>{errors.length} {t('errors', 'أخطاء')}</span></>}
              </div>
            )}
          </div>

          {parseError && (
            <div className="card" style={{ background: 'var(--red-l)', borderColor: 'var(--red-m)', padding: 10 }}>
              <div style={{ color: 'var(--red)', fontWeight: 600 }}>{parseError}</div>
            </div>
          )}

          {stats && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 12 }}>
              <LineStat code="L1" count={stats.L1} color="#DC2626" />
              <LineStat code="L2" count={stats.L2} color="#7C3AED" />
              <LineStat code="L3" count={stats.L3} color="#0E7490" />
              <LineStat code="L4" count={stats.L4} color="#1D4ED8" />
              <LineStat code="L5" count={stats.L5} color="#15803D" />
              <LineStat code="L6" count={stats.L6} color="#B45309" />
              <LineStat code={t('Total','الكل')} count={stats.total} color="var(--tx)" />
            </div>
          )}

          {stats && stats.orphans > 0 && (
            <div className="card" style={{ background: 'var(--amb-l)', borderColor: 'var(--amb-m)', padding: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--amb)' }}>
                {t(`${stats.orphans} row(s) reference a Manager Email not in this file`,
                   `${stats.orphans} صف يشير إلى Manager Email غير موجود في الملف`)}
              </div>
              <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                {t('They\'ll still be imported — the chain just connects to whatever exists in the org already.',
                   'سيتم استيرادهم — يربط النظام بسلسلة موجودة في المؤسسة.')}
              </div>
            </div>
          )}

          {errors.length > 0 && (
            <div className="card" style={{ background: 'var(--red-l)', borderColor: 'var(--red-m)', padding: 10, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 6 }}>
                {t(`${errors.length} validation error(s) — these rows will be skipped`,
                   `${errors.length} خطأ — سيتم تجاهل هذه الصفوف`)}
              </div>
              <div style={{ maxHeight: 100, overflowY: 'auto', fontSize: 11 }}>
                {errors.slice(0, 8).map((e, i) => (
                  <div key={i} style={{ color: 'var(--red)' }}>{t('Row', 'الصف')} {e.row} · {e.field}: {e.msg}</div>
                ))}
                {errors.length > 8 && <div className="muted" style={{ marginTop: 4 }}>+{errors.length - 8} {t('more', 'أكثر')}</div>}
              </div>
            </div>
          )}

          {records.length > 0 && (
            <div>
              <h4 style={{ margin: '0 0 8px' }}>{t('Preview (first 6 rows)', 'معاينة (6 صفوف)')}</h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--r3)' }}>
                <table className="tbl" style={{ minWidth: 720 }}>
                  <thead>
                    <tr>
                      <th>{t('Name', 'الاسم')}</th>
                      <th>{t('Role', 'الدور')}</th>
                      <th>{t('Title', 'المسمى')}</th>
                      <th>{t('Email', 'البريد')}</th>
                      <th>{t('Manager', 'المدير')}</th>
                      <th>{t('Line', 'المستوى')}</th>
                      <th>{t('City', 'المدينة')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.slice(0, 6).map((r, i) => (
                      <tr key={i} style={errors.some((e) => e.row === i + 2) ? { background: 'var(--red-l)' } : undefined}>
                        <td>{r.name}</td>
                        <td><Pill variant={r.role === 'admin' ? 'pur' : r.role === 'manager' ? 'blue' : r.role === 'auditor' ? 'amb' : 'green'}>{r.role}</Pill></td>
                        <td>{r.jobTitle}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.email}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.managerEmail || '—'}</td>
                        <td>{r.line ? <Pill variant="purple">{r.line}</Pill> : '—'}</td>
                        <td>{r.city || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {records.length > 6 && (
                <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>+{records.length - 6} {t('more', 'أكثر')}</div>
              )}
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={() => onClose(null)}>{t('Cancel', 'إلغاء')}</button>
          <button className="btn primary" onClick={handleConfirm} disabled={validCount === 0}>
            <Icon name="upload" size={14} /> &nbsp;
            {validCount > 0
              ? t(`Import ${validCount} user${validCount === 1 ? '' : 's'}`, `استيراد ${validCount} مستخدم`)
              : t('Import', 'استيراد')}
          </button>
        </div>
      </div>
    </div>
  )
}

function LineStat({ code, count, color }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--r3)', padding: 8, textAlign: 'center' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: '.3px' }}>{code}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--tx)', marginTop: 2 }}>{count}</div>
    </div>
  )
}
