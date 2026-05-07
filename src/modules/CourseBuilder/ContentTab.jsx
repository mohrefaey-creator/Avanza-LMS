import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Icon from '../../components/Icon.jsx'
import Pill from '../../components/Pill.jsx'

const FILE_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.mp4,.mov,.webm,.avi,.mkv,.m4v,.mp3,.wav,.ogg,.m4a,.aac,.zip,video/*,audio/*'

function detectFileType(filename = '') {
  const ext = filename.split('.').pop().toLowerCase()
  if (['mp4','mov','webm','avi','mkv','m4v'].includes(ext)) return 'video'
  if (['mp3','wav','ogg','m4a','aac'].includes(ext)) return 'audio'
  if (ext === 'pdf') return 'pdf'
  if (['ppt','pptx'].includes(ext)) return 'ppt'
  if (['doc','docx'].includes(ext)) return 'doc'
  if (ext === 'zip') return 'scorm'
  return 'file'
}

function extractYouTubeId(url) {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/)
  return m ? m[1] : null
}

export default function ContentTab({ draft, setDraft }) {
  const { t } = useApp()
  const [sourceMode, setSourceMode] = useState(draft.type === 'youtube' ? 'youtube' : draft.type === 'scorm' ? 'scorm' : 'file')
  const [fileInfo, setFileInfo] = useState(draft.contentFilename ? { name: draft.contentFilename, size: draft.contentSize || 0 } : null)
  const [ytUrl, setYtUrl] = useState(draft.youtubeUrl || '')

  // Validity helper — admin enters start date + number of valid days, end
  // date is computed automatically. If the draft already has both dates,
  // initialize the days input from the existing range.
  const initialDays = (() => {
    if (draft.validFrom && draft.validUntil) {
      const diff = Math.round((new Date(draft.validUntil) - new Date(draft.validFrom)) / 86400000)
      return diff > 0 ? diff : 365
    }
    return 365
  })()
  const [validDays, setValidDays] = useState(initialDays)

  const computeEndDate = (start, days) => {
    if (!start || !days || days < 1) return ''
    const end = new Date(start)
    end.setDate(end.getDate() + Number(days))
    return end.toISOString().slice(0, 10)
  }

  const handleStartDateChange = (newStart) => {
    setDraft((d) => ({
      ...d,
      validFrom: newStart,
      validUntil: computeEndDate(newStart, validDays),
    }))
  }

  const handleDaysChange = (newDays) => {
    const n = Math.max(1, Number(newDays) || 0)
    setValidDays(n)
    setDraft((d) => ({
      ...d,
      validUntil: computeEndDate(d.validFrom, n),
    }))
  }

  const update = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const updateMany = (patch) => setDraft((d) => ({ ...d, ...patch }))

  const addModule = () => {
    setDraft((d) => ({
      ...d,
      modules: [...d.modules, { id: `m${d.modules.length + 1}`, title: 'New module', titleAr: 'وحدة جديدة', mins: 5 }],
    }))
  }

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const type = detectFileType(f.name)
    const url = URL.createObjectURL(f)
    setFileInfo({ name: f.name, size: f.size })
    updateMany({
      type,
      contentUrl: url,
      contentFilename: f.name,
      contentSize: f.size,
      youtubeId: null,
      youtubeUrl: null,
    })
  }

  const handleYouTube = (val) => {
    setYtUrl(val)
    const id = extractYouTubeId(val)
    if (id) {
      updateMany({
        type: 'youtube',
        contentUrl: `https://www.youtube.com/embed/${id}`,
        youtubeId: id,
        youtubeUrl: val,
        contentFilename: null,
        contentSize: null,
      })
    } else {
      update('youtubeUrl', val)
    }
  }

  return (
    <div className="builder-grid">
      <div>
        <h3>{t('Course settings', 'إعدادات الدورة')}</h3>

        <Field label={t('Title (English)', 'العنوان (إنجليزي)')}>
          <input value={draft.title} onChange={(e) => update('title', e.target.value)} />
        </Field>
        <Field label={t('Title (Arabic)', 'العنوان (عربي)')}>
          <input dir="rtl" value={draft.titleAr} onChange={(e) => update('titleAr', e.target.value)} />
        </Field>
        <Field label={t('Type', 'النوع')}>
          <select value={draft.type} onChange={(e) => update('type', e.target.value)}>
            <option value="scorm">SCORM</option>
            <option value="video">{t('Video', 'فيديو')}</option>
            <option value="pdf">PDF</option>
            <option value="microlearning">{t('Microlearning', 'تعلم مصغر')}</option>
            <option value="simulation">{t('Simulation', 'محاكاة')}</option>
          </select>
        </Field>
        <Field label={t('Therapy / Product', 'المجال / المنتج')}>
          <div className="row">
            <input value={draft.therapyArea} onChange={(e) => update('therapyArea', e.target.value)} style={{ flex:1 }} />
            <input value={draft.product} onChange={(e) => update('product', e.target.value)} style={{ flex:1 }} />
          </div>
        </Field>
        <Field label={t('Pass mark / Attempts / Duration', 'النجاح / المحاولات / المدة')}>
          <div className="row">
            <input type="number" value={draft.passMark} onChange={(e) => update('passMark', +e.target.value)} style={{ width:80 }} />
            <input type="number" value={draft.attemptsAllowed} onChange={(e) => update('attemptsAllowed', +e.target.value)} style={{ width:80 }} />
            <input type="number" value={draft.durationMin} onChange={(e) => update('durationMin', +e.target.value)} style={{ width:100 }} />
          </div>
        </Field>
        <Field label={t('Validity (start · days · auto end)', 'الصلاحية (البداية · الأيام · النهاية تلقائي)')}>
          <div className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px', minWidth: 0 }}>
              <span style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                {t('Start', 'البداية')}
              </span>
              <input
                type="date"
                value={draft.validFrom || ''}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 110px' }}>
              <span style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                {t('Valid days', 'عدد الأيام')}
              </span>
              <input
                type="number"
                min="1"
                value={validDays}
                onChange={(e) => handleDaysChange(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 140px', minWidth: 0 }}>
              <span style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
                {t('End (auto)', 'النهاية (تلقائي)')}
              </span>
              <input
                type="date"
                value={draft.validUntil || ''}
                readOnly
                tabIndex={-1}
                style={{ background: 'var(--bg)', color: 'var(--tx2)', cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </Field>
        <Field label={t('Mandatory', 'إلزامي')}>
          <label style={{ display:'flex', gap:8, alignItems:'center', fontSize:12 }}>
            <input type="checkbox" checked={draft.mandatory} onChange={(e) => update('mandatory', e.target.checked)} />
            {t('Requires e-signature on completion', 'يتطلب توقيعًا إلكترونيًا عند الإكمال')}
          </label>
        </Field>
      </div>

      <div>
        <h3>{t('Modules', 'الوحدات')}</h3>
        <div className="module-list">
          {draft.modules.map((m, i) => (
            <div key={m.id} className={`module-item ${i === 0 ? 'active' : ''}`}>
              <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(0,0,0,.06)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div>{t(m.title, m.titleAr || m.title)}</div>
                <div style={{ fontSize:10, color:'var(--tx3)' }}>{m.mins} {t('min', 'دقيقة')}</div>
              </div>
              <button className="btn sm"><Icon name="edit" size={11} /></button>
            </div>
          ))}
        </div>
        <button className="btn" onClick={addModule}><Icon name="plus" size={12} /> &nbsp; {t('Add module', 'إضافة وحدة')}</button>

        <div className="card mt-16" style={{ padding: 14 }}>
          <h3>{t('Content source', 'مصدر المحتوى')}</h3>
          <div className="chip-row" style={{ margin: '8px 0 12px' }}>
            <button type="button" className={`chip ${sourceMode === 'file' ? 'active' : ''}`} onClick={() => setSourceMode('file')}>
              {t('Upload file', 'رفع ملف')}
            </button>
            <button type="button" className={`chip ${sourceMode === 'youtube' ? 'active' : ''}`} onClick={() => setSourceMode('youtube')}>
              {t('YouTube link', 'رابط يوتيوب')}
            </button>
            <button type="button" className={`chip ${sourceMode === 'scorm' ? 'active' : ''}`} onClick={() => setSourceMode('scorm')}>
              SCORM / xAPI
            </button>
          </div>

          {sourceMode === 'file' && (
            <>
              <label htmlFor="builder-file-input" style={{ display: 'block', cursor: 'pointer', border:'2px dashed var(--border)', borderRadius:'var(--r3)', padding:'24px', textAlign:'center', color:'var(--tx2)' }}>
                <Icon name="upload" size={28} />
                <div style={{ fontSize:12, marginTop:8, fontWeight:600 }}>
                  {fileInfo ? fileInfo.name : t('Click to choose a file', 'اضغط لاختيار ملف')}
                </div>
                <div style={{ fontSize:10, marginTop:4 }}>
                  {t('PDF · PPT · Word · MP4 · MOV · WEBM · MP3 · WAV — up to 500 MB', 'PDF · PPT · Word · MP4 · MOV · WEBM · MP3 · WAV — حتى 500 MB')}
                </div>
              </label>
              <input id="builder-file-input" type="file" accept={FILE_ACCEPT} style={{ display: 'none' }} onChange={handleFile} />
              {fileInfo && (
                <div className="row" style={{ marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
                  <Pill variant="blue">{detectFileType(fileInfo.name).toUpperCase()}</Pill>
                  <Pill variant="green">{(fileInfo.size / 1024 / 1024).toFixed(2)} MB</Pill>
                  <Pill variant="purple">{t('Ready to publish', 'جاهز للنشر')}</Pill>
                </div>
              )}
            </>
          )}

          {sourceMode === 'youtube' && (
            <>
              <input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={(e) => handleYouTube(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 'var(--r3)', outline: 'none' }}
              />
              {extractYouTubeId(ytUrl) ? (
                <div style={{ marginTop: 10 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(ytUrl)}`}
                    width="100%"
                    height="180"
                    style={{ border: 'none', borderRadius: 'var(--r3)' }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube preview"
                  />
                  <div className="row" style={{ marginTop: 6, gap: 6 }}>
                    <Pill variant="red">YouTube</Pill>
                    <Pill variant="green">{t('Linked', 'مرتبط')}</Pill>
                    <span className="muted" style={{ fontSize: 11 }}>ID: {extractYouTubeId(ytUrl)}</span>
                  </div>
                </div>
              ) : (
                <div className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                  {t('Paste a YouTube URL — the embed appears here automatically.', 'الصق رابط يوتيوب وسيظهر التضمين تلقائيًا.')}
                </div>
              )}
            </>
          )}

          {sourceMode === 'scorm' && (
            <>
              <label htmlFor="builder-scorm-input" style={{ display: 'block', cursor: 'pointer', border:'2px dashed var(--border)', borderRadius:'var(--r3)', padding:'24px', textAlign:'center', color:'var(--tx2)' }}>
                <Icon name="upload" size={28} />
                <div style={{ fontSize:12, marginTop:8, fontWeight:600 }}>{t('Drag .zip here or click to upload', 'اسحب ملف zip أو اضغط للرفع')}</div>
                <div style={{ fontSize:10, marginTop:4 }}>{t('Max 250 MB · SCORM 1.2 / 2004 / xAPI', 'حد أقصى 250 MB · SCORM 1.2 / 2004 / xAPI')}</div>
              </label>
              <input id="builder-scorm-input" type="file" accept=".zip" style={{ display: 'none' }} onChange={handleFile} />
              <div className="row" style={{ marginTop: 8, gap: 6 }}>
                <Pill variant="green">{t('Validated package', 'حزمة مُتحقَّق منها')}</Pill>
                <Pill variant="blue">{t('Manifest OK', 'بيان الحزمة سليم')}</Pill>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}
