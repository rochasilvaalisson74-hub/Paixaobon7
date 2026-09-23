const SUPABASE_URL = "https://sxkcpljlkqmnvkvebmma.supabase.co";
const SUPABASE_KEY = "sb_publishable_7nC0im2FRozidAwQfBoqA_esAWhSjs";

const PIX_KEY = "7c868247-e256-4bab-894a-10e7a242a63a";
const WHATSAPP = "5516981721867";

let products = [];
let cart = [];

function money(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

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

function render() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <main class="container">

      <header class="hero">
        <h1>Paixãobon7</h1>
        <p>Produtos, cursos e soluções.</p>
        <p>Uma experiência simples e profissional.</p>
      </header>

      <section>
        <h2>Produtos</h2>

        <div class="products">
          ${
            products.length
              ? products.map(product => `
                <article class="product">
                  ${
                    product.imagem_url
                      ? `<img src="${product.imagem_url}" alt="${product.nome}">`
                      : ""
                  }

                  <h3>${product.nome}</h3>
                  <p>${product.descricao || ""}</p>

                  <strong>${money(product.preco)}</strong>

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
              <input id="cliente-nome"
                     type="text"
                     placeholder="Seu nome">

              <input id="cliente-telefone"
                     type="tel"
                     placeholder="Seu telefone">

              <input id="cliente-endereco"
                     type="text"
                     placeholder="Seu endereço">

              <input id="cliente-cidade"
                     type="text"
                     placeholder="Sua cidade">

              <input id="cliente-cep"
                     type="text"
                     placeholder="Seu CEP">

              <button onclick="checkout()" class="checkout">
                Finalizar pedido
              </button>
            `
            : ""
        }
      </section>

      <section class="pix">
        <h2>Pagamento via Pix</h2>
        <p>Chave Pix:</p>

        <div class="pix-key">${PIX_KEY}</div>

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

async function checkout() {
  if (cart.length === 0) {
    alert("Adicione um produto ao pedido.");
    return;
  }

  const nome = document.getElementById("cliente-nome").value.trim();
  const telefone = document.getElementById("cliente-telefone").value.trim();
  const endereco = document.getElementById("cliente-endereco").value.trim();
  const cidade = document.getElementById("cliente-cidade").value.trim();
  const cep = document.getElementById("cliente-cep").value.trim();

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
