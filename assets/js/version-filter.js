/**
 * Creates a version filter dropdown controller
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.wrapper - The wrapper element containing the filter
 * @param {Function} options.onChange - Callback when selection changes (optional)
 * @param {boolean} options.positionFixed - Whether dropdown should be positioned fixed
 */
function createVersionFilter(options) {
  var wrapper = options.wrapper;
  var btn = wrapper.querySelector('.version-filter-btn');
  var dropdown = wrapper.querySelector('.version-filter-dropdown');
  var optionsList = wrapper.querySelectorAll('.version-filter-option');
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
    
    optionsList[selectedIndex].focus();
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
    optionsList.forEach(function(opt, i) {
      opt.setAttribute('aria-selected', i === index);
    });
    selectedIndex = index;
    var value = optionsList[index].dataset.value;
    var text = optionsList[index].textContent;
    if (btnText) btnText.textContent = text;
    closeDropdown();
    
    if (options.onChange) options.onChange(value, text);
  }

  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    if (isOpen) closeDropdown();
    else openDropdown();
  });

  optionsList.forEach(function(opt, index) {
    opt.addEventListener('click', function() {
      selectOption(index);
    });

    opt.addEventListener('keydown', function(e) {
      switch(e.key) {
        case 'Enter':
        case ' ':
          e.preventDefault();
          selectOption(index);
          break;
        case 'ArrowDown':
          e.preventDefault();
          var nextIndex = Math.min(index + 1, optionsList.length - 1);
          optionsList[nextIndex].focus();
          break;
        case 'ArrowUp':
          e.preventDefault();
          var prevIndex = Math.max(index - 1, 0);
          optionsList[prevIndex].focus();
          break;
        case 'Home':
          e.preventDefault();
          optionsList[0].focus();
          break;
        case 'End':
          e.preventDefault();
          optionsList[optionsList.length - 1].focus();
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

  btn.addEventListener('keydown', function(e) {
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

  document.addEventListener('click', function(e) {
    if (isOpen && !wrapper.contains(e.target)) closeDropdown();
  });
}
