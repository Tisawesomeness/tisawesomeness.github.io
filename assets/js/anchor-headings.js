var lastHighlighted = null;

function highlightHeader(headerId) {
  var header = document.getElementById(headerId);
  if (!header) return;
  if (lastHighlighted && lastHighlighted !== header) {
    lastHighlighted.classList.remove('highlighted');
  }
  header.classList.add('highlighted');
  lastHighlighted = header;
  header.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', function (e) {
  var octicon = e.target.closest('.octicon');
  if (!octicon) return;
  var anchor = octicon.closest('.anchor');
  if (!anchor) return;
  var href = anchor.getAttribute('href');
  if (!href) return;
  e.preventDefault();
  var headerId = href.substring(1);
  history.pushState(null, '', location.href.split('#')[0] + href);
  highlightHeader(headerId);
  var url = location.href.split('#')[0] + href;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url);
  } else {
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
});

window.addEventListener('hashchange', function () {
  var headerId = window.location.hash.substring(1);
  highlightHeader(headerId);
});

document.addEventListener('DOMContentLoaded', function() {
  if (window.location.hash) {
    var headerId = window.location.hash.substring(1);
    highlightHeader(headerId);
  }
});