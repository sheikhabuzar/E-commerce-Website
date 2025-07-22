import { renderComments } from './comment-utils.js';

document.addEventListener('DOMContentLoaded', () => {
  loadProductDetail();
  loadComments();

  const postBtn = document.getElementById('postCommentBtn');
  if (postBtn) {
    postBtn.addEventListener('click', async () => {
      const input = document.getElementById('newCommentInput');
      const commentText = input.value.trim();
      if (!commentText) return;

      const userId = localStorage.getItem("currentUserId");
      const token = localStorage.getItem("jwtToken");

      if (!userId || !token) {
        alert("You must be logged in to comment.");
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/comments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({
            content: commentText,
            productId: new URLSearchParams(window.location.search).get("id"),
            parentCommentId: null
          })
        });

        if (response.ok) {
          input.value = '';
          await loadComments();
          const container = document.getElementById('commentContainer');
          container.scrollTop = container.scrollHeight;
        } else {
          const error = await response.json();
          alert("Failed to post comment: " + (error.error || "Something went wrong."));
        }
      } catch (err) {
        console.error("Network error posting comment:", err);
        alert("Something went wrong. Try again.");
      }
    });
  }
});

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const res = await fetch(`${BACKEND_URL}/api/products/${id}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  const product = await res.json();

  const imageUrl = product.image
    ? `${BACKEND_URL}/uploads/${product.image}`
    : `${BACKEND_URL}/uploads/default.jpg`;
  document.getElementById('productImage').src = imageUrl;

  const container = document.getElementById("productDetail");
  container.innerHTML = `
    <div class="card p-3">
      <div class="product-image mb-3 text-center">
        <img src="${imageUrl}" class="img-fluid rounded" alt="${product.name}" style="max-height:300px; object-fit:contain;" />
      </div>

      <h3 class="product-title">${product.name}</h3>
      <p class="product-price text-danger fs-5">PKR ${product.price}</p>
      <p class="product-description">${product.description}</p>

      <div><strong>Category:</strong> ${product.category || 'N/A'}</div>
      <div><strong>Stock:</strong> ${product.stock}</div>

      <div class="mt-2">
        <button id="likeBtn" class="btn btn-outline-danger">
          🤍 Like (<span id="likeCount">0</span>)
        </button>
      </div>

      <div class="mt-3">
        <strong>Select Size:</strong>
        <div id="sizeButtons" class="d-flex flex-wrap gap-2 mt-2">
          ${product.sizes.map(size => `
            <button type="button" class="btn btn-outline-dark btn-size" onclick="selectSize(this)">
              ${size}
            </button>
          `).join('')}
        </div>
      </div>

      <button id="addToCartBtn" class="btn btn-dark w-100 mt-3">Add to Cart</button>
    </div>
  `;
  // Inject product name into comments heading
  const heading = document.getElementById('commentsHeading');
  if (heading) {
    heading.textContent = `Comments on "${product.name}"`;
  }
  // Event: Add to Cart
  const addToCartBtn = document.getElementById("addToCartBtn");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const selectedSizeButton = document.querySelector(".btn-size.active");
      if (!selectedSizeButton) {
        alert("Please select a size.");
        return;
      }
      const size = selectedSizeButton.innerText;
      addToCart(product, size);
    });
  }

  // ✅ Like Button Logic (after HTML is injected)
  const likeBtn = document.getElementById('likeBtn');
  if (likeBtn) {
    setupLikeFeature(id);
  }
}

async function setupLikeFeature(productId) {
  const likeBtn = document.getElementById('likeBtn');
  const token = localStorage.getItem('jwtToken');

  if (!likeBtn || !token) return;

  // Load like status from backend
  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${productId}/likes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await res.json();
    document.getElementById('likeCount').innerText = data.totalLikes;
    updateLikeButton(data.likedByCurrentUser);
  } catch (err) {
    console.error("Failed to load like info:", err);
  }

  // Handle toggle
  likeBtn.addEventListener('click', async () => {
    try {
      await fetch(`${BACKEND_URL}/api/products/${productId}/like`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      const resLike = await fetch(`${BACKEND_URL}/api/products/${productId}/likes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      const likeData = await resLike.json();
      document.getElementById('likeCount').innerText = likeData.totalLikes;
      updateLikeButton(likeData.likedByCurrentUser);
    } catch (err) {
      console.error("Like toggle error:", err);
    }
  });

  function updateLikeButton(isLiked) {
    if (isLiked) {
      likeBtn.innerHTML = `❤️ Liked (<span id="likeCount">${document.getElementById('likeCount').innerText}</span>)`;
      likeBtn.classList.add('btn-danger');
      likeBtn.classList.remove('btn-outline-danger');
    } else {
      likeBtn.innerHTML = `🤍 Like (<span id="likeCount">${document.getElementById('likeCount').innerText}</span>)`;
      likeBtn.classList.add('btn-outline-danger');
      likeBtn.classList.remove('btn-danger');
    }
  }
}

async function loadComments() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  try {
    const res = await fetch(`${BACKEND_URL}/api/products/${id}/comments`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    const comments = await res.json();

    if (!Array.isArray(comments)) {
      console.warn("⚠️ Comments response is not an array:", comments);
      document.getElementById('commentContainer').innerHTML = '<div class="text-danger">Failed to load comments.</div>';
      return;
    }

    const container = document.getElementById('commentContainer');
    if (!container) return;

    container.innerHTML = '';
    renderComments(comments, container, handleReplySubmit);
  } catch (err) {
    console.error("❌ Failed to load comments:", err);
    document.getElementById('commentContainer').innerHTML = '<div class="text-danger">Error loading comments.</div>';
  }
}

async function handleReplySubmit(parentCommentId, inputElement) {
  const commentText = inputElement.value.trim();
  if (!commentText) return;

  const token = localStorage.getItem("jwtToken");
  const userId = localStorage.getItem("currentUserId");

  if (!token || !userId) {
    alert("You must be logged in to reply.");
    return;
  }

  try {
    const response = await fetch(`/api/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({
        content: commentText,
        productId: new URLSearchParams(window.location.search).get("id"),
        parentCommentId
      })
    });

    if (response.ok) {
      inputElement.value = '';
      await loadComments();
    } else {
      const error = await response.json();
      alert("Failed to post reply: " + (error.error || "Something went wrong."));
    }
  } catch (err) {
    console.error("❌ Network error posting reply:", err);
    alert("Something went wrong. Try again.");
  }
}

function selectSize(button) {
  document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('active', 'btn-dark'));
  button.classList.add('active', 'btn-dark');
}

window.selectSize = selectSize;

function addToCart(product, size) {
  const userId = localStorage.getItem('currentUserId');
  if (!userId) {
    alert("You must be logged in to add items to the cart.");
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart_' + userId)) || [];
  const exists = cart.find(item => item.id === product.id && item.size === size);
  if (exists) {
    exists.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1, size });
  }

  localStorage.setItem('cart_' + userId, JSON.stringify(cart));
  toggleCart();
}
