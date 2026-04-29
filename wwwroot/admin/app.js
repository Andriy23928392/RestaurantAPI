// Коли сторінка завантажилася, запускаємо наші функції
document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupReservationForm();
});

let cart = [];

// === 1. ЗАВАНТАЖЕННЯ МЕНЮ З БЕКЕНДУ ===
async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    
    try {
        const response = await fetch('/api/menu'); // Звертаємось до твого C# контролера
        if (!response.ok) throw new Error('Помилка сервера');
        
        const menuItems = await response.json();
        grid.innerHTML = ''; // Очищаємо текст "Завантаження..."

        // Фільтруємо і рендеримо
        menuItems.filter(item => item.isAvailable).forEach(item => {
            const card = document.createElement('div');
            card.className = 'menu-card';
            
            // Якщо картинки немає, ставимо сірий фон
            const bgImage = item.imageUrl ? url('${item.imageUrl}') : 'none';
            
            card.innerHTML = 
                <div class="card-image" style="background-image: ${bgImage}"></div>
                <div class="card-content">
                    <h3>${item.name}</h3>
                    <p class="calories">КБЖВ: ${item.calories} ккал</p>
                    <p class="price">${item.price.toFixed(2)} грн</p>
                    <button class="btn-primary btn-sm" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
                        Додати в кошик
                    </button>
                </div>
            ;
            grid.appendChild(card);
        });
        
    } catch (error) {
        grid.innerHTML = '<p style="color: red;">Помилка завантаження меню. Перевірте, чи запущено бекенд.</p>';
        console.error(error);
    }
}

// === 2. ЛОГІКА КОШИКА ===
function addToCart(id, name, price) {
    cart.push({ id, name, price });
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}

function renderCart() {
    const cartItemsList = document.getElementById('cart-items');
    const totalPriceSpan = document.getElementById('total-price');
    
    cartItemsList.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<li class="empty-cart">Кошик порожній</li>';
    } else {
        cart.forEach((item, index) => {
            total += item.price;
            const li = document.createElement('li');
            li.innerHTML = 
                <span>${item.name}</span>
                <span>
                    <strong>${item.price.toFixed(2)} грн</strong>
                    <button class="delete-btn" onclick="removeFromCart(${index})">✖</button>
                </span>
            ;
            cartItemsList.appendChild(li);
        });
    }

    totalPriceSpan.textContent = total.toFixed(2);
}

// === 3. БРОНЮВАННЯ ТА ВАЛІДАЦІЯ ===
function setupReservationForm() {
    const dateInput = document.getElementById('bookingDate');
    const form = document.getElementById('reservation-form');
    const msgDiv = document.getElementById('reservation-message');

    // Логіка заборони вибору минулого часу (хитрий обхід часових поясів)
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Зупиняємо перезавантаження сторінки
        
        // Збираємо дані в JSON
        const payload = {
            clientName: document.getElementById('clientName').value,
            phone: document.getElementById('phone').value,
            bookingDate: document.getElementById('bookingDate').value,
            guestsCount: parseInt(document.getElementById('guestsCount').value)
        };

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
                if (response.ok) {
                // Сервер повернув 200 OK
                form.reset();
                msgDiv.textContent = '✅ Столик успішно заброньовано!';
                msgDiv.className = 'success-msg';
                msgDiv.style.display = 'block';
                setTimeout(() => msgDiv.style.display = 'none', 5000); // Ховаємо через 5 сек
            } else {
                // Сервер відхилив запит (400 Bad Request)
                const errorData = await response.json();
                console.warn('Сервер відхилив запит:', errorData);
                alert('Помилка! Перевірте дані (кількість гостей 1-20, дата не в минулому).');
            }
        } catch (error) {
            alert('Помилка з\'єднання. Сервер не відповідає.');
        }
    });
}