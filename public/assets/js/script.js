// PANIER

// Définition des variables globales
let cartItems = [];
let cartTotal = 0;

// Charge les données du panier depuis le stockage local
function loadCartFromStorage() {
    const cartDataJSON = sessionStorage.getItem('cartData');
    if (cartDataJSON) {
        const cartData = JSON.parse(cartDataJSON);
        cartItems = cartData.cartItems;
        cartTotal = cartData.cartTotal;
        console.log('Données du panier chargées depuis la session :', cartItems, cartTotal);
        updateCartView(cartItems, cartTotal);
    }
}

// Mettre à jour la vue du panier
// Variable pour stocker le contenu du panier
let cartContent = '';

function updateCartView() {
    const cartItemsElement = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    
    // Réinitialiser cartContent à chaque mise à jour
    cartContent = '';

    // Créer le contenu du panier
    cartItems.forEach(item => {
        const productElement = document.createElement('div');
        productElement.classList.add('product');
        productElement.setAttribute('data-id', item.id);
        productElement.innerHTML = `
            <img src="/assets/images/${item.picture}" alt="Image de ${item.name}">
            <p style="color: white;">${item.name} - Quantité: ${item.quantity} - Total: €${item.total.toFixed(2)}</p>
            <div class="remove-btn-container">
                <input class="quantity-input" type="number" value="${item.quantity}" min="1">
                <span class="remove-btn text-light" onclick="removeProduct('${item.id}', '${item.quantity}')">Supprimer</span>
            </div>`;
        cartContent += productElement.outerHTML;
    });

    // Afficher le contenu du panier
    cartItemsElement.innerHTML = cartContent;

    // Calculer le total du panier
    let totalPrice = cartItems.reduce((acc, item) => acc + item.total, 0);

    // Mettre à jour le total du panier
    if (cartTotalElement) {
        cartTotalElement.textContent = "Total : €" + totalPrice.toFixed(2);
    } else {
        console.error('Element with ID "cartTotal" not found.');
    }
}
// Sauvegarde le panier dans la session
function saveCartToSession() {
    const sessionData = {
        cartItems: cartItems,
        cartTotal: cartTotal
    };
    console.log('Contenu de sessionData :', sessionData); // Ajout du console.log pour vérification

    sessionStorage.setItem('cartData', JSON.stringify(sessionData));
}

// Ajoute un produit au panier
function addToCart(id, name, price, picture, quantity) {
    const existingItem = cartItems.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.total += price * quantity;
    } else {
        const newItem = {
            id: id,
            name: name,
            quantity: quantity,
            price: price,
            total: price * quantity,
            picture: picture
        };
        cartItems.push(newItem);
    }

    // Mettre à jour le stock du produit
    updateProductStock(id, -quantity); // Soustraire la quantité du stock

    cartTotal = cartItems.reduce((acc, item) => acc + item.total, 0); // Recalcule le total du panier

    updateCartView();
    saveCartToSession(); 

    alert('Article ajouté au panier');
}

// Supprime un produit du panier en fonction de la quantité spécifiée
function removeProduct(id) {
    const index = cartItems.findIndex(item => item.id === id);
    if (index !== -1) {
        const item = cartItems[index];
        const itemPrice = item.price;

        // Vérifie si la quantité de l'article dans le panier est supérieure à 1
        if (item.quantity > 1) {
            item.quantity--; // Réduit la quantité de 1
            item.total -= itemPrice; // Réduit le total d'un montant équivalent au prix de l'article
        } else {
            // Si la quantité est 1 ou moins, supprime complètement l'article du panier
            cartItems.splice(index, 1);
        }

        // Met à jour le total du panier
        cartTotal -= itemPrice;

        // Met à jour la vue du panier et sauvegarde les données dans la session
        updateCartView();
        saveCartToSession();
    }
}


// Mettre à jour le stock du produit
function updateProductStock(productId, quantity) {
    // Envoyer une requête AJAX à la route de mise à jour du stock dans Symfony
    fetch(`/update-stock/${productId}/${quantity}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erreur lors de la mise à jour du stock du produit');
        }
        // La mise à jour du stock a réussi
        console.log(`Le stock du produit avec l'ID ${productId} a été mis à jour avec succès`);
    })
    .catch(error => {
        console.error('Erreur :', error);
    });
}

// Fonction pour incrémenter la quantité
function incrementQuantity(button) {
    const input = button.parentNode.querySelector('.quantity-input');
    input.value = parseInt(input.value) + 1;
}

// Fonction pour décrémenter la quantité
function decrementQuantity(button) {
    const input = button.parentNode.querySelector('.quantity-input');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}


// Sélection des boutons "Ajouter au panier"
const addToCartButtons = document.querySelectorAll('.btn-add-to-cart');

// Boucle à travers chaque bouton et ajoute un gestionnaire d'événement pour le clic
addToCartButtons.forEach(button => {
    button.addEventListener('click', function () {
        // Récupére les informations du produit à partir des attributs de données HTML
        const productId = button.getAttribute('data-id');
        const productName = button.getAttribute('data-name');
        const productPrice = parseFloat(button.getAttribute('data-price'));
        const productPicture = button.getAttribute('data-picture');

        // Récupérer la quantité depuis l'élément d'entrée de quantité correspondant
        const quantityInput = button.parentNode.querySelector('.quantity-input');
        const quantity = parseInt(quantityInput.value);

        // Ajoute le produit au panier avec les informations récupérées
        addToCart(productId, productName, productPrice, productPicture, quantity);
    });
});

// Charge le panier depuis la session lors du chargement de la page
window.addEventListener('load', function() {
    loadCartFromStorage(); // Chargez d'abord le panier depuis la session
});

// COMMANDE

function commander() {
    // Récupére le formulaire par son ID
    const orderForm = document.getElementById('orderForm');
    
    // Vérifie si le formulaire est trouvé
    if (orderForm) {
         // Récupére les IDs et les quantités des produits depuis votre panier
         const productIds = cartItems.map(item => item.id);
         
         // Met à jour les valeurs des champs de formulaire cachés avec les IDs et les quantités des produits
         document.getElementById('productIds').value = productIds.join(',');
        
        // Soumet le formulaire en utilisant la méthode POST
        // avec l'URL générée par Twig
        orderForm.setAttribute('action', '/confirm_order');
        orderForm.setAttribute('method', 'post');
        orderForm.submit();
    } else {
        console.error('Le formulaire de commande est introuvable.');
    }
}

// gestionnaire d'événements
document.querySelector('.btn2').addEventListener('click', function() {
    commander();
});
