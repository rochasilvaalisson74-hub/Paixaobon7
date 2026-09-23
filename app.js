const SUPABASE_URL = "https://sxkcpljlkqmnvkvebmma.supabase.co";
const SUPABASE_KEY = "sb_publishable_7_nC0im2FRozidAwQfBoqA_esAWhSjs";

const ADMIN_EMAIL = "paixaobon@gmail.com";
const BUCKET = "produtos";

const PIX_KEY = "7c868247-e256-4bab-894a-10e7a242a63a";
const WHATSAPP = "5516981721867";

let products = [];
let cart = [];
let editingProductId = null;


// ======================================================
// UTILIDADES
// ======================================================

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function api(path, options = {}) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
}


// ======================================================
// CARREGAR PRODUTOS
// ======================================================

async function loadProducts() {

  const response = await api("produtos?select=*");

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  products = await response.json();

  if (
    products.length &&
    Object.prototype.hasOwnProperty.call(products[0], "ativo")
  ) {
    products = products.filter(
      product => product.ativo !== false
    );
  }

  renderStore();
}


// ======================================================
// LOJA
// ======================================================

function renderStore() {

  const app = document.getElementById("app");

  if (!app) return;

  app.innerHTML = `

    <main class="container">

      <header class="hero">

        <h1>Paixãobon7</h1>

        <p>Produtos, cursos e soluções.</p>

        <p>
          Uma experiência simples e profissional.
        </p>

        <div style="margin-top:15px">

          <button onclick="scrollToProducts()">
            Ver produtos
          </button>

          <button onclick="openAdmin()">
            Entrar
          </button>

          <button onclick="openWhatsApp()">
            Falar no WhatsApp
          </button>

        </div>

      </header>


      <!-- PRODUTOS -->

      <section id="produtos">

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
                            src="${escapeHtml(product.imagem_url)}"
                            alt="${escapeHtml(product.nome)}"
                          >
                        `
                        : ""
                    }

                    <h3>
                      ${escapeHtml(product.nome)}
                    </h3>

                    <p>
                      ${escapeHtml(product.descricao || "")}
                    </p>

                    <strong>
                      ${money(product.preco)}
                    </strong>

                    <br><br>

                    <button
                      onclick="addToCart('${product.id}')"
                    >
                      Adicionar ao pedido
                    </button>

                  </article>

                `).join("")

              : `
                <p>
                  Nenhum produto disponível no momento.
                </p>
              `
          }

        </div>

      </section>


      <!-- CARRINHO -->

      <section class="cart">

        <h2>Seu pedido</h2>

        <div id="cart-items"></div>

        <h3>
          Total:
          <span id="cart-total">
            R$ 0,00
          </span>
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


      <footer>

        <p>
          Paixãobon7 © 2026
        </p>

      </footer>

    </main>
  `;

  renderCart();
}


// ======================================================
// CARRINHO
// ======================================================

function scrollToProducts() {

  document
    .getElementById("produtos")
    ?.scrollIntoView({
      behavior: "smooth"
    });
}


function addToCart(id) {

  const product = products.find(
    item => String(item.id) === String(id)
  );

  if (!product) return;

  cart.push(product);

  renderStore();
}


function removeFromCart(index) {

  cart.splice(index, 1);

  renderStore();
}


function renderCart() {

  const items =
    document.getElementById("cart-items");

  const totalElement =
    document.getElementById("cart-total");

  if (!items || !totalElement) return;

  if (!cart.length) {

    items.innerHTML =
      "<p>Seu carrinho está vazio.</p>";

    totalElement.textContent =
      money(0);

    return;
  }


  items.innerHTML = cart
    .map((product, index) => `

      <div class="cart-item">

        <span>
          ${escapeHtml(product.nome)}
          —
          ${money(product.preco)}
        </span>

        <button
          onclick="removeFromCart(${index})"
        >
          Remover
        </button>

      </div>

    `)
    .join("");


  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.preco || 0),
    0
  );

  totalElement.textContent =
    money(total);
}


// ======================================================
// CHECKOUT
// ======================================================

async function checkout() {

  if (!cart.length) {

    alert("Adicione um produto ao pedido.");

    return;
  }


  const nome =
    document.getElementById("cliente-nome")
      ?.value.trim();

  const telefone =
    document.getElementById("cliente-telefone")
      ?.value.trim();

  const endereco =
    document.getElementById("cliente-endereco")
      ?.value.trim();

  const cidade =
    document.getElementById("cliente-cidade")
      ?.value.trim();

  const cep =
    document.getElementById("cliente-cep")
      ?.value.trim();


  if (
    !nome ||
    !telefone ||
    !endereco ||
    !cidade ||
    !cep
  ) {

    alert(
      "Preencha todos os dados do pedido."
    );

    return;
  }


  const total = cart.reduce(
    (sum, product) =>
      sum + Number(product.preco || 0),
    0
  );


  try {

    // ================================================
    // CRIAR PEDIDO
    // ================================================

    const pedidoResponse =
      await api("pedidos", {

        method: "POST",

        headers: {
          Prefer: "return=representation"
        },

        body: JSON.stringify({

          nome_cliente: nome,

          whatsapp: telefone,

          endereco: endereco,

          cidade: cidade,

          cep: cep,

          valor_total: total,

          status: "aguardando_pagamento"

        })

      });


    if (!pedidoResponse.ok) {

      const error =
        await pedidoResponse.text();

      console.error(error);

      alert(
        "Não foi possível criar o pedido.\n\n" +
        error
      );

      return;
    }


    const pedido =
      await pedidoResponse.json();


    if (
      !pedido ||
      !pedido[0] ||
      !pedido[0].id
    ) {

      alert(
        "Pedido criado, mas não foi possível obter o número."
      );

      return;
    }


    const pedidoId =
      pedido[0].id;


    // ================================================
    // ITENS
    // ================================================

    for (const product of cart) {

      const itemResponse =
        await api("itens_pedido", {

          method: "POST",

          body: JSON.stringify({

            pedido_id: pedidoId,

            produto_id: product.id,

            nome_produto: product.nome,

            quantidade: 1,

            preco: product.preco

          })

        });


      if (!itemResponse.ok) {

        console.error(
          "Erro ao salvar item:",
          await itemResponse.text()
        );

      }

    }


    // ================================================
    // MOSTRAR PAGAMENTO
    // ================================================

    showPaymentScreen(
      pedidoId,
      nome,
      total,
      telefone
    );


  } catch (error) {

    console.error(error);

    alert(
      "Ocorreu um erro ao finalizar o pedido."
    );

  }
}


// ======================================================
// TELA DE PAGAMENTO
// ======================================================

function showPaymentScreen(
  pedidoId,
  nome,
  total,
  telefone
) {

  const app =
    document.getElementById("app");

  if (!app) return;


  const message =
`Olá! Quero pagar meu pedido na Paixãobon7.

Pedido: #${pedidoId}

Cliente: ${nome}
Telefone: ${telefone}

Total: ${money(total)}

Pagamento via Pix.

Chave Pix:
${PIX_KEY}`;


  const whatsappUrl =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;


  app.innerHTML = `

    <main class="container">

      <section
        class="pix"
        style="text-align:center"
      >

        <h1>
          ✅ Pedido realizado!
        </h1>

        <h2>
          Pedido #${escapeHtml(pedidoId)}
        </h2>

        <p>
          Olá, ${escapeHtml(nome)}!
        </p>

        <p>
          Seu pedido foi registrado com sucesso.
        </p>

        <h2>
          Total: ${money(total)}
        </h2>


        <hr>


        <h2>
          Pagamento via Pix
        </h2>

        <p>
          Copie a chave Pix abaixo:
        </p>


        <div
          class="pix-key"
          style="
            word-break:break-all;
            margin:15px 0;
          "
        >
          ${PIX_KEY}
        </div>


        <button
          onclick="copyPix()"
        >
          📋 Copiar chave Pix
        </button>


        <br><br>


        <a
          href="${whatsappUrl}"
          target="_blank"
          style="text-decoration:none"
        >

          <button>
            📲 Falar no WhatsApp
          </button>

        </a>


        <br><br>


        <button
          onclick="startNewOrder()"
        >
          Voltar para a loja
        </button>

      </section>

    </main>

  `;
}


// ======================================================
// NOVO PEDIDO
// ======================================================

function startNewOrder() {

  cart = [];

  renderStore();

}


// ======================================================
// PIX
// ======================================================

function copyPix() {

  if (
    navigator.clipboard &&
    navigator.clipboard.writeText
  ) {

    navigator.clipboard
      .writeText(PIX_KEY)
      .then(() => {

        alert(
          "Chave Pix copiada!"
        );

      })
      .catch(() => {

        alert(
          "Copie manualmente:\n\n" +
          PIX_KEY
        );

      });

  } else {

    alert(
      "Chave Pix:\n\n" +
      PIX_KEY
    );

  }
}


// ======================================================
// WHATSAPP
// ======================================================

function openWhatsApp() {

  const message =
    "Olá! Vim pelo site Paixãobon7 e gostaria de saber mais sobre os produtos.";

  const url =
    `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

  window.open(
    url,
    "_blank"
  );
}


// ======================================================
// ADMIN
// ======================================================

function openAdmin() {

  const email =
    prompt(
      "Digite o e-mail do administrador:"
    );


  if (!email) return;


  if (
    email.trim().toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    alert(
      "E-mail de administrador incorreto."
    );

    return;
  }


  renderAdmin();
}


// ======================================================
// PAINEL ADMIN
// ======================================================

function renderAdmin() {

  const app =
    document.getElementById("app");

  if (!app) return;


  app.innerHTML = `

    <main class="container">

      <header class="hero">

        <h1>
          Paixãobon7
        </h1>

        <h2>
          Painel administrativo
        </h2>

        <p>
          Administrador:
          <strong>
            ${ADMIN_EMAIL}
          </strong>
        </p>


        <button
          onclick="renderStore()"
        >
          Voltar para loja
        </button>

      </header>


      <!-- FORMULÁRIO -->

      <section>

        <h2>
          ${
            editingProductId
              ? "Editar produto"
              : "Adicionar produto"
          }
        </h2>


        <input
          id="admin-nome"
          type="text"
          placeholder="Nome do produto"
        >


        <textarea
          id="admin-descricao"
          placeholder="Descrição"
        ></textarea>


        <input
          id="admin-preco"
          type="number"
          step="0.01"
          placeholder="Preço"
        >


        <p>
          Foto do produto:
        </p>


        <input
          id="admin-imagem"
          type="file"
          accept="image/*"
        >


        <br><br>


        <button
          onclick="saveProduct()"
        >
          ${
            editingProductId
              ? "Salvar alterações"
              : "Adicionar produto"
          }
        </button>


        ${
          editingProductId

            ? `
              <button
                onclick="cancelEdit()"
              >
                Cancelar
              </button>
            `

            : ""
        }

      </section>


      <!-- LISTA -->

      <section>

        <h2>
          Produtos cadastrados
        </h2>


        ${
          products.length

            ? products.map(product => `

                <div
                  class="cart-item"
                  style="margin-bottom:15px"
                >

                  ${
                    product.imagem_url
                      ? `
                        <img
                          src="${escapeHtml(product.imagem_url)}"
                          style="
                            width:70px;
                            height:70px;
                            object-fit:cover;
                            border-radius:8px;
                          "
                        >
                      `
                      : ""
                  }


                  <div>

                    <strong>
                      ${escapeHtml(product.nome)}
                    </strong>

                    <br>

                    ${money(product.preco)}

                  </div>


                  <div>

                    <button
                      onclick="editProduct('${product.id}')"
                    >
                      ✏️ Editar
                    </button>


                    <button
                      onclick="deleteProduct('${product.id}')"
                    >
                      🗑️ Excluir
                    </button>

                  </div>

                </div>

              `).join("")

            : `
              <p>
                Nenhum produto cadastrado.
              </p>
            `
        }

      </section>


      <!-- PEDIDOS -->

      <section>

        <h2>
          📦 Pedidos
        </h2>


        <button
          onclick="loadAdminOrders()"
        >
          Atualizar pedidos
        </button>


        <div
          id="admin-orders"
          style="margin-top:20px"
        >
          Nenhum pedido carregado.
        </div>

      </section>


      <!-- CONFIGURAÇÕES -->

      <section>

        <h2>
          Configurações
        </h2>

        <p>
          Chave Pix:
        </p>

        <div class="pix-key">
          ${PIX_KEY}
        </div>

        <p>
          WhatsApp:
          +55 16 98172-1867
        </p>

      </section>

    </main>

  `;
}


// ======================================================
// SALVAR PRODUTO
// ======================================================

async function saveProduct() {

  const nome =
    document.getElementById("admin-nome")
      ?.value.trim();


  const descricao =
    document.getElementById("admin-descricao")
      ?.value.trim();


  const preco =
    Number(
      document.getElementById("admin-preco")
        ?.value
    );


  const file =
    document.getElementById("admin-imagem")
      ?.files?.[0];


  if (!nome) {

    alert(
      "Digite o nome do produto."
    );

    return;
  }


  if (!preco || preco <= 0) {

    alert(
      "Digite um preço válido."
    );

    return;
  }


  try {

    let imagemUrl = null;


    // ================================================
    // UPLOAD
    // ================================================

    if (file) {

      const fileName =
        `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;


      const upload =
        await fetch(
          `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${fileName}`,
          {
            method: "POST",

            headers: {
              apikey: SUPABASE_KEY,
              Authorization:
                `Bearer ${SUPABASE_KEY}`,
              "Content-Type":
                file.type
            },

            body: file
          }
        );


      if (!upload.ok) {

        const error =
          await upload.text();

        alert(
          "Erro ao enviar imagem:\n\n" +
          error
        );

        return;
      }


      imagemUrl =
        `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${fileName}`;

    }


    // ================================================
    // EDITAR
    // ================================================

    if (editingProductId) {

      const body = {
        nome,
        descricao,
        preco
      };


      if (imagemUrl) {
        body.imagem_url =
          imagemUrl;
      }


      const response =
        await api(
          `produtos?id=eq.${editingProductId}`,
          {
            method: "PATCH",

            headers: {
              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify(body)
          }
        );


      if (!response.ok) {

        alert(
          "Erro ao editar produto:\n\n" +
          await response.text()
        );

        return;
      }


      alert(
        "Produto atualizado com sucesso!"
      );


      editingProductId = null;

    }


    // ================================================
    // NOVO
    // ================================================

    else {

      const body = {
        nome,
        descricao,
        preco
      };


      if (
        products.length &&
        Object.prototype.hasOwnProperty.call(
          products[0],
          "ativo"
        )
      ) {

        body.ativo = true;

      }


      if (imagemUrl) {

        body.imagem_url =
          imagemUrl;

      }


      const response =
        await api(
          "produtos",
          {
            method: "POST",

            headers: {
              Prefer:
                "return=representation"
            },

            body:
              JSON.stringify(body)
          }
        );


      if (!response.ok) {

        alert(
          "Erro ao adicionar produto:\n\n" +
          await response.text()
        );

        return;
      }


      alert(
        "Produto adicionado com sucesso!"
      );

    }


    await loadProducts();

    renderAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "Erro ao salvar produto."
    );

  }
}


// ======================================================
// EDITAR
// ======================================================

function editProduct(id) {

  const product =
    products.find(
      item =>
        String(item.id) === String(id)
    );


  if (!product) return;


  editingProductId =
    product.id;


  renderAdmin();


  setTimeout(() => {

    document.getElementById(
      "admin-nome"
    ).value =
      product.nome || "";


    document.getElementById(
      "admin-descricao"
    ).value =
      product.descricao || "";


    document.getElementById(
      "admin-preco"
    ).value =
      product.preco || "";

  }, 50);

}


// ======================================================
// CANCELAR
// ======================================================

function cancelEdit() {

  editingProductId = null;

  renderAdmin();

}


// ======================================================
// EXCLUIR
// ======================================================

async function deleteProduct(id) {

  const product =
    products.find(
      item =>
        String(item.id) === String(id)
    );


  if (!product) return;


  if (
    !confirm(
      `Excluir "${product.nome}"?`
    )
  ) {

    return;
  }


  const response =
    await api(
      `produtos?id=eq.${id}`,
      {
        method: "DELETE"
      }
    );


  if (!response.ok) {

    alert(
      "Erro ao excluir produto:\n\n" +
      await response.text()
    );

    return;
  }


  alert(
    "Produto excluído!"
  );


  await loadProducts();

  renderAdmin();
}


// ======================================================
// PEDIDOS ADMIN
// ======================================================

async function loadAdminOrders() {

  const box =
    document.getElementById(
      "admin-orders"
    );


  if (!box) return;


  box.innerHTML =
    "Carregando pedidos...";


  const response =
    await api(
      "pedidos?select=*&order=criado_em.desc"
    );


  if (!response.ok) {

    box.innerHTML =
      `
        <p>
          Erro ao carregar pedidos:
        </p>

        <pre>
          ${escapeHtml(await response.text())}
        </pre>
      `;

    return;
  }


  const orders =
    await response.json();


  if (!orders.length) {

    box.innerHTML =
      "<p>Nenhum pedido encontrado.</p>";

    return;
  }


  box.innerHTML =
    orders.map(order => `

      <div
        class="cart-item"
        style="
          display:block;
          margin-bottom:15px;
        "
      >

        <strong>
          Pedido #${escapeHtml(order.id)}
        </strong>

        <p>
          Cliente:
          ${escapeHtml(order.nome_cliente)}
        </p>

        <p>
          WhatsApp:
          ${escapeHtml(order.whatsapp)}
        </p>

        <p>
          Endereço:
          ${escapeHtml(order.endereco || "")}
        </p>

        <p>
          Cidade:
          ${escapeHtml(order.cidade || "")}
        </p>

        <p>
          CEP:
          ${escapeHtml(order.cep || "")}
        </p>

        <p>
          Total:
          <strong>
            ${money(order.valor_total)}
          </strong>
        </p>

        <p>
          Status:
          ${escapeHtml(order.status)}
        </p>

        <p>
          Criado:
          ${escapeHtml(order.criado_em)}
        </p>

      </div>

    `).join("");
}


// ======================================================
// INICIAR
// ======================================================

loadProducts().catch(error => {

  console.error(error);

  const app =
    document.getElementById("app");


  if (app) {

    app.innerHTML = `

      <main class="container">

        <h1>
          Paixãobon7
        </h1>

        <p>
          Erro ao carregar os produtos.
        </p>

        <pre>
          ${escapeHtml(error.message)}
        </pre>

        <button
          onclick="location.reload()"
        >
          Tentar novamente
        </button>

      </main>

    `;

  }

});
