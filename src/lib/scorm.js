// SCORM 1.2 / 2004 player wrapper.
// Mounts an iframe for the SCO and bridges the SCORM API to the host app.

export function mountScormPlayer({ container, course, onProgress, onComplete }) {
  const api = createScorm12API({ onProgress, onComplete })
  window.API = api
  window.API_1484_11 = api

  const iframe = document.createElement('iframe')
  iframe.src = course.contentUrl
  iframe.style.width = '100%'
  iframe.style.height = '100%'
  iframe.style.border = 'none'
  iframe.title = course.title
  container.innerHTML = ''
  container.appendChild(iframe)

  return {
    destroy: () => {
      delete window.API
      delete window.API_1484_11
      container.innerHTML = ''
    },
  }
}

function createScorm12API({ onProgress, onComplete }) {
  const cmi = {
    'cmi.core.lesson_status': 'incomplete',
    'cmi.core.score.raw': '0',
    'cmi.core.score.min': '0',
    'cmi.core.score.max': '100',
    'cmi.suspend_data': '',
  }
  return {
    LMSInitialize: () => 'true',
    LMSFinish: () => 'true',
    LMSGetValue: (k) => cmi[k] || '',
    LMSSetValue: (k, v) => {
      cmi[k] = v
      if (k === 'cmi.core.score.raw' && onProgress) onProgress(parseInt(v, 10) || 0)
      if (k === 'cmi.core.lesson_status' && (v === 'completed' || v === 'passed') && onComplete) {
        onComplete(parseInt(cmi['cmi.core.score.raw'], 10) || 0)
      }
      return 'true'
    },
    LMSCommit: () => 'true',
    LMSGetLastError: () => '0',
    LMSGetErrorString: () => '',
    LMSGetDiagnostic: () => '',
  }
}
