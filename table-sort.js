document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('problemSearch');
    if (searchInput) {
        searchInput.addEventListener('input', filterProblems);
    }
});

function filterProblems() {
    const searchInput = document.getElementById('problemSearch');
    const filter = searchInput.value.toLowerCase();
    const table = document.getElementById('problems-table');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const problemName = rows[i].getElementsByTagName('td')[1];
        if (problemName) {
            const textValue = problemName.textContent || problemName.innerText;
            if (textValue.toLowerCase().indexOf(filter) > -1) {
                rows[i].style.display = '';
            } else {
                rows[i].style.display = 'none';
            }
        }
    }
}

function sortTable(columnIndex) {
    const table = document.getElementById('problems-table');
    const tbody = table.getElementsByTagName('tbody')[0];
    const rows = Array.from(tbody.getElementsByTagName('tr'));
    const isAscending = table.getElementsByTagName('th')[columnIndex].innerHTML.includes('▼');

    // Update sort indicator
    const headers = table.getElementsByTagName('th');
    headers[columnIndex].innerHTML = headers[columnIndex].innerHTML.replace(
        isAscending ? '▼' : '▲',
        isAscending ? '▲' : '▼'
    );

    rows.sort((a, b) => {
        let aValue = a.getElementsByTagName('td')[columnIndex].innerText;
        let bValue = b.getElementsByTagName('td')[columnIndex].innerText;

        // Handle difficulty column sorting
        if (columnIndex === 2) {
            const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
            aValue = difficultyOrder[aValue];
            bValue = difficultyOrder[bValue];
        } else {
            // For S.No column, convert to numbers
            aValue = parseInt(aValue);
            bValue = parseInt(bValue);
        }

        if (isAscending) {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    // Reorder the rows in the table
    rows.forEach(row => tbody.appendChild(row));
}
