/**
 * Parses a semver version from a string
 * @param {string} val Input string
 * @returns {[number, number, number]} [major, minor, patch], missing values default to 0
 */
function parseVersion(val) {
  if (val === 'unknown' || val === '') return [0, 0, 0];
  var parts = val.split('.').map((p) => Number(p) || 0);
  while (parts.length < 3) parts.push(0);
  return parts;
}

/**
 * Returns -1, 0, or 1 if version A is earlier than, equal to, or later than version B
 * @param {string} a Version A
 * @param {string} b Version B
 * @returns {-1 | 0 | 1} Comparison result
 */
function compareVersions(a, b) {
  var pa = parseVersion(a), pb = parseVersion(b);
  for (var i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1;
    if (pa[i] > pb[i]) return 1;
  }
  return 0;
}

/**
 * Creates a version filter dropdown controller
 * @param {Object} options Configuration options
 * @param {HTMLElement} options.wrapper The wrapper element containing the filter
 * @param {Function} options.onChange Callback when selection changes (optional)
 * @param {boolean} options.positionFixed Whether dropdown should be positioned fixed
 */
function createVersionFilter(options) {
  var wrapper = options.wrapper;
  var btn = wrapper.querySelector('.version-filter-btn');
  var dropdown = wrapper.querySelector('.version-filter-dropdown');
  var optionsList = wrapper.querySelectorAll('.version-filter-option');
  var optionsArray = Array.from(optionsList);
  optionsArray.sort((a, b) => compareVersions(a.dataset.value, b.dataset.value));
  var btnText = btn.querySelector('.version-filter-text');
  var chevron = btn.querySelector('.version-filter-chevron');
  var isOpen = false;
  var selectedIndex = 0;

  function openDropdown() {
    isOpen = true;
    btn.setAttribute('aria-expanded', 'true');
    dropdown.hidden = false;
    dropdown.style.display = 'block';
    if (chevron) chevron.style.transform = 'rotate(180deg)';

    if (options.positionFixed) {
      var rect = btn.getBoundingClientRect();
      dropdown.style.left = rect.left + 'px';
      dropdown.style.top = (rect.bottom + window.scrollY) + 'px';
      dropdown.style.maxWidth = rect.width + 'px';
    }

    optionsArray[selectedIndex].focus();
  }

  function closeDropdown() {
    isOpen = false;
    btn.setAttribute('aria-expanded', 'false');
    dropdown.hidden = true;
    dropdown.style.display = 'none';
    if (chevron) chevron.style.transform = 'rotate(0deg)';
    if (options.positionFixed) {
      dropdown.style.left = '';
      dropdown.style.top = '';
      dropdown.style.maxWidth = '';
    }
    btn.focus();
  }

  function selectOption(index) {
    optionsArray.forEach((opt, i) => {
      opt.setAttribute('aria-selected', i === index);
    });
    selectedIndex = index;
    var value = optionsArray[index].dataset.value;
    var text = optionsArray[index].textContent;
    if (btnText) btnText.textContent = text;
    closeDropdown();

    if (options.onChange) options.onChange(value, text);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isOpen) closeDropdown();
    else openDropdown();
  });

  optionsArray.forEach((opt, index) => {
    opt.addEventListener('click', () => selectOption(index));

    opt.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectOption(index);
          break;
        case 'ArrowDown':
          e.preventDefault();
          var nextIndex = Math.min(index + 1, optionsArray.length - 1);
          optionsArray[nextIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          var prevIndex = Math.max(index - 1, 0);
          optionsArray[prevIndex].focus();
          break;
        case 'Home':
          e.preventDefault();
          optionsArray[0].focus();
          break;
        case 'End':
          e.preventDefault();
          optionsArray[optionsArray.length - 1].focus();
          break;
        case 'Escape':
          closeDropdown();
          break;
        case 'Tab':
          closeDropdown();
          break;
      }
    });
  });

  btn.addEventListener('keydown', (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
    } else {
      if (e.key === 'Escape') closeDropdown();
      else if (e.key === 'Tab') closeDropdown();
    }
  });

  document.addEventListener('click', (e) => {
    if (isOpen && !wrapper.contains(e.target)) closeDropdown();
  });
}
