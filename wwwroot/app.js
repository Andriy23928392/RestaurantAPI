document.addEventListener('DOMContentLoaded', () => {
    loadMenu();
    setupReservationForm();
});

let allDishes = [];
let cart = [];

function goToCheckout() {
    if (cart.length === 0) {
        alert('Ваш кошик порожній! Додайте хоча б одну страву для бронювання.');
        return;
    }
    document.getElementById('view-menu').classList.add('hidden');
    document.getElementById('view-checkout').classList.remove('hidden');
    window.scrollTo(0, 0); 
}

function goToMenu() {
    document.getElementById('view-checkout').classList.add('hidden');
    document.getElementById('view-menu').classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function loadMenu() {
    const grid = document.getElementById('menu-grid');
    const sidebar = document.getElementById('category-sidebar'); // Знаходимо сайдбар
    
    try {
        const response = await fetch('/api/menu');
        if (!response.ok) throw new Error('Помилка сервера');

        const menuItems = await response.json();
        allDishes = menuItems;
        grid.innerHTML = ''; 
        if(sidebar) sidebar.innerHTML = ''; // Очищаємо сайдбар перед завантаженням

        const categories = menuItems.reduce((acc, item) => {
            if (!acc[item.category]) acc[item.category] = [];
            acc[item.category].push(item);
            return acc;
        }, {});

        for (const categoryName in categories) {
            const categoryId = `cat-${categoryName.replace(/\s+/g, '-')}`;

            if (sidebar) {
                const link = document.createElement('a');
                link.href = `#${categoryId}`;
                link.className = 'sidebar-link';
                link.textContent = categoryName;
                sidebar.appendChild(link);
            }

            const sectionTitle = document.createElement('h2');
            sectionTitle.className = 'category-title';
            sectionTitle.id = categoryId; 
            sectionTitle.textContent = categoryName;
            grid.appendChild(sectionTitle);

            const categoryGrid = document.createElement('div');
            categoryGrid.className = 'category-grid';

            categories[categoryName].forEach(item => {
                const card = document.createElement('div');
                card.className = `menu-card ${item.isAvailable ? '' : 'out-of-stock'}`;
                const bgImage = item.imageUrl ? `url('${item.imageUrl}')` : 'none';
                
                const clickAction = item.isAvailable ? `onclick="showDishDetails(${item.id})"` : '';
                
                const safeName = item.name.replace(/'/g, "\\'");
                const buttonHtml = item.isAvailable 
                    ? `<button class="btn-primary btn-sm" onclick="addToCart(${item.id}, '${safeName}', ${item.price})">Додати</button>`
                    : `<button class="btn-disabled btn-sm" disabled>Немає в наявності</button>`;
                
                card.innerHTML = `
                    <div class="card-image" style="background-image: ${bgImage}" ${clickAction}></div> 
                    <div class="card-content"> 
                        <h3>${item.name}</h3>
                        <p class="price">${item.price.toFixed(2)} грн</p>
                        ${buttonHtml}
                    </div>
                `;
                categoryGrid.appendChild(card);
            });
            grid.appendChild(categoryGrid);
        }
    } catch (error) {
        grid.innerHTML = '<p style="color: red;">Помилка завантаження меню.</p>';
    }
}
function addToCart(id, name, price) {
    cart.push({ id, name, price });
    renderCart();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
    
    if (cart.length === 0 && !document.getElementById('view-checkout').classList.contains('hidden')) {
        alert('Кошик спорожнів. Повертаємось до меню!');
        goToMenu();
    }
}

function renderCart() {
    const cartItemsList = document.getElementById('cart-items');
    const totalPriceSpan = document.getElementById('total-price');
    const headerCartCount = document.getElementById('header-cart-count'); 
    
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

    if (totalPriceSpan) totalPriceSpan.textContent = total.toFixed(2);
    if (headerCartCount) headerCartCount.textContent = cart.length; 
}

function setupReservationForm() {
    const dateInput = document.getElementById('bookingDate');
    const form = document.getElementById('reservation-form');

    if (!form || !dateInput) return;

    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        
        const payload = {
            clientName: document.getElementById('clientName').value,
            phone: document.getElementById('phone').value,
            bookingDate: document.getElementById('bookingDate').value,
            guestsCount: parseInt(document.getElementById('guestsCount').value),
            dishIds: cart.map(item => item.id) 
        };

        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                form.reset();
                cart = []; 
                renderCart();
                alert('✅ Столик успішно заброньовано! Чекаємо на вас.');
                goToMenu();
            } else {
                const errorData = await response.json();
                let errorMessage = "Увага:\n";
                if (errorData.errors) {
                    for (const key in errorData.errors) {
                        errorMessage += `- ${errorData.errors[key].join(', ')}\n`;
                    }
                } else if (errorData.title) {
                    errorMessage += errorData.title;
                }
                alert(errorMessage);
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
};