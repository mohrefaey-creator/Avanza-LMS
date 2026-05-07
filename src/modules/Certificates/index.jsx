import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'

// ─────────────────────────────────────────────────────────────────────────────
// Certificate generation — backend contract
// ─────────────────────────────────────────────────────────────────────────────
//   GET  /api/certificates/:id/pdf     → PDF binary
//   GET  /api/certificates/:id/qr      → QR code SVG/PNG verifying authenticity
//   POST /api/certificates             { user_id, course_id, signature_id }
//        Issued automatically when assignment.status flips to 'completed' AND
//        (course.mandatory ? esignature applied : true).
//        Server renders the PDF via headless Chromium / wkhtmltopdf using the
//        same template defined here, persists to Supabase Storage, and returns
//        signed URLs.
//
// In this build we generate the certificate as an HTML document client-side.
//   • "Open" pops a new window with auto-print so the user "Save as PDF".
//   • "Download" gives them a self-contained .html file (works offline).
//   • "Download all" iterates and triggers a download per active cert
//     (in production this becomes one /api/certificates/bulk?ids=… that
//     returns a server-zipped archive).
// ─────────────────────────────────────────────────────────────────────────────

function buildCertificateHTML({ cert, course, user, lang, origin }) {
  const title    = course ? course.title : 'Avanza Course'
  const titleAr  = course ? course.titleAr || course.title : 'دورة أفانزا'
  const userName = user?.name || 'Learner'
  const userNameAr = user?.nameAr || user?.name || 'متعلم'
  const issued   = cert.issuedAt
  const expires  = cert.expiresAt
  const verifyId = cert.qrCode || cert.id
  const versionLine = course ? `${course.therapyArea || ''} · ${course.product || 'All'} · v${course.version || '1.0.0'}` : ''
  // Logos served from /public — pass absolute origin so the standalone window
  // can resolve them when opened separately.
  const cigalahSrc = `${origin}/cigalah-logo.png`
  const csoSrc     = `${origin}/cso-logo.png`
  const avanzaSrc  = `${origin}/logo.png`

  return `<!doctype html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8" />
<title>Avanza Certificate · ${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&display=swap" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 30px; font-family: 'IBM Plex Sans', sans-serif; background: #F5F6FA; color: #1A1D2E; }
  [dir="rtl"] body { font-family: 'IBM Plex Sans Arabic', sans-serif; }

  .cert {
    max-width: 920px; margin: 0 auto; background: white; padding: 0;
    border-radius: 12px; border: 1px solid #E2E6F0;
    box-shadow: 0 24px 60px rgba(15, 30, 60, .12);
    position: relative; overflow: hidden;
  }
  /* Three-color accent stripe — green (Cigalah), navy (Avanza), red (CSO) */
  .stripe {
    height: 6px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }
  .stripe span:nth-child(1) { background: #1FA251; }
  .stripe span:nth-child(2) { background: #0F2A52; }
  .stripe span:nth-child(3) { background: #D6322F; }

  .top {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    align-items: center;
    padding: 22px 44px 14px;
    gap: 16px;
  }
  .top img { display: block; max-height: 56px; width: auto; max-width: 100%; }
  .top .left  { text-align: start; }
  .top .mid   { text-align: center; font-weight: 700; font-size: 22px; color: #0F2A52; letter-spacing: -.4px; }
  .top .mid .lms { color: #2BA7B8; margin-inline-start: 4px; }
  .top .mid img  { max-height: 64px; margin: 0 auto; }
  .top .right { text-align: end; }
  .top .right img { margin-inline-start: auto; max-height: 60px; }

  .top-divider { height: 1px; background: #E2E6F0; margin: 0 44px; }

  .body-pad { padding: 28px 50px 28px; }

  .eyebrow { font-size: 14px; color: #5A6380; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; text-align: center; }
  .eyebrow span { color: #9BA3BC; font-weight: 600; }
  h1.title-en { font-size: 26px; font-weight: 700; margin: 8px 0 0; color: #0F2A52; letter-spacing: -.4px; line-height: 1.15; text-align: center; }
  .title-ar  { font-size: 16px; font-weight: 600; color: #5A6380; margin-top: 4px; text-align: center; }

  p.lead { font-size: 16px; color: #1A1D2E; font-weight: 600; margin: 22px 0 6px; text-align: center; }
  .who { font-size: 24px; font-weight: 700; color: #1A1D2E; margin: 4px 0 2px; line-height: 1.15; text-align: center; }
  .who-ar { font-size: 14px; font-weight: 600; color: #5A6380; margin-bottom: 18px; text-align: center; }

  .body-text { font-size: 13px; line-height: 1.65; color: #5A6380; max-width: 720px; margin: 0 auto; text-align: center; }
  .body-text strong { color: #1A1D2E; }
  .course-meta { font-size: 11px; color: #9BA3BC; margin-top: 8px; text-align: center; }

  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 22px 0 0; padding: 14px 0;
    border-top: 1px solid #E2E6F0; border-bottom: 1px solid #E2E6F0; }
  .kv .label { font-size: 9px; font-weight: 700; color: #9BA3BC; text-transform: uppercase; letter-spacing: .4px; }
  .kv .value { font-size: 14px; font-weight: 700; margin-top: 3px; }
  .v-issued  { color: #6D28D9; }
  .v-valid   { color: #1D4ED8; }
  .v-status  { color: #15803D; }

  .footer {
    display: grid; grid-template-columns: 1fr auto 1fr;
    gap: 24px; padding: 18px 50px 24px;
    align-items: center;
  }
  .sig { font-size: 11px; color: #5A6380; line-height: 1.55; }
  .sig .line { width: 160px; border-bottom: 1px solid #1A1D2E; margin-bottom: 6px; }
  .sig strong { color: #1A1D2E; display: block; font-size: 13px; }
  .qr-block { text-align: center; }
  .qr-tile {
    width: 70px; height: 70px; border-radius: 6px;
    background: repeating-conic-gradient(#1A1D2E 0% 25%, white 0% 50%) 50%/14px 14px;
    margin: 0 auto;
    border: 1px solid #1A1D2E;
  }
  .qr-id { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #5A6380; margin-top: 6px; }
  .right-block { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
  .cert-meta {
    text-align: end; font-size: 10px; color: #5A6380; line-height: 1.7;
  }
  .cert-meta .label { font-weight: 700; color: #1A1D2E; }
  .stamp {
    width: 110px; height: 110px; border: 3px solid #D6322F; border-radius: 50%;
    display: flex; align-items: center; justify-content: center; flex-direction: column;
    color: #D6322F; font-weight: 700; transform: rotate(-6deg); flex-shrink: 0;
    text-align: center;
  }
  .stamp .top-l { font-size: 10px; letter-spacing: 1.4px; }
  .stamp .mid-l { font-size: 13px; margin: 3px 0; line-height: 1.05; }
  .stamp .btm-l { font-size: 9px; }

  .toolbar { max-width: 920px; margin: 0 auto 18px; display: flex; gap: 10px; justify-content: flex-end; }
  .toolbar button { padding: 8px 14px; border: 1px solid #E2E6F0; background: white; border-radius: 6px;
    font-weight: 700; font-size: 11px; cursor: pointer; color: #1A1D2E; text-transform: uppercase; letter-spacing: .3px; }
  .toolbar button.primary { background: #2563EB; color: white; border-color: #2563EB; }

  @media print {
    body { background: white; padding: 0; }
    .cert { box-shadow: none; border: none; max-width: none; border-radius: 0; }
    .toolbar { display: none; }
    @page { size: A4 landscape; margin: 0; }
  }
</style>
</head>
<body>
  <div class="toolbar"><button onclick="window.print()" class="primary">Print / Save as PDF</button><button onclick="window.close()">Close</button></div>
  <div class="cert">
    <div class="stripe"><span></span><span></span><span></span></div>

    <div class="top">
      <div class="left"><img src="${cigalahSrc}" alt="Cigalah Healthcare Company" /></div>
      <div class="mid">Avanza<span class="lms">LMS</span></div>
      <div class="right"><img src="${csoSrc}" alt="CSO Group" /></div>
    </div>

    <div class="top-divider"></div>

    <div class="body-pad">
      <div class="eyebrow">Certificate of Completion</div>
      <h1 class="title-en">${escapeHtml(title)}</h1>

      <p class="lead">This certifies that</p>
      <div class="who">${escapeHtml(userName)}</div>

      <div class="body-text">
        has successfully completed the training programme above as part of the Avanza LMS pharmaceutical education platform, meeting all <strong>21 CFR Part 11</strong> and <strong>EU GVP</strong> compliance requirements.
      </div>
      ${versionLine ? `<div class="course-meta">${versionLine}</div>` : ''}

      <div class="grid">
        <div class="kv"><div class="label">Issued</div><div class="value v-issued">${issued}</div></div>
        <div class="kv"><div class="label">Status</div><div class="value v-status">${cert.status}</div></div>
      </div>
    </div>

    <div class="footer">
      <div class="sig">
        <div class="line"></div>
        <strong>Avanza LMS — L&amp;D</strong>
        Layla Hassan, L&amp;D Director<br/>
        Pharma MENA · UAE
      </div>
      <div class="qr-block">
        <div class="qr-tile"></div>
        <div class="qr-id">QR · ${verifyId}</div>
      </div>
      <div class="right-block">
        <div class="cert-meta">
          <div><span class="label">Issued</span> ${issued}</div>
          <div><span class="label">Verification ID:</span> ${verifyId}</div>
        </div>
        <div class="stamp">
          <div class="top-l">VERIFIED</div>
          <div class="mid-l">21 CFR<br/>Part 11</div>
          <div class="btm-l">e-signed</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c])
}

export default function Certificates() {
  const { t, certificates, courses, users, role, user, logAction } = useApp()

  const list = role === 'auditor' || role === 'admin'
    ? certificates
    : certificates.filter((c) => c.userId === user?.id)

  const variants = {
    active:     'green',
    expiring:   'amber',
    expired:    'red',
    superseded: 'gray',
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const openCert = (cert) => {
    const course = courses.find((x) => x.id === cert.courseId)
    const owner  = users.find((u) => u.id === cert.userId) || user
    const html = buildCertificateHTML({ cert, course, user: owner, lang: 'en', origin })
    const w = window.open('', '_blank', 'width=1100,height=820')
    if (!w) {
      alert(t('Please allow pop-ups to view the certificate.', 'الرجاء السماح بالنوافذ المنبثقة لعرض الشهادة.'))
      return
    }
    w.document.open()
    w.document.write(html)
    w.document.close()
    logAction('cert_viewed', cert.id)
  }

  const downloadCert = (cert) => {
    const course = courses.find((x) => x.id === cert.courseId)
    const owner  = users.find((u) => u.id === cert.userId) || user
    const html = buildCertificateHTML({ cert, course, user: owner, lang: 'en', origin })
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const safeTitle = (course?.title || cert.courseId).replace(/[^\w-]+/g, '_').slice(0, 40)
    a.href = url
    a.download = `Avanza-Certificate-${safeTitle}-${cert.id}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    logAction('cert_downloaded', cert.id)
  }

  const downloadAll = () => {
    const downloadable = list.filter((c) => c.status === 'active' || c.status === 'expiring')
    if (downloadable.length === 0) {
      alert(t('No active certificates to download.', 'لا توجد شهادات نشطة للتنزيل.'))
      return
    }
    downloadable.forEach((cert, i) => {
      // small stagger so the browser doesn't bundle them or drop downloads
      setTimeout(() => downloadCert(cert), i * 280)
    })
    logAction('cert_bulk_downloaded', `${downloadable.length}-certs`)
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{role === 'auditor' ? t('Certificate vault', 'خزينة الشهادات') : t('My certificates', 'شهاداتي')}</h1>
          <div className="subtitle">
            {t('PDF + QR-verified · expiry alerts at 60 / 30 / 7 days', 'PDF + رمز QR · تنبيهات الانتهاء عند 60/30/7 أيام')}
          </div>
        </div>
        <div className="row">
          <button className="btn" onClick={downloadAll} disabled={list.length === 0}>
            <Icon name="download" size={14} /> &nbsp; {t(`Download all (${list.length})`, `تنزيل الكل (${list.length})`)}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {list.map((c) => {
          const course = courses.find((x) => x.id === c.courseId)
          const u = users.find((x) => x.id === c.userId)
          const v = variants[c.status] || 'blue'
          return (
            <div key={c.id} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: c.status === 'active' ? 'var(--green-l)' : c.status === 'expiring' ? 'var(--amb-l)' : c.status === 'expired' ? 'var(--red-l)' : 'var(--bg)', borderBottomLeftRadius: 80, opacity: .8 }} />
              <Pill variant={v}>{c.status}</Pill>
              {course?.mandatory && <Pill variant="purple" style={{ marginInlineStart: 6 }}>{t('Mandatory', 'إلزامي')}</Pill>}

              <h2 style={{ marginTop: 10, fontSize: 14 }}>{course ? t(course.title, course.titleAr) : c.courseId}</h2>
              {role !== 'learner' && u && (
                <div className="muted" style={{ fontSize: 11 }}>{t(u.name, u.nameAr)} · {u.jobTitle}</div>
              )}
              <div className="kv-list mt-12">
                <div className="kv-row">
                  <div className="kv-label">{t('Issued', 'أُصدرت')}</div>
                  <div className="kv-value">{c.issuedAt}</div>
                </div>
                <div className="kv-row">
                  <div className="kv-label">{t('Expires', 'تنتهي')}</div>
                  <div className="kv-value">{c.expiresAt}</div>
                </div>
                <div className="kv-row">
                  <div className="kv-label">{t('Verification', 'التحقق')}</div>
                  <div className="kv-value">{c.qrCode}</div>
                </div>
              </div>
              <div className="row mt-16">
                <button className="btn" onClick={() => openCert(c)}>
                  <Icon name="doc" size={14} /> &nbsp; {t('Open', 'فتح')}
                </button>
                <button className="btn" onClick={() => downloadCert(c)}>
                  <Icon name="download" size={14} /> &nbsp; {t('Download', 'تنزيل')}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {list.length === 0 && (
        <div className="empty-state">
          <div className="ico"><Icon name="award" size={22} /></div>
          <h4>{t('No certificates yet', 'لا توجد شهادات بعد')}</h4>
          <p>{t('Complete a course to earn your first certificate.', 'أكمل دورة لتحصل على أول شهادة.')}</p>
        </div>
      )}
    </>
  )
}
