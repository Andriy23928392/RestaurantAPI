document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupReservationForm();
});

let allDishes = [];
let cart = [];

async function loadMenu()
{
    const grid = document.getElementById('menu-grid');
    
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Помилка сервера');

        const menuItems = await response.json();
        allDishes = menuItems;
        
        grid.innerHTML = ''; 

        const categories = menuItems.reduce((acc, item) => {
            if (!item.isAvailable) return acc;
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        for (const categoryName in categories) {
            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'category-title';
            sectionTitle.textContent = categoryName;
            grid.appendChild(sectionTitle);

            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'category-grid';

            categories[categoryName].forEach(item => {
                const card = document.createElement('div');
                card.className = 'menu-card';
                const bgImage = item.imageUrl ? `url('${item.imageUrl}')` : 'none';
                
               card.innerHTML = `
                    <div class="card-image" style="background-image: ${bgImage}" onclick="showDishDetails(${item.id})"></div> 
                    <div class="card-content"> <h3>${item.name}</h3>
                        <p class="price">${item.price.toFixed(2)} грн</p>
                        <button class="btn-primary btn-sm" onclick="addToCart(${item.id}, '${item.name}', ${item.price})">
                            Додати
                        </button>
                    </div>
                `;
                categoryGrid.appendChild(card);
            });
            grid.appendChild(categoryGrid);
        }
        
    } catch (error) {
        grid.innerHTML = '<p style="color: red;">Помилка завантаження.</p>';
    }
}

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
            li.innerHTML = `
                <span>${item.name}</span>
                <span>
                    <strong>${item.price.toFixed(2)} грн</strong>
                    <button class="delete-btn" onclick="removeFromCart(${index})">✖</button>
                </span>
            `;
            cartItemsList.appendChild(li);
        });
    }

    totalPriceSpan.textContent = total.toFixed(2);
}

function setupReservationForm() {
    const dateInput = document.getElementById('bookingDate');
    const form = document.getElementById('reservation-form');
    const msgDiv = document.getElementById('reservation-message');

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
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
                form.reset();
                msgDiv.textContent = '✅ Столик успішно заброньовано!';
                msgDiv.className = 'success-msg';
                msgDiv.style.display = 'block';
                setTimeout(() => msgDiv.style.display = 'none', 5000);
            } else {
                const errorData = await response.json();
                console.warn('Сервер відхилив запит:', errorData);
                alert('Помилка! Перевірте дані (кількість гостей 1-20, дата не в минулому).');
            }
        } catch (error) {
            alert('Помилка з\'єднання. Сервер не відповідає.');
        }
    });
}


function showDishDetails(id) {
    const dish = allDishes.find(d => d.id === id);
    if (!dish) return;

    document.getElementById('modalImg').src = dish.imageUrl || '';
    document.getElementById('modalTitle').textContent = dish.name;
    document.getElementById('modalDesc').textContent = dish.description;
    
    document.getElementById('modalCalories').textContent = dish.calories > 0 ? `🔥 Калорійність: ${dish.calories} ккал` : '';

    document.getElementById('dishModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('dishModal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('dishModal');
    if (event.target === modal) {
        closeModal();
    }
}