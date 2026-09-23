const SUPABASE_URL = "https://sxkcpljlkqmnvkvebmma.supabase.co";
const SUPABASE_KEY = "sb_publishable_7_nC0im2FRozidAwQfBoqA_esAWhSjs";

const ADMIN_EMAIL = "paixaobon@gmail.com";
const BUCKET = "produtos";

const PIX_KEY = "7c868247-e256-4bab-894a-10e7a242a63a";
const WHATSAPP = "5516981721867";

let products = [];
let cart = [];
let adminSession = null;
let editingProductId = null;

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
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

  try {
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

    await loadProducts();

  } catch (error) {
    console.error(error);
    alert("Erro ao tentar entrar no painel.");
  }
}

function logoutAdmin() {
  adminSession = null;
  editingProductId = null;

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

    localStorage.removeItem(
      "paixaobon7_admin_session"
    );
  }
}

/* =========================
   PRODUTOS
========================= */

async function loadProducts() {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/produtos?select=*&order=criado_em.desc`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(
      "Não foi possível carregar os produtos."
    );
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

  const fileInput =
    document.getElementById("product-image");

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

  try {
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

  } catch (error) {
    console.error(error);
    alert("Erro ao enviar a imagem.");
  }
}

/* =========================
   FORMULÁRIO DO PRODUTO
========================= */

function clearProductForm() {
  editingProductId = null;

  const fields = [
    "product-name",
    "product-description",
    "product-price",
    "product-stock",
    "product-category",
    "uploaded-image-url"
  ];

  fields.forEach(id => {
    const element = document.getElementById(id);

    if (element) {
      element.value = "";
    }
  });

  const active =
    document.getElementById("product-active");

  if (active) {
    active.checked = true;
  }

  const title =
    document.getElementById("product-form-title");

  if (title) {
    title.textContent = "Adicionar produto";
  }

  const button =
    document.getElementById("save-product-button");

  if (button) {
    button.textContent = "Salvar produto";
  }
}

async function saveProduct() {
  if (!adminSession || !adminSession.access_token) {
    alert("Faça login como administrador.");
    return;
  }

  const nome =
    document.getElementById("product-name").value.trim();

  const descricao =
    document.getElementById("product-description").value.trim();

  const preco =
    document.getElementById("product-price").value;

  const estoque =
    document.getElementById("product-stock").value;

  const categoria =
    document.getElementById("product-category").value.trim();

  const imagem_url =
    document.getElementById("uploaded-image-url").value.trim();

  const ativo =
    document.getElementById("product-active").checked;

  if (!nome) {
    alert("Digite o nome do produto.");
    return;
  }

  if (!preco || Number(preco) < 0) {
    alert("Digite um preço válido.");
    return;
  }

  if (estoque === "" || Number(estoque) < 0) {
    alert("Digite um estoque válido.");
    return;
  }

  const produto = {
    nome,
    descricao,
    preco: Number(preco),
    estoque: Number(estoque),
    categoria: categoria || "Geral",
    imagem_url: imagem_url || null,
    ativo
  };

  try {
    let response;

    if (editingProductId) {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/produtos?id=eq.${editingProductId}`,
        {
          method: "PATCH",

          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${adminSession.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },

          body: JSON.stringify(produto)
        }
      );
    } else {
      response = await fetch(
        `${SUPABASE_URL}/rest/v1/produtos`,
        {
          method: "POST",

          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${adminSession.access_token}`,
            "Content-Type": "application/json",
            Prefer: "return=representation"
          },

          body: JSON.stringify(produto)
        }
      );
    }

    if (!response.ok) {
      const error = await response.text();

      console.error(error);

      alert(
        "Não foi possível salvar o produto."
      );

      return;
    }

    alert(
      editingProductId
        ? "Produto atualizado com sucesso!"
        : "Produto cadastrado com sucesso!"
    );

    clearProductForm();

    await loadProducts();

  } catch (error) {
    console.error(error);
    alert("Erro ao salvar o produto.");
  }
}

/* =========================
   EDITAR PRODUTO
========================= */

function editProduct(id) {
  const product =
    products.find(item => item.id === id);

  if (!product) {
    alert("Produto não encontrado.");
    return;
  }

  editingProductId = id;

  document.getElementById("product-name").value =
    product.nome || "";

  document.getElementById("product-description").value =
    product.descricao || "";

  document.getElementById("product-price").value =
    product.preco || "";

  document.getElementById("product-stock").value =
    product.estoque ?? 0;

  document.getElementById("product-category").value =
    product.categoria || "";

  document.getElementById("uploaded-image-url").value =
    product.imagem_url || "";

  document.getElementById("product-active").checked =
    product.ativo !== false;

  document.getElementById("product-form-title").textContent =
    "Editar produto";

  document.getElementById("save-product-button").textContent =
    "Atualizar produto";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

/* =========================
   EXCLUIR PRODUTO
========================= */

async function deleteProduct(id) {
  if (!adminSession || !adminSession.access_token) {
    alert("Faça login como administrador.");
    return;
  }

  const product =
    products.find(item => item.id === id);

  if (!product) return;

  const confirmed =
    confirm(
      `Tem certeza que deseja excluir "${product.nome}"?`
    );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/produtos?id=eq.${id}`,
      {
        method: "DELETE",

        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${adminSession.access_token}`,
          Prefer: "return=minimal"
        }
      }
    );

    if (!response.ok) {
      const error = await response.text();

      console.error(error);

      alert(
        "Não foi possível excluir o produto."
      );

      return;
    }

    alert("Produto excluído com sucesso!");

    await loadProducts();

  } catch (error) {
    console.error(error);
    alert("Erro ao excluir o produto.");
  }
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

      <hr>

      <h3 id="product-form-title">
        Adicionar produto
      </h3>

      <input
        id="product-name"
        type="text"
        placeholder="Nome do produto"
      >

      <textarea
        id="product-description"
        placeholder="Descrição do produto"
      ></textarea>

      <input
        id="product-price"
        type="number"
        step="0.01"
        min="0"
        placeholder="Preço"
      >

      <input
        id="product-stock"
        type="number"
        min="0"
        placeholder="Estoque"
      >

      <input
        id="product-category"
        type="text"
        placeholder="Categoria"
      >

      <h4>Foto do produto</h4>

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
        placeholder="URL da imagem"
      >

      <label>
        <input
          id="product-active"
          type="checkbox"
          checked
        >
        Produto ativo
      </label>

      <br><br>

      <button
        id="save-product-button"
        onclick="saveProduct()"
      >
        Salvar produto
      </button>

      <button onclick="clearProductForm()">
        Limpar formulário
      </button>

      <hr>

      <h3>Produtos cadastrados</h3>

      <div class="admin-products">

        ${
          products.length
            ? products.map(product => `
              <article class="admin-product">

                ${
                  product.imagem_url
                    ? `
                      <img
                        src="${product.imagem_url}"
                        alt="${product.nome}"
                        style="
                          width:120px;
                          height:120px;
                          object-fit:cover;
                          border-radius:10px;
                        "
                      >
                    `
                    : `
                      <div>
                        Sem imagem
                      </div>
                    `
                }

                <h4>
                  ${product.nome}
                </h4>

                <p>
                  ${product.descricao || ""}
                </p>

                <p>
                  <strong>
                    ${money(product.preco)}
                  </strong>
                </p>

                <p>
                  Estoque:
                  ${product.estoque ?? 0}
                </p>

                <p>
                  Categoria:
                  ${product.categoria || "Geral"}
                </p>

                <p>
                  Status:
                  ${
                    product.ativo
                      ? "Ativo"
                      : "Inativo"
                  }
                </p>

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

              </article>
            `).join("")
            : "<p>Nenhum produto cadastrado.</p>"
        }

      </div>

      <br>

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
  const app =
    document.getElementById("app");

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

      </header>

      ${adminPanel()}

      <section>

        <h2>Produtos</h2>

        <div class="products">

          ${
            products.filter(product => product.ativo).length
              ? products
                  .filter(product => product.ativo)
                  .map(product => `
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

                      <h3>
                        ${product.nome}
                      </h3>

                      <p>
                        ${product.descricao || ""}
                      </p>

                      <p>
                        Categoria:
                        ${product.categoria || "Geral"}
                      </p>

                      <strong>
                        ${money(product.preco)}
                      </strong>

                      <p>
                        Estoque:
                        ${product.estoque ?? 0}
                      </p>

                      <button
                        onclick="addToCart('${product.id}')"
                        ${
                          Number(product.estoque) <= 0
                            ? "disabled"
                            : ""
                        }
                      >
                        ${
                          Number(product.estoque) <= 0
                            ? "Produto esgotado"
                            : "Adicionar ao pedido"
                        }
                      </button>

                    </article>
                  `)
                  .join("")
              : "<p>Nenhum produto disponível no momento.</p>"
          }

        </div>

      </section>

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

/* =========================
   CARRINHO
========================= */

function addToCart(id) {
  const product =
    products.find(item => item.id === id);

  if (!product) return;

  if (Number(product.estoque) <= 0) {
    alert("Este produto está sem estoque.");
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

  if (!items || !totalElement) return;

  if (cart.length === 0) {
    items.innerHTML =
      "<p>Seu carrinho está vazio.</p>";

    totalElement.textContent =
      money(0);

    return;
  }

  items.innerHTML =
    cart.map((product, index) => `
      <div class="cart-item">

        <span>
          ${product.nome} —
          ${money(product.preco)}
        </span>

        <button
          onclick="removeFromCart(${index})"
        >
          Remover
        </button>

      </div>
    `).join("");

  const total =
    cart.reduce(
      (sum, product) =>
        sum + Number(product.preco),
      0
    );

  totalElement.textContent =
    money(total);
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
    document
      .getElementById("cliente-nome")
      .value
      .trim();

  const telefone =
    document
      .getElementById("cliente-telefone")
      .value
      .trim();

  const endereco =
    document
      .getElementById("cliente-endereco")
      .value
      .trim();

  const cidade =
    document
      .getElementById("cliente-cidade")
      .value
      .trim();

  const cep =
    document
      .getElementById("cliente-cep")
      .value
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
        sum + Number(product.preco),
      0
    );

  const pedidoResponse =
    await fetch(
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
    const error =
      await pedidoResponse.text();

    console.error(error);

    alert(
      "Não foi possível criar o pedido."
    );

    return;
  }

  const pedido =
    await pedidoResponse.json();

  const pedidoId =
    pedido[0].id;

  for (const product of cart) {
    const itemResponse =
      await fetch(
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
      console.error(
        await itemResponse.text()
      );
    }
  }

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
      alert(
        "Não foi possível copiar automaticamente."
      );
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

      <h1>
        Paixãobon7
      </h1>

      <p>
        Não foi possível carregar os produtos.
      </p>

      <button
        onclick="location.reload()"
      >
        Tentar novamente
      </button>

    </main>
  `;
});
