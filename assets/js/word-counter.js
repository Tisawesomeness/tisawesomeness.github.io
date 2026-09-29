let sourceCount = 1;

function saveState() {
  const sources = document.querySelectorAll('.source-input');
  const state = [];
  
  sources.forEach(source => {
    const input = source.querySelector('input');
    const textarea = source.querySelector('textarea');
    
    state.push({
      name: input.value.trim(),
      content: textarea.value.trim()
    });
  });
  
  localStorage.setItem('wordCounterState', JSON.stringify(state));
}

function loadState() {
  const savedState = localStorage.getItem('wordCounterState');
  if (!savedState) return;
  
  try {
    const state = JSON.parse(savedState);
    const container = document.getElementById('sources-container');
    container.innerHTML = '';
    
    state.forEach((source, index) => {
      const sourceDiv = document.createElement('div');
      sourceDiv.className = 'source-input';
      sourceDiv.innerHTML = `
        <input type="text" class="source-name" value="${source.name}" placeholder="Enter source name...">
        <textarea placeholder="Enter your text here...">${source.content}</textarea>
      `;
      container.appendChild(sourceDiv);
    });
    
    sourceCount = state.length || 1;
  } catch (e) {
    console.error('Error loading state:', e);
  }
}

function addSource() {
  sourceCount++;
  const container = document.getElementById('sources-container');
  const sourceDiv = document.createElement('div');
  sourceDiv.className = 'source-input';
  sourceDiv.innerHTML = `
    <input type="text" class="source-name" value="Source ${sourceCount}" placeholder="Enter source name...">
    <textarea placeholder="Enter your text here..."></textarea>
  `;
  container.appendChild(sourceDiv);
  saveState();
}

function clearAll() {
  const container = document.getElementById('sources-container');
  container.innerHTML = `
    <div class="source-input">
      <input type="text" class="source-name" value="Source 1" placeholder="Enter source name...">
      <textarea placeholder="Enter your text here..."></textarea>
    </div>
  `;
  sourceCount = 1;
  document.getElementById('results-container').innerHTML = `
    <div class="empty-state">
      Enter some sources and click "Count Words" to see results
    </div>
  `;
  saveState();
}

function countWords() {
  const sources = document.querySelectorAll('.source-input');
  const wordCounts = {};
  
  sources.forEach((source, index) => {
    const input = source.querySelector('input');
    const sourceName = input.value.trim();
    const textarea = source.querySelector('textarea');
    const text = textarea.value.trim();
    
    if (text) {
      const words = text.match(/(\w|\[|\])+/g) || [];
      
      words.forEach(word => {
        if (!wordCounts[word]) {
          wordCounts[word] = {};
        }
        
        if (!wordCounts[word][sourceName]) {
          wordCounts[word][sourceName] = 0;
        }
        
        wordCounts[word][sourceName]++;
      });
    }
  });

  const sortMethod = document.getElementById('sort-select').value;
  const wordFilter = document.getElementById('word-filter').value;
  const sourceFilter = document.getElementById('source-filter').value;
  displayResults(wordCounts, sortMethod, wordFilter, sourceFilter);
}

function displayResults(wordCounts, sortMethod, wordFilter, sourceFilter) {
  const resultsContainer = document.getElementById('results-container');
  
  if (Object.keys(wordCounts).length === 0) {
    resultsContainer.innerHTML = `
      <div class="empty-state">
        No words found in the entered sources
      </div>
    `;
    return;
  }

  const filteredWordCounts = Object.fromEntries(Object.entries(wordCounts).filter(([word, sources]) => {
    return (!wordFilter || word.toLowerCase().includes(wordFilter.toLowerCase())) &&
      (!sourceFilter || Object.keys(sources).some(sourceName => {
        return sourceName.toLowerCase().includes(sourceFilter.toLowerCase())
      }));
  }));

  let sortedWords;
  switch(sortMethod) {
    case 'alpha-asc':
      sortedWords = Object.keys(filteredWordCounts).sort();
      break;
    case 'alpha-desc':
      sortedWords = Object.keys(filteredWordCounts).sort().reverse();
      break;
    case 'alpha-asc-backward':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const reversedA = a.split('').reverse().join('');
        const reversedB = b.split('').reverse().join('');
        return reversedA.localeCompare(reversedB);
      });
      break;
    case 'alpha-desc-backward':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const reversedA = a.split('').reverse().join('');
        const reversedB = b.split('').reverse().join('');
        return reversedB.localeCompare(reversedA);
      });
      break;
    case 'length-asc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const lengthDiff = lengthCountingBracketsAsOneCharacter(a) - lengthCountingBracketsAsOneCharacter(b);
        return lengthDiff !== 0 ? lengthDiff : a.localeCompare(b);
      });
      break;
    case 'length-desc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const lengthDiff = lengthCountingBracketsAsOneCharacter(b) - lengthCountingBracketsAsOneCharacter(a);
        return lengthDiff !== 0 ? lengthDiff : a.localeCompare(b);
      });
      break;
    case 'count-desc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const totalA = Object.values(filteredWordCounts[a]).reduce((sum, count) => sum + count, 0);
        const totalB = Object.values(filteredWordCounts[b]).reduce((sum, count) => sum + count, 0);
        const countDiff = totalB - totalA;
        return countDiff !== 0 ? countDiff : a.localeCompare(b);
      });
      break;
    case 'count-asc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        const totalA = Object.values(filteredWordCounts[a]).reduce((sum, count) => sum + count, 0);
        const totalB = Object.values(filteredWordCounts[b]).reduce((sum, count) => sum + count, 0);
        const countDiff = totalA - totalB;
        return countDiff !== 0 ? countDiff : a.localeCompare(b);
      });
      break;
    case 'sources-desc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        let totalA = Object.values(filteredWordCounts[a]).length;
        let totalB = Object.values(filteredWordCounts[b]).length;
        let countDiff = totalB - totalA;
        if (countDiff !== 0) {
          return countDiff;
        }
        totalA = Object.values(filteredWordCounts[a]).reduce((sum, count) => sum + count, 0);
        totalB = Object.values(filteredWordCounts[b]).reduce((sum, count) => sum + count, 0);
        countDiff = totalB - totalA;
        return countDiff !== 0 ? countDiff : a.localeCompare(b);
      });
      break;
    case 'sources-asc':
      sortedWords = Object.keys(filteredWordCounts).sort((a, b) => {
        let totalA = Object.values(filteredWordCounts[a]).length;
        let totalB = Object.values(filteredWordCounts[b]).length;
        let countDiff = totalA - totalB;
        if (countDiff !== 0) {
          return countDiff;
        }
        totalA = Object.values(filteredWordCounts[a]).reduce((sum, count) => sum + count, 0);
        totalB = Object.values(filteredWordCounts[b]).reduce((sum, count) => sum + count, 0);
        countDiff = totalA - totalB;
        return countDiff !== 0 ? countDiff : a.localeCompare(b);
      });
      break;
    default:
      sortedWords = Object.keys(wordCounts).sort();
  }

  let tableHTML = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Word</th>
          <th>Sources</th>
        </tr>
      </thead>
      <tbody>
  `;

  sortedWords.forEach(word => {
    const sources = wordCounts[word];
    const sourceEntries = Object.entries(sources)
      .map(([sourceName, count]) => {
        if (count === 1) {
          return sourceName;
        } else {
          return `${sourceName} x${count}`;
        }
      })
      .join(', ');

    tableHTML += `
      <tr>
        <td class="word-count">${word}</td>
        <td>${sourceEntries}</td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  resultsContainer.innerHTML = tableHTML;
  document.getElementById("copy").disabled = false;
}

function copyTableToClipboard() {
  const resultsContainer = document.getElementById('results-container');
  const table = resultsContainer.querySelector('.results-table');
  
  if (!table) {
    alert('No table found to copy. Please count words first.');
    return;
  }

  // Create a temporary div to hold the table for processing
  const tempDiv = document.createElement('div');
  tempDiv.appendChild(table.cloneNode(true));
  
  // Process the table as TSV
  let tsv = '';
  const rows = tempDiv.querySelectorAll('tr');

  // Skip the first row (header)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    let rowText = [];
    
    cells.forEach(cell => {
      // Get cell text and replace tabs/newlines with spaces
      let cellText = cell.textContent.replace(/\t/g, ' ').replace(/\n/g, ' ').trim();
      // Remove extra spaces between words
      cellText = cellText.replace(/\s+/g, ' ');
      rowText.push(cellText);
    });
    
    tsv += rowText.join('\t') + '\n';
  }
  
  // Remove trailing newline
  tsv = tsv.trim();

  // Create a textarea to hold the TSV for copying
  const textarea = document.createElement('textarea');
  textarea.value = tsv;
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    // Copy to clipboard
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    if (successful) {
      // Show success feedback
      const button = event.target;
      const originalText = button.textContent;
      button.textContent = 'Copied!';
      button.style.background = '#28a745';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
      }, 2000);
    } else {
      alert('Failed to copy table to clipboard');
    }
  } catch (err) {
    document.body.removeChild(textarea);
    alert('Failed to copy table to clipboard: ' + err.message);
  }
}

function lengthCountingBracketsAsOneCharacter(str) {
  let count = 0;
  let inBrackets = false;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if (char === '[') {
      inBrackets = true;
      count++; // count the entire bracketed group as one character
    } else if (char === ']') {
      inBrackets = false;
    } else if (!inBrackets) {
      count++;
    }
  }

  return count;
}

document.addEventListener('input', function(e) {
  if (e.target.classList.contains('source-name') || e.target.tagName === 'TEXTAREA') {
    saveState();
  }
});

document.addEventListener('DOMContentLoaded', function() {
  loadState();
});

document.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'Enter':
        e.preventDefault();
        countWords();
        break;
    }
  }
});