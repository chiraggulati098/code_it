require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});

let editor;

require(['vs/editor/editor.main'], function() {
    // Initialize Monaco Editor
    editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: '# Read input and print output\n',
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: {
            enabled: false
        },
        fontSize: 16,  // Increased font size
        lineHeight: 24,  // Adjusted line height
        fontFamily: '"Source Code Pro", Menlo, Monaco, Consolas, "Courier New", monospace',
        fontWeight: '400',
        // Optional: increase the letter spacing slightly
        letterSpacing: 0.5,
        // Optional: make the cursor wider
        cursorWidth: 2
    });

    // Handle language change
    document.getElementById('language-select').addEventListener('change', function(e) {
        const language = e.target.value;
        monaco.editor.setModelLanguage(editor.getModel(), language);
    });

    // Handle Run/Submit button click
    async function runCode(isSubmission = false) {
        const code = editor.getValue();
        const language = document.getElementById('language-select').value;
        
        // Show loading state
        const resultsContainer = document.getElementById('results-container') || 
            document.createElement('div');
        resultsContainer.id = 'results-container';
        resultsContainer.innerHTML = 'Running code...';
        document.querySelector('.code-editor-section').appendChild(resultsContainer);
        
        try {
            console.log('Sending request to backend...'); // Debug log
            const response = await fetch('http://127.0.0.1:5000/run', {  // Updated URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    language: language,
                    isSubmission: isSubmission
                })
            });

            console.log('Response received:', response); // Debug log

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Response data:', data); // Debug log
            
            // Display results
            showResults(data.results, isSubmission);
            
        } catch (error) {
            console.error('Error details:', error); // More detailed error logging
            showError(`Failed to run code. Error: ${error.message}`);
        }
    }

    function showResults(results, isSubmission) {
        let resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'results-container';
            document.querySelector('.code-editor-section').appendChild(resultsContainer);
            
            // Create and show vertical resizer when results first appear
            let verticalResizer = document.querySelector('.vertical-resizer');
            if (!verticalResizer) {
                verticalResizer = document.createElement('div');
                verticalResizer.className = 'vertical-resizer';
                document.querySelector('.code-editor-section').appendChild(verticalResizer);
            }
        }

        resultsContainer.innerHTML = '';
        
        results.forEach((result, index) => {
            const resultDiv = document.createElement('div');
            resultDiv.className = `test-case ${result.passed ? 'passed' : 'failed'}`;
            
            resultDiv.innerHTML = `
                <h4>Test Case ${index + 1}</h4>
                <div class="test-details">
                    <div class="input-display">Input:<br>${result.input}</div>
                    <div>Expected: ${result.expected_output}</div>
                    <div>Your Output: ${result.actual_output || 'N/A'}</div>
                    ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
                </div>
            `;
            
            resultsContainer.appendChild(resultDiv);
        });
    }

    function showError(message) {
        let resultsContainer = document.getElementById('results-container');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'results-container';
            document.querySelector('.code-editor-section').appendChild(resultsContainer);
        }

        resultsContainer.innerHTML = `<div class="error">${message}</div>`;
    }

    document.getElementById('run-code').addEventListener('click', () => runCode(false));
    document.getElementById('submit-code').addEventListener('click', () => runCode(true));

    // Add this after Monaco editor initialization
    function initializeResizer() {
        const resizer = document.createElement('div');
        resizer.className = 'resizer';
        document.querySelector('.problem-page').appendChild(resizer);

        let isResizing = false;
        let startX;
        let startWidth;

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.pageX;
            startWidth = document.querySelector('.problem-description').offsetWidth;
            resizer.classList.add('active');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const width = startWidth + (e.pageX - startX);
            const containerWidth = document.querySelector('.problem-page').offsetWidth;
            
            // Calculate width as percentage
            const widthPercentage = (width / containerWidth) * 100;
            
            // Limit width between 20% and 80%
            if (widthPercentage >= 20 && widthPercentage <= 80) {
                document.querySelector('.problem-description').style.flexBasis = `${widthPercentage}%`;
                resizer.style.left = `${widthPercentage}%`;
                
                // Trigger Monaco editor resize
                if (editor) {
                    editor.layout();
                }
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            resizer.classList.remove('active');
        });
    }

    // Call this after Monaco editor is initialized
    initializeResizer();

    // Add this after initializeResizer()
    function initializeVerticalResizer() {
        const verticalResizer = document.createElement('div');
        verticalResizer.className = 'vertical-resizer';
        document.querySelector('.code-editor-section').appendChild(verticalResizer);

        let isResizing = false;
        let startY;
        let startHeight;
        let editorSection = document.querySelector('.code-editor-section');
        let resultsContainer = document.getElementById('results-container');

        verticalResizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.pageY;
            startHeight = resultsContainer ? resultsContainer.offsetHeight : 200;
            verticalResizer.classList.add('active');
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const deltaY = startY - e.pageY;
            const newHeight = Math.max(100, Math.min(startHeight + deltaY, editorSection.offsetHeight - 100));
            
            if (resultsContainer) {
                resultsContainer.style.height = `${newHeight}px`;
                verticalResizer.style.bottom = `${newHeight}px`;
            }

            // Trigger Monaco editor resize
            if (editor) {
                editor.layout();
            }
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
            verticalResizer.classList.remove('active');
        });
    }

    // Call this after Monaco editor is initialized
    initializeVerticalResizer();
}); 