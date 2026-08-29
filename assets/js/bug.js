/**
 * Creates a bug link dropdown controller
 * @param {Object} options - Configuration options
 * @param {HTMLElement} options.wrapper - The wrapper element containing the bug link
 * @param {Function} options.onChange - Callback when selection changes (optional)
 * @param {boolean} options.positionFixed - Whether dropdown should be positioned fixed
 */
function createBugDropdown(options) {
  var wrapper = options.wrapper;
  var link = wrapper.querySelector('.bug-link');
  var dropdown = wrapper.querySelector('.bug-dropdown');
  var isOpen = false;

  function openDropdown() {
    isOpen = true;
    link.setAttribute('aria-expanded', 'true');
    dropdown.hidden = false;
    dropdown.style.display = 'block';
  }

  function closeDropdown() {
    isOpen = false;
    link.setAttribute('aria-expanded', 'false');
    dropdown.hidden = true;
    dropdown.style.display = 'none';
  }

  link.addEventListener('click', function(e) {
    e.preventDefault();
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    if (isOpen && !wrapper.contains(e.target)) {
      closeDropdown();
    }
  });

  // Optional: handle keyboard navigation
  link.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault();
      closeDropdown();
    }
  });
}

document.querySelectorAll('.bug-link-container').forEach(function(wrapper) {
  createBugDropdown({ wrapper: wrapper });
});