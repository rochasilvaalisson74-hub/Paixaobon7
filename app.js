const SUPABASE_URL = "https://sxkcpljlkqmnvkvebmma.supabase.co";
const SUPABASE_KEY = "sb_publishable_7_nC0im2FRozidAwQfBoqA_esAWhSjs";

const ADMIN_EMAIL = "paixaobon@gmail.com";

const PIX_KEY = "7c868247-e256-4bab-894a-10e7a242a63a";
const WHATSAPP = "5516981721867";

const BUCKET = "produtos";

let products = [];
let cart = [];
let isAdmin = false;
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


// ======================================================
// SUPABASE
// ======================================================

async function supabaseFetch(path, options = {}) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/${path}`,
    {
      ...options,
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  return response;
}


// ======================================================
// CARREGAR PRODUTOS
// ======================================================

async function loadProducts() {

  const response = await supabaseFetch(
    "produtos?select=*"
  );

  if (!response.ok) {

    const error = await response.text();

    console.error("Erro ao carregar produtos:", error);

    throw new Error(error);
  }

  products = await response.json();

  /*
   * Se existir a coluna ativo, mostramos somente
   * produtos ativos.
   */
  if (
    products.length &&
    Object.prototype.hasOwnProperty.call(products[0], "ativo")
  ) {
    products = products.filter(
      product => product.ativo !== false
    );
  }

  render();
}


// ======================================================
// RENDER PRINCIPAL
// ======================================================

function render() {

  const app = document.getElementById("app");

  if (!app) return;

  app.innerHTML = `

    <main class="container">

      <header class="hero">

        <h1>Paixãobon7</h1>

        <p>
          Produtos, cursos e soluções.
        </p>

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


      <!-- ================= PRODUTOS ================= -->

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


      <!-- ================= CARRINHO ================= -->

      <section class="cart">

        <h2>
          Seu pedido
        </h2>

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


      <!-- ================= PIX ================= -->

      <section class="pix">

        <h2>
          Pagamento via Pix
        </h2>

        <p>
          Chave Pix:
        </p>

        <div class="pix-key">
          ${PIX_KEY}
        </div>

        <button onclick="copyPix()">
          Copiar chave Pix
        </button>

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
// PRODUTOS / CARRINHO
// ======================================================

function scrollToProducts() {

  const element = document.getElementById("produtos");

  if (element) {
    element.scrollIntoView({
      behavior: "smooth"
    });
  }
}


function addToCart(id) {

  const product = products.find(
    item => String(item.id) === String(id)
  );

  if (!product) {
    alert("Produto não encontrado.");
    return;
  }

  cart.push(product);

  render();
}


function removeFromCart(index) {

  cart.splice(index, 1);

  render();
}


function renderCart() {

  const items =
    document.getElementById("cart-items");

  const totalElement =
    document.getElementById("cart-total");

  if (!items || !totalElement) {
    return;
  }

  if (cart.length === 0) {

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


  const total =
    cart.reduce(
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

  if (cart.length === 0) {

    alert(
      "Adicione um produto ao pedido."
    );

    return;
  }


  const nome =
    document
      .getElementById("cliente-nome")
      ?.value
      .trim();


  const telefone =
    document
      .getElementById("cliente-telefone")
      ?.value
      .trim();


  const endereco =
    document
      .getElementById("cliente-endereco")
      ?.value
      .trim();


  const cidade =
    document
      .getElementById("cliente-cidade")
      ?.value
      .trim();


  const cep =
    document
      .getElementById("cliente-cep")
      ?.value
      .trim();


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


  const total =
    cart.reduce(
      (sum, product) =>
        sum + Number(product.preco || 0),
      0
    );


  try {

    const pedidoResponse =
      await supabaseFetch(
        "pedidos",
        {
          method: "POST",

          headers: {
            Prefer:
              "return=representation"
          },

          body: JSON.stringify({

            nome_cliente:
              nome,

            whatsapp:
              telefone,

            endereco:
              endereco,

            cidade:
              cidade,

            cep:
              cep,

            valor_total:
              total,

            status:
              "aguardando_pagamento"

          })
        }
      );


    if (!pedidoResponse.ok) {

      const error =
        await pedidoResponse.text();

      console.error(
        "Erro ao criar pedido:",
        error
      );

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


    // ==================================================
    // SALVAR ITENS
    // ==================================================

    for (const product of cart) {

      const itemResponse =
        await supabaseFetch(
          "itens_pedido",
          {
            method: "POST",

            body: JSON.stringify({

              pedido_id:
                pedidoId,

              produto_id:
                product.id,

              nome_produto:
                product.nome,

              quantidade:
                1,

              preco:
                product.preco

            })
          }
        );


      if (!itemResponse.ok) {

        const error =
          await itemResponse.text();

        console.error(
          "Erro ao salvar item:",
          error
        );

      }

    }


    // ==================================================
    // WHATSAPP
    // ==================================================

    const items =
      cart
        .map(
          product =>
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


    window.open(
      whatsappUrl,
      "_blank"
    );


    cart = [];

    render();


  } catch (error) {

    console.error(
      "Erro no checkout:",
      error
    );

    alert(
      "Ocorreu um erro ao finalizar o pedido."
    );

  }

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
          "Não foi possível copiar automaticamente."
        );

      });

  } else {

    alert(
      "Copie a chave Pix manualmente:\n\n" +
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
// PAINEL ADMINISTRATIVO
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


  /*
   * Aqui não colocamos senha no código.
   * O administrador é direcionado para a área
   * administrativa depois da confirmação do e-mail.
   */

  isAdmin = true;

  renderAdmin();

}


function renderAdmin() {

  const app =
    document.getElementById("app");

  if (!app) return;


  app.innerHTML = `

    <main class="container admin-panel">

      <header class="hero">

        <h1>
          Paixãobon7
        </h1>

        <p>
          Painel administrativo
        </p>

        <p>
          Administrador:
          <strong>
            ${ADMIN_EMAIL}
          </strong>
        </p>

        <button
          onclick="render()"
        >
          Voltar para loja
        </button>

      </header>


      <!-- ========================================= -->
      <!-- ADICIONAR / EDITAR PRODUTO -->
      <!-- ========================================= -->

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
          placeholder="Descrição do produto"
        ></textarea>


        <input
          id="admin-preco"
          type="number"
          step="0.01"
          placeholder="Preço"
        >


        <input
          id="admin-imagem"
          type="file"
          accept="image/*"
        >


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
                Cancelar edição
              </button>
            `

            : ""
        }

      </section>


      <!-- ========================================= -->
      <!-- PRODUTOS ADMIN -->
      <!-- ========================================= -->

      <section>

        <h2>
          Produtos
        </h2>


        <div>

          ${
            products.length

              ? products
                  .map(product => `

                    <div
                      class="cart-item"
                      style="margin-bottom:10px"
                    >

                      <span>

                        <strong>
                          ${escapeHtml(product.nome)}
                        </strong>

                        —
                        ${money(product.preco)}

                      </span>


                      <div>

                        <button
                          onclick="editProduct('${product.id}')"
                        >
                          Editar
                        </button>


                        <button
                          onclick="deleteProduct('${product.id}')"
                        >
                          Excluir
                        </button>

                      </div>

                    </div>

                  `)
                  .join("")

              : `
                <p>
                  Nenhum produto cadastrado.
                </p>
              `
          }

        </div>

      </section>


      <!-- ========================================= -->
      <!-- PEDIDOS -->
      <!-- ========================================= -->

      <section>

        <h2>
          Pedidos
        </h2>

        <button
          onclick="loadAdminOrders()"
        >
          Atualizar pedidos
        </button>

        <div
          id="admin-orders"
          style="margin-top:15px"
        >
          Clique em "Atualizar pedidos".
        </div>

      </section>


      <!-- ========================================= -->
      <!-- CONFIGURAÇÕES -->
      <!-- ========================================= -->

      <section>

        <h2>
          Configurações
        </h2>

        <p>
          <strong>Pix:</strong>
          ${PIX_KEY}
        </p>

        <p>
          <strong>WhatsApp:</strong>
          +55 16 98172-1867
        </p>

      </section>


      <footer>

        <button
          onclick="logoutAdmin()"
        >
          Sair do administrador
        </button>

      </footer>

    </main>

  `;

}


// ======================================================
// SALVAR PRODUTO
// ======================================================

async function saveProduct() {

  const nome =
    document
      .getElementById("admin-nome")
      ?.value
      .trim();


  const descricao =
    document
      .getElementById("admin-descricao")
      ?.value
      .trim();


  const preco =
    Number(
      document
        .getElementById("admin-preco")
        ?.value
    );


  const file =
    document
      .getElementById("admin-imagem")
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
    // UPLOAD DA IMAGEM
    // ================================================

    if (file) {

      const fileName =
        `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;


      const uploadResponse =
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


      if (!uploadResponse.ok) {

        const error =
          await uploadResponse.text();

        console.error(
          "Erro no upload:",
          error
        );

        alert(
          "Não foi possível enviar a imagem.\n\n" +
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
        body.imagem_url = imagemUrl;
      }


      const response =
        await supabaseFetch(
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

        const error =
          await response.text();

        alert(
          "Erro ao editar produto:\n\n" +
          error
        );

        return;
      }


      alert(
        "Produto atualizado com sucesso!"
      );


      editingProductId = null;

    }

    // ================================================
    // NOVO PRODUTO
    // ================================================

    else {

      const body = {
        nome,
        descricao,
        preco
      };


      /*
       * Só adicionamos ativo se a tabela tiver
       * essa coluna. Caso a tabela não tenha,
       * fazemos primeiro uma tentativa simples.
       */

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
        body.imagem_url = imagemUrl;
      }


      const response =
        await supabaseFetch(
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

        const error =
          await response.text();

        alert(
          "Erro ao adicionar produto:\n\n" +
          error
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
      "Ocorreu um erro ao salvar o produto."
    );

  }

}


// ======================================================
// EDITAR PRODUTO
// ======================================================

function editProduct(id) {

  const product =
    products.find(
      item =>
        String(item.id) === String(id)
    );


  if (!product) {

    alert(
      "Produto não encontrado."
    );

    return;
  }


  editingProductId =
    product.id;


  renderAdmin();


  setTimeout(() => {

    const nome =
      document.getElementById(
        "admin-nome"
      );

    const descricao =
      document.getElementById(
        "admin-descricao"
      );

    const preco =
      document.getElementById(
        "admin-preco"
      );


    if (nome) {
      nome.value =
        product.nome || "";
    }


    if (descricao) {
      descricao.value =
        product.descricao || "";
    }


    if (preco) {
      preco.value =
        product.preco || "";
    }

  }, 50);

}


// ======================================================
// CANCELAR EDIÇÃO
// ======================================================

function cancelEdit() {

  editingProductId = null;

  renderAdmin();

}


// ======================================================
// EXCLUIR PRODUTO
// ======================================================

async function deleteProduct(id) {

  const product =
    products.find(
      item =>
        String(item.id) === String(id)
    );


  if (!product) return;


  const confirmed =
    confirm(
      `Excluir o produto "${product.nome}"?`
    );


  if (!confirmed) return;


  try {

    const response =
      await supabaseFetch(
        `produtos?id=eq.${id}`,
        {
          method: "DELETE"
        }
      );


    if (!response.ok) {

      const error =
        await response.text();

      alert(
        "Erro ao excluir produto:\n\n" +
        error
      );

      return;
    }


    alert(
      "Produto excluído!"
    );


    await loadProducts();

    renderAdmin();


  } catch (error) {

    console.error(error);

    alert(
      "Ocorreu um erro ao excluir o produto."
    );

  }

}


// ======================================================
// PEDIDOS DO ADMIN
// ======================================================

async function loadAdminOrders() {

  const container =
    document.getElementById(
      "admin-orders"
    );


  if (!container) return;


  container.innerHTML =
    "Carregando pedidos...";


  try {

    const response =
      await supabaseFetch(
        "pedidos?select=*&order=criado_em.desc"
      );


    if (!response.ok) {

      const error =
        await response.text();

      container.innerHTML =
        `
          <p>
            Erro ao carregar pedidos.
          </p>

          <pre>
            ${escapeHtml(error)}
          </pre>
        `;

      return;
    }


    const orders =
      await response.json();


    if (!orders.length) {

      container.innerHTML =
        "<p>Nenhum pedido encontrado.</p>";

      return;
    }


    container.innerHTML =
      orders
        .map(order => `

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
              Data:
              ${escapeHtml(order.criado_em)}
            </p>

          </div>

        `)
        .join("");


  } catch (error) {

    console.error(error);

    container.innerHTML =
      "<p>Erro ao carregar pedidos.</p>";

  }

}


// ======================================================
// SAIR DO ADMIN
// ======================================================

function logoutAdmin() {

  isAdmin = false;

  editingProductId = null;

  render();

}


// ======================================================
// INICIALIZAÇÃO
// ======================================================

loadProducts().catch(error => {

  console.error(
    "Erro inicial:",
    error
  );


  const app =
    document.getElementById("app");


  if (app) {

    app.innerHTML = `

      <main class="container">

        <h1>
          Paixãobon7
        </h1>

        <p>
          Não foi possível carregar os produtos.
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
