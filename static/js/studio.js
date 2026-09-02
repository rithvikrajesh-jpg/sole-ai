(function () {
  'use strict';

  const generateBtn = document.getElementById('generateBtn');
  const formError = document.getElementById('formError');
  const emptyState = document.getElementById('emptyState');
  const result = document.getElementById('result');
  const loadingState = document.getElementById('loadingState');
  const captchaModal = document.getElementById('captchaModal');
  const captchaCancel = document.getElementById('captchaCancel');
  const regenBtn = document.getElementById('regenBtn');
  const regenImgBtn = document.getElementById('regenImgBtn');
  
  let captchaWidgetId = null;
  let currentConcept = null;

  function escHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setUI(state) {
    emptyState && emptyState.classList.toggle('hidden', state !== 'empty');
    result && result.classList.toggle('hidden', state !== 'result');
    loadingState && loadingState.classList.toggle('hidden', state !== 'loading');
  }

  function setStage(stage) {
    const loaderStage = document.getElementById('loaderStage');
    if (loaderStage) loaderStage.textContent = stage;
  }

  function startLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
  }

  function stopLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.classList.add('hidden');
  }

  function collectPrefs() {
    return {
      style: document.getElementById('style')?.value || '',
      material: document.getElementById('material')?.value || '',
      occasion: document.getElementById('occasion')?.value || '',
      primary_color: document.getElementById('primary_color')?.value || '',
      accent_color: document.getElementById('accent_color')?.value || '',
      inspiration: document.getElementById('inspiration')?.value?.trim() || '',
    };
  }

  function renderConcept(c) {
    currentConcept = c;
    result && result.classList.remove('hidden');
    const resultName = document.getElementById('resultName');
    const resultTagline = document.getElementById('resultTagline');
    const resultDesc = document.getElementById('resultDesc');
    const resultPrice = document.getElementById('resultPrice');
    const resultAudience = document.getElementById('resultAudience');
    const resultTags = document.getElementById('resultTags');
    const materialsList = document.getElementById('materialsList');
    const featuresList = document.getElementById('featuresList');
    const soleText = document.getElementById('soleText');

    if (resultName) resultName.textContent = c.name || '';
    if (resultTagline) resultTagline.textContent = c.tagline || '';
    if (resultDesc) resultDesc.textContent = c.description || '';
    if (resultPrice) resultPrice.textContent = c.retail_price || '';
    if (resultAudience) resultAudience.textContent = c.target_audience || '';
    if (resultTags) resultTags.textContent = (c.style_tags || []).join(' · ');
    if (materialsList) materialsList.innerHTML = (c.materials || []).map((m) => `<li>${escHtml(m)}</li>`).join('');
    if (featuresList) featuresList.innerHTML = (c.features || []).map((f) => `<li>${escHtml(f)}</li>`).join('');
    if (soleText) soleText.textContent = c.sole_type || '—';
  }

  function fetchImage(prompt) {
    // Placeholder for image fetch logic
    console.log('Fetching image for:', prompt);
  }

  document.querySelectorAll('.chip-group').forEach((group) => {
    const hiddenInput = document.getElementById(group.dataset.field);
    group.querySelectorAll('.chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        if (hiddenInput) hiddenInput.value = chip.dataset.value;
      });
    });
  });

  function syncColorPair(pickerId, textId) {
    const picker = document.getElementById(pickerId);
    const text = document.getElementById(textId);
    if (!picker || !text) return;

    picker.addEventListener('input', () => {
      text.value = picker.value;
    });

    text.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) {
        picker.value = text.value;
      }
    });
  }

  syncColorPair('primary_color', 'primary_color_text');
  syncColorPair('accent_color', 'accent_color_text');

  // TODO 1
  window.hcaptchaReady = () => {
    captchaWidgetId = hcaptcha.render('hcaptchaWidget', {
      sitekey: window.HCAPTCHA_SITE_KEY, theme: 'dark', size: 'compact',
      callback: token => { captchaModal.classList.add('hidden'); runGeneration(token); },
      'expired-callback': () => { captchaModal.classList.add('hidden'); generateBtn.disabled = false; formError.textContent = 'CAPTCHA expired.'; },
    });
  };

  // TODO 2
  generateBtn?.addEventListener('click', () => {
    formError.textContent = '';
    if (typeof hcaptcha === 'undefined' || captchaWidgetId === null) { formError.textContent = 'CAPTCHA not loaded. Refresh.'; return; }
    hcaptcha.reset(captchaWidgetId);
    captchaModal.classList.remove('hidden');
  });

  // TODO 3
  captchaCancel?.addEventListener('click', () => { captchaModal.classList.add('hidden'); hcaptcha?.reset(captchaWidgetId); });

  // TODO 4
  const runGeneration = async token => {
    const prefs = collectPrefs();
    generateBtn.disabled = true;
    setUI('loading'); setStage('groq'); startLoader();
    try {
      const r = await fetch('/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...prefs,'h-captcha-response':token})});
      const d = await r.json();
      if (!r.ok||d.error) throw new Error(d.error||'Server error');
      stopLoader(); renderConcept(d.concept); setUI('result');
      fetchImage(d.concept.image_prompt || `Premium ${prefs.style} sneaker, ${prefs.material}, studio photography, 8k`);
    } catch(e) {
      stopLoader(); setUI('empty'); formError.textContent = e.message||'Something went wrong.';
    } finally {
      generateBtn.disabled = false;
      if (typeof hcaptcha!=='undefined' && captchaWidgetId!==null) hcaptcha.reset(captchaWidgetId);
    }
  };

  regenImgBtn?.addEventListener('click', () => currentConcept && fetchImage(currentConcept.image_prompt||`Premium sneaker, ${currentConcept.name||'sneaker'}, studio, 8k`));
  regenBtn?.addEventListener('click', () => { formError.textContent=''; setUI('empty'); currentConcept=null; document.querySelector('.form-panel')?.scrollIntoView({behavior:'smooth'}); });
})();