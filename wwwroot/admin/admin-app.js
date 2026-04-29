document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('menu-tbody');

    async function init() {
        try {
            const response = await fetch('/api/menu');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const dishes = await response.json();
            renderTable(dishes);
        } catch (error) {
            console.error('Помилка завантаження даних:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="error-message">
                        Не вдалося завантажити меню. Перевір консоль та чи запущено локальний сервер.
                    </td>
                </tr>
            `;
        }
    }

    function renderTable(dishes) {
        tableBody.innerHTML = ''; 

        dishes.forEach(dish => {
            const row = document.createElement('tr');

            const statusText = dish.isAvailable ? 'В меню' : 'В стоп-листі';
            const statusClass = dish.isAvailable ? 'status-active' : 'status-inactive';
            const isChecked = dish.isAvailable ? 'checked' : '';

            row.innerHTML = `
                <td><img src="${dish.imageUrl}" alt="${dish.name}" class="dish-img" loading="lazy"></td>
                <td>
                    <div class="dish-name">${dish.name}</div>
                    <div class="dish-desc">${dish.description}</div>
                </td>
                <td>${dish.price.toFixed(2)}</td>
                <td>${dish.calories}</td>
                <td>
                    <div class="status-wrapper">
                        <label class="switch">
                            <input type="checkbox" class="toggle-availability" data-id="${dish.id}" ${isChecked}>
                            <span class="slider"></span>
                        </label>
                        <span class="status-label ${statusClass}" id="status-text-${dish.id}">
                            ${statusText}
                        </span>
                    </div>
                </td>
            `;

            tableBody.appendChild(row);
        });

        attachToggleListeners();
    }

    function attachToggleListeners() {
        const toggles = document.querySelectorAll('.toggle-availability');

        toggles.forEach(toggle => {
            toggle.addEventListener('change', (event) => {
                const checkbox = event.target;
                const dishId = checkbox.getAttribute('data-id');
                const isNowAvailable = checkbox.checked;

                const statusLabel = document.getElementById(`status-text-${dishId}`);

                if (isNowAvailable) {
                    statusLabel.textContent = 'В меню';
                    statusLabel.className = 'status-label status-active';
                } else {
                    statusLabel.textContent = 'В стоп-листі';
                    statusLabel.className = 'status-label status-inactive';
                }

                console.log(`Імітація PUT запиту: id страви = ${dishId}, новий статус isAvailable = ${isNowAvailable}`);
            });
        });
    }

    init();
});