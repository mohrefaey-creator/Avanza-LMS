import { useState } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import Pill from '../../components/Pill.jsx'
import Icon from '../../components/Icon.jsx'
import { claudeReady } from '../../lib/claude.js'

export default function AIAuthor() {
  const { t, logAction } = useApp()
  const [step, setStep] = useState('idle')
  const [output, setOutput] = useState(null)

  const fakeRun = () => {
    setStep('processing')
    logAction('ai_authoring_started', 'sample-pdf')
    setTimeout(() => {
      setStep('ready')
      setOutput({
        title: 'KEYNORX — Adverse Events Update',
        titleAr: 'كاينوركس — تحديث الآثار الجانبية',
        sections: [
          { heading: 'New AE profile (rev. v2.1.1)',  headingAr: 'الآثار الجانبية الجديدة',  keyPoint: 'Grade 3 hepatic events now reportable within 24h.', keyPointAr: 'الآثار الكبدية من الدرجة 3 تُبلَّغ خلال 24 ساعة.' },
          { heading: 'Reporting workflow',             headingAr: 'سير الإبلاغ',                keyPoint: 'PV inbox → Form FDA-3500A → 24h SLA.',                  keyPointAr: 'صندوق YD → نموذج 3500A → 24 ساعة.' },
          { heading: 'Practitioner script',            headingAr: 'نص للممارس',               keyPoint: 'Use new SmPC section 4.8 wording verbatim.',           keyPointAr: 'استخدم نص القسم 4.8 المحدّث حرفيًا.' },
        ],
        questions: 12,
        durationMin: 5,
      })
    }, 1400)
  }

  return (
    <div className="builder-grid">
      <div>
        <h3>{t('AI-authored microlearning', 'تعلم مصغر بالذكاء')}</h3>
        <p className="muted" style={{ fontSize:12, lineHeight:1.55 }}>
          {t('Upload a product PDF or SOP. Claude extracts learning objectives, generates a 5-minute microlearning module + 10–20 question quiz, and suggests target roles. Review and publish.',
             'ارفع ملف PDF لمنتج أو إجراء. يستخرج كلود الأهداف التعليمية، وينشئ وحدة قصيرة من 5 دقائق مع اختبار، ويقترح الأدوار المستهدفة.')}
        </p>

        <div style={{ border: '2px dashed var(--blue-m)', background: 'var(--blue-l)', borderRadius:'var(--r3)', padding: 24, textAlign:'center', marginTop: 12 }}>
          <Icon name="sparkle" size={28} color="var(--blue-d)" />
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 8, color: 'var(--blue-d)' }}>
            {t('Drag a PDF here', 'اسحب ملف PDF')}
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            {t('SOP, prescribing info, training deck — up to 50 MB', 'إجراء، نشرة، عرض تدريبي — حتى 50 MB')}
          </div>
        </div>

        <div className="row mt-16" style={{ gap: 6 }}>
          <Pill variant="purple">claude-opus-4-7</Pill>
          {claudeReady ? <Pill variant="green">{t('API key configured', 'المفتاح مهيّأ')}</Pill> : <Pill variant="amber">{t('Demo mode (no API key)', 'وضع العرض (بلا مفتاح)')}</Pill>}
        </div>

        <button className="btn primary mt-16" onClick={fakeRun} disabled={step === 'processing'}>
          {step === 'processing'
            ? t('Generating…', 'جاري التوليد…')
            : <><Icon name="sparkle" size={14} /> &nbsp; {t('Generate from sample PDF', 'إنشاء من PDF تجريبي')}</>}
        </button>
      </div>

      <div>
        <h3>{t('Generated draft', 'المسودة المُنشأة')}</h3>

        {step === 'idle' && (
          <div className="empty-state">
            <div className="ico"><Icon name="doc" size={22} /></div>
            <h4>{t('Drop a file to begin', 'أسقط ملفًا للبدء')}</h4>
            <p>{t('Output will appear here for review before publish.', 'ستظهر النتيجة هنا للمراجعة قبل النشر.')}</p>
          </div>
        )}

        {step === 'processing' && (
          <div className="empty-state">
            <div className="ico"><Icon name="sparkle" size={22} /></div>
            <h4>{t('Reading document…', 'تتم قراءة الملف…')}</h4>
            <p>{t('Extracting key concepts, learning objectives, generating quiz…', 'استخراج المفاهيم والأهداف وإنشاء الاختبار…')}</p>
          </div>
        )}

        {step === 'ready' && output && (
          <div>
            <Pill variant="green">{t('Ready for review', 'جاهز للمراجعة')}</Pill>
            <h2 style={{ marginTop: 10, fontSize: 14 }}>{t(output.title, output.titleAr)}</h2>
            <div className="muted" style={{ fontSize: 11 }}>
              {output.durationMin} {t('min', 'دقيقة')} · {output.questions} {t('quiz questions', 'سؤال اختبار')}
            </div>
            <div className="mt-12">
              {output.sections.map((s, i) => (
                <div key={i} style={{ borderTop: i ? '1px solid var(--border)' : 'none', padding: '10px 0' }}>
                  <div style={{ fontWeight: 700 }}>{t(s.heading, s.headingAr)}</div>
                  <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 4 }}>
                    <strong>{t('Key:', 'النقطة:')}</strong> {t(s.keyPoint, s.keyPointAr)}
                  </div>
                </div>
              ))}
            </div>
            <div className="row mt-16">
              <button className="btn">{t('Edit', 'تحرير')}</button>
              <button className="btn primary">{t('Publish to catalog', 'نشر في الكتالوج')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
