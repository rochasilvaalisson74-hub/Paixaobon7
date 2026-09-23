const SUPABASE_URL = "https://sxkcpljlkqmnvkvebmma.supabase.co";
const SUPABASE_KEY = "sb_publishable_7_nC0im2FRozidAwQfBoqA_esAWhSjs";

const ADMIN_EMAIL = "paixaobon@gmail.com";
const BUCKET = "produtos";

const PIX_KEY = "7c868247-e256-4bab-894a-10e7a242a63a";
const WHATSAPP = "5516981721867";

let products = [];
let cart = [];
let adminSession = null;

function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

/* =========================
   AUTENTICAÇÃO
========================= */

async function loginAdmin() {
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value;

  if (!email || !password) {
    alert("Digite o e-mail e a senha.");
    return;
  }

  if (email.toLowerCase() !== ADMIN_EMAIL) {
    alert("Este e-mail não tem acesso ao painel administrativo.");
    return;
  }

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        password
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error(data);
    alert("Não foi possível entrar. Confira o e-mail e a senha.");
    return;
  }

  if (
    !data.user ||
    !data.user.email ||
    data.user.email.toLowerCase() !== ADMIN_EMAIL
  ) {
    alert("Acesso administrativo não autorizado.");
    return;
  }

  adminSession = data;

  localStorage.setItem(
    "paixaobon7_admin_session",
    JSON.stringify(data)
  );

  alert("Login administrativo realizado!");

  render();
}

function logoutAdmin() {
  adminSession = null;
  localStorage.removeItem("paixaobon7_admin_session");
  render();
}

function restoreAdminSession() {
  try {
    const saved = localStorage.getItem(
      "paixaobon7_admin_session"
    );

    if (!saved) return;

    const session = JSON.parse(saved);

    if (
      session &&
      session.user &&
      session.user.email &&
      session.user.email.toLowerCase() === ADMIN_EMAIL
    ) {
      adminSession = session;
    }
  } catch (error) {
    console.error(error);
    localStorage.removeItem("paixaobon7_admin_session");
  }
}

/* =========================
   PRODUTOS
========================= */

async function loadProducts() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/produtos?ativo=eq.true&select=*`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error("Não foi possível carregar os produtos.");
  }

  products = await response.json();

  render();
}

/* =========================
   UPLOAD DE IMAGEM
========================= */

async function uploadProductImage() {
  if (!adminSession || !adminSession.access_token) {
    alert("Faça login como administrador primeiro.");
    return;
  }

  const fileInput = document.getElementById("product-image");

  if (!fileInput || !fileInput.files.length) {
    alert("Selecione uma imagem.");
    return;
  }

  const file = fileInput.files[0];

  if (!file.type.startsWith("image/")) {
    alert("Selecione somente uma imagem.");
    return;
  }

  const extension =
    file.name.split(".").pop().toLowerCase() || "jpg";

  const fileName =
    `produto-${Date.now()}.${extension}`;

  const uploadResponse = await fetch(
    `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${adminSession.access_token}`,
        "Content-Type": file.type,
        "x-upsert": "true"
      },

      body: file
    }
  );

  if (!uploadResponse.ok) {
    const error = await uploadResponse.text();

    console.error(error);

    alert(
      "Não foi possível enviar a imagem. Verifique as políticas do bucket."
    );

    return;
  }

  const imageUrl =
    `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

  const urlElement =
    document.getElementById("uploaded-image-url");

  if (urlElement) {
    urlElement.value = imageUrl;
  }

  alert("Imagem enviada com sucesso!");

  loadProducts().catch(console.error);
}

/* =========================
   PAINEL ADMIN
========================= */

function adminPanel() {
  if (!adminSession) {
    return `
      <section class="admin">

        <h2>Área do administrador</h2>

        <input
          id="admin-email"
          type="email"
          placeholder="E-mail do administrador"
          value="${ADMIN_EMAIL}"
        >

        <input
          id="admin-password"
          type="password"
          placeholder="Senha do administrador"
        >

        <button onclick="loginAdmin()">
          Entrar como administrador
        </button>

      </section>
    `;
  }

  return `
    <section class="admin">

      <h2>Painel administrativo</h2>

      <p>
        Administrador:
        <strong>${ADMIN_EMAIL}</strong>
      </p>

      <h3>Enviar foto de produto</h3>

      <input
        id="product-image"
        type="file"
        accept="image/*"
      >

      <button onclick="uploadProductImage()">
        Enviar imagem
      </button>

      <input
        id="uploaded-image-url"
        type="text"
        readonly
        placeholder="URL da imagem aparecerá aqui"
      >

      <button onclick="logoutAdmin()">
        Sair do administrador
      </button>

    </section>
  `;
}

/* =========================
   INTERFACE
========================= */

function render() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <main class="container">

      <header class="hero">
        <h1>Paixãobon7</h1>
        <p>Produtos, cursos e soluções.</p>
        <p>Uma experiência simples e profissional.</p>
      </header>

      ${adminPanel()}

      <section>
        <h2>Produtos</h2>

        <div class="products">
          ${
            products.length
              ? products.map(product => `
                <article class="product">

                  ${
                    product.imagem_url
                      ? `
                        <img
                          src="${product.imagem_url}"
                          alt="${product.nome}"
                        >
                      `
                      : ""
                  }

                  <h3>${product.nome}</h3>

                  <p>${product.descricao || ""}</p>

                  <strong>
                    ${money(product.preco)}
                  </strong>

                  <button onclick="addToCart(${product.id})">
                    Adicionar ao pedido
                  </button>

                </article>
              `).join("")
              : "<p>Nenhum produto disponível no momento.</p>"
          }
        </div>
      </section>

      <section class="cart">

        <h2>Seu pedido</h2>

        <div id="cart-items"></div>

        <h3>
          Total:
          <span id="cart-total">R$ 0,00</span>
        </h3>

        ${
          cart.length
            ? `
              <input
                id="cliente-nome"
                type="text"
                placeholder="Seu nome"
              >

              <input
                id="cliente-telefone"
                type="tel"
                placeholder="Seu telefone"
              >

              <input
                id="cliente-endereco"
                type="text"
                placeholder="Seu endereço"
              >

              <input
                id="cliente-cidade"
                type="text"
                placeholder="Sua cidade"
              >

              <input
                id="cliente-cep"
                type="text"
                placeholder="Seu CEP"
              >

              <button
                onclick="checkout()"
                class="checkout"
              >
                Finalizar pedido
              </button>
            `
            : ""
        }

      </section>

      <section class="pix">

        <h2>Pagamento via Pix</h2>

        <p>Chave Pix:</p>

        <div class="pix-key">
          ${PIX_KEY}
        </div>

        <button onclick="copyPix()">
          Copiar chave Pix
        </button>

      </section>

      <footer>
        <p>Paixãobon7 © 2026</p>
      </footer>

    </main>
  `;

  renderCart();
}

/* =========================
   CARRINHO
========================= */

function addToCart(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  cart.push(product);

  render();
}

function removeFromCart(index) {
  cart.splice(index, 1);

  render();
}

function renderCart() {
  const items = document.getElementById("cart-items");
  const totalElement = document.getElementById("cart-total");

  if (!items || !totalElement) return;

  if (cart.length === 0) {
    items.innerHTML = "<p>Seu carrinho está vazio.</p>";
    totalElement.textContent = money(0);
    return;
  }

  items.innerHTML = cart.map((product, index) => `
    <div class="cart-item">

      <span>
        ${product.nome} — ${money(product.preco)}
      </span>

      <button onclick="removeFromCart(${index})">
        Remover
      </button>

    </div>
  `).join("");

  const total = cart.reduce(
    (sum, product) => sum + Number(product.preco),
    0
  );

  totalElement.textContent = money(total);
}

/* =========================
   CHECKOUT
========================= */

async function checkout() {
  if (cart.length === 0) {
    alert("Adicione um produto ao pedido.");
    return;
  }

  const nome =
    document.getElementById("cliente-nome").value.trim();

  const telefone =
    document.getElementById("cliente-telefone").value.trim();

  const endereco =
    document.getElementById("cliente-endereco").value.trim();

  const cidade =
    document.getElementById("cliente-cidade").value.trim();

  const cep =
    document.getElementById("cliente-cep").value.trim();

  if (!nome || !telefone || !endereco || !cidade || !cep) {
    alert("Preencha todos os dados do pedido.");
    return;
  }

  const total = cart.reduce(
    (sum, product) => sum + Number(product.preco),
    0
  );

  const pedidoResponse = await fetch(
    `${SUPABASE_URL}/rest/v1/pedidos`,
    {
      method: "POST",

      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },

      body: JSON.stringify({
        nome_cliente: nome,
        telefone: telefone,
        endereco: endereco,
        cidade: cidade,
        cep: cep,
        total: total,
        status: "aguardando_pagamento"
      })
    }
  );

  if (!pedidoResponse.ok) {
    const error = await pedidoResponse.text();

    console.error(error);

    alert("Não foi possível criar o pedido.");

    return;
  }

  const pedido = await pedidoResponse.json();

  const pedidoId = pedido[0].id;

  for (const product of cart) {
    const itemResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/itens_pedido`,
      {
        method: "POST",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          pedido_id: pedidoId,
          produto_id: product.id,
          nome_produto: product.nome,
          quantidade: 1,
          preco: product.preco
        })
      }
    );

    if (!itemResponse.ok) {
      console.error(await itemResponse.text());
    }
  }

  const items = cart
    .map(product =>
      `• ${product.nome} — ${money(product.preco)}`
    )
    .join("\n");

  const message =
`Olá! Quero fazer um pedido na Paixãobon7.

Pedido: #${pedidoId}

Cliente: ${nome}
Telefone: ${telefone}

${items}

Total: ${money(total)}

Pagamento via Pix.

Chave Pix:
${PIX_KEY}`;

  const whatsappUrl =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  window.open(whatsappUrl, "_blank");

  cart = [];

  render();
}

/* =========================
   PIX
========================= */

function copyPix() {
  navigator.clipboard
    .writeText(PIX_KEY)
    .then(() => {
      alert("Chave Pix copiada!");
    })
    .catch(() => {
      alert("Não foi possível copiar automaticamente.");
    });
}

/* =========================
   INICIALIZAÇÃO
========================= */

restoreAdminSession();

loadProducts().catch(error => {
  console.error(error);

  document.getElementById("app").innerHTML = `
    <main class="container">

      <h1>Paixãobon7</h1>

      <p>
        Não foi possível carregar os produtos.
      </p>

      <button onclick="location.reload()">
        Tentar novamente
      </button>

    </main>
  `;
});
