(function () {
  'use strict';

  const generateBtn = document.getElementById('generateBtn');
  const formError   = document.getElementById('formError');
  const emptyState  = document.getElementById('emptyState');
  const result      = document.getElementById('result');

  // ── Chip selection ──────────────────────────────────────────────
  document.querySelectorAll('.chip-group').forEach(group => {
    const hiddenInput = document.getElementById(group.dataset.field);
    group.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (hiddenInput) hiddenInput.value = chip.dataset.value;
      });
    });
  });

  // ── Color pickers ───────────────────────────────────────────────
  function syncColorPair(pickerId, textId) {
    const picker = document.getElementById(pickerId);
    const text   = document.getElementById(textId);
    if (!picker || !text) return;
    picker.addEventListener('input', () => { text.value = picker.value; });
    text.addEventListener('input', () => {
      if (/^#[0-9A-Fa-f]{6}$/.test(text.value)) picker.value = text.value;
    });
  }
  syncColorPair('primary_color', 'primary_color_text');
  syncColorPair('accent_color',  'accent_color_text');

  // ── Generate button — UI only, no AI yet ────────────────────────
  generateBtn && generateBtn.addEventListener('click', () => {
    const style    = document.getElementById('style').value;
    const material = document.getElementById('material').value;
    const primary  = document.getElementById('primary_color').value;
    const accent   = document.getElementById('accent_color').value;

    // Show a mock result to confirm the UI is working
    emptyState && emptyState.classList.add('hidden');
    if (result) {
      result.classList.remove('hidden');
      document.getElementById('resultName').textContent    = 'UI Interface Ready';
      document.getElementById('resultTagline').textContent = `${style} · ${material} · ${primary} / ${accent}`;
      document.getElementById('resultDesc').textContent    = 'Lesson 1 complete. The interface is structured and all inputs are wired up. Proceed to Lesson 2 to connect the AI.';
      document.getElementById('resultPrice').textContent   = 'Lesson 1';
      document.getElementById('resultAudience').textContent = 'Interface only';
    }
    formError.textContent = '';
  });

})();

generateBtn && generateBtn.addEventListener('click', async () => {
    formError.textContent = '';
    generateBtn.disabled = true;
    emptyState  && emptyState.classList.add('hidden');
    result      && result.classList.add('hidden');
    loadingState && loadingState.classList.remove('hidden');

    const prefs = {
      style:         document.getElementById('style').value,
      material:      document.getElementById('material').value,
      occasion:      document.getElementById('occasion').value,
      primary_color: document.getElementById('primary_color').value,
      accent_color:  document.getElementById('accent_color').value,
      inspiration:   document.getElementById('inspiration').value.trim(),
    };

    try {
      const resp = await fetch('/generate', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(prefs),
      });
      const data = await resp.json();

      loadingState && loadingState.classList.add('hidden');

      if (data.error) {
        emptyState && emptyState.classList.remove('hidden');
        formError.textContent = data.error;
      } else {
        const c = data.concept;
        result && result.classList.remove('hidden');
        document.getElementById('resultName').textContent     = c.name || '';
        document.getElementById('resultTagline').textContent  = c.tagline || '';
        document.getElementById('resultDesc').textContent     = c.description || '';
        document.getElementById('resultPrice').textContent    = c.retail_price || '';
        document.getElementById('resultAudience').textContent = c.target_audience || '';
        document.getElementById('resultTags').textContent     = (c.style_tags || []).join(' · ');
        document.getElementById('materialsList').innerHTML    = (c.materials || []).map(m => `<li>${escHtml(m)}</li>`).join('');
        document.getElementById('featuresList').innerHTML     = (c.features  || []).map(f => `<li>${escHtml(f)}</li>`).join('');
        document.getElementById('soleText').textContent       = c.sole_type || '—';
      }
    } catch (err) {
      loadingState && loadingState.classList.add('hidden');
      emptyState   && emptyState.classList.remove('hidden');
      formError.textContent = 'Network error: ' + err.message;
    }

    generateBtn.disabled = false;
  });

  document.getElementById('regenBtn') && document.getElementById('regenBtn').addEventListener('click', () => {
    result     && result.classList.add('hidden');
    emptyState && emptyState.classList.remove('hidden');
    formError.textContent = '';
  });