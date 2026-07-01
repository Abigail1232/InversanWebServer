const prisma = require("../config/database");
const jsonwebtoken = require("jsonwebtoken");

// --- HELPERS PARA CARRITO HIBRIDO ---
const mergeCarts = (baseCart, guestCart) => {
  const mergedProducts = [...baseCart.products];
  for (const guestProd of guestCart.products) {
    const existing = mergedProducts.find(p => p.id === guestProd.id);
    if (existing) {
      existing.amount += guestProd.amount;
    } else {
      mergedProducts.push({ ...guestProd });
    }
  }
  return { ...baseCart, products: mergedProducts };
};

const getAuthUser = (req) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jsonwebtoken.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

const extractCartState = async (req, id_branch) => {
  const authUser = getAuthUser(req);
  let cart = { branch: id_branch, products: [] };

  if (authUser) {
    const dbCart = await prisma.carrito.findUnique({
      where: { id_usuario_id_sucursal: { id_usuario: authUser.id, id_sucursal: id_branch } },
      include: { carrito_detalle: true }
    });
    if (dbCart) {
      cart.products = dbCart.carrito_detalle.map(d => ({ id: d.id_producto, amount: d.cantidad }));
    }
    return { cart, authUser, isDb: true };
  }

  const cookieToken = req.query.cartToken || req.headers['x-cart-token'] || req.cookies?.cart;
  let decoded = null;
  if (cookieToken && cookieToken !== "DB_SYNCED") {
    try {
      decoded = jsonwebtoken.verify(cookieToken, process.env.JWT_SECRET);
      if (decoded.branch === id_branch) {
        cart = decoded;
      }
    } catch (err) { }
  }
  return { cart, authUser: null, isDb: false, cookieToken, decoded };
};

const saveCartState = async (cart, authUser, res) => {
  if (authUser) {
    const upsertedCart = await prisma.carrito.upsert({
      where: { id_usuario_id_sucursal: { id_usuario: authUser.id, id_sucursal: cart.branch } },
      update: {},
      create: { id_usuario: authUser.id, id_sucursal: cart.branch }
    });

    await prisma.carrito_Detalle.deleteMany({ where: { id_carrito: upsertedCart.id_carrito } });

    if (cart.products && cart.products.length > 0) {
      await prisma.carrito_Detalle.createMany({
        data: cart.products.map(p => ({
          id_carrito: upsertedCart.id_carrito,
          id_producto: p.id,
          cantidad: p.amount
        }))
      });
    }

    return "DB_SYNCED";
  } else {
    const cartToken = jsonwebtoken.sign(cart, process.env.JWT_SECRET, { expiresIn: "7d" });
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN !== undefined
      ? process.env.COOKIE_DOMAIN || undefined
      : (isProduction ? ".grupoinversan.com" : undefined);
    res.cookie("cart", cartToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      ...(cookieDomain && { domain: cookieDomain }),
    });
    return cartToken;
  }
};

const clearCartState = async (id_branch, authUser, res) => {
  if (authUser) {
    // Borramos el carrito del usuario para esta sucursal específica
    await prisma.carrito.deleteMany({
      where: {
        id_usuario: authUser.id,
        id_sucursal: id_branch,
      },
    });
  } else {
    // Limpiamos la cookie para invitados
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = process.env.COOKIE_DOMAIN !== undefined
      ? process.env.COOKIE_DOMAIN || undefined
      : (isProduction ? ".grupoinversan.com" : undefined);
    res.clearCookie("cart", {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      ...(cookieDomain && { domain: cookieDomain }),
    });
  }
};
// -------------------------------------

async function addToCart(req, res) {
  try {
    const { product_id, amount } = req.body;
    let id_branch = Number(req.body.id_branch || req.query.id_branch);

    const { cart, authUser } = await extractCartState(req, id_branch);

    const producto = await prisma.producto.findUnique({
      where: { id_producto: product_id },
    });

    if (!producto) {
      return res.status(404).json({
        error: `There is no product with id: ${product_id}`,
        success: false,
      });
    }

    const stockResult = await prisma.stock_Bodega.aggregate({
      _sum: { existencias: true },
      where: {
        producto: { id_producto: product_id },
        bodega: { id_sucursal: id_branch },
      },
    });

    const stock = stockResult._sum.existencias || 0;
    if (stock === 0) {
      return res.status(409).json({ error: "Product out of stock in this branch", success: false });
    }

    const existingProduct = cart.products.find(p => p.id === product_id);
    const currentAmount = existingProduct ? existingProduct.amount : 0;
    const totalRequested = currentAmount + amount;

    if (totalRequested > stock) {
      return res.status(409).json({ error: `Only ${stock} units available.`, success: false });
    }

    if (existingProduct) {
      existingProduct.amount += amount;
    } else {
      cart.products.push({ id: product_id, amount });
    }

    const cartToken = await saveCartState(cart, authUser, res);

    return res.status(200).json({ message: "Product added successfully.", success: true, cartToken, cart });
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
}

async function modifyCart(req, res) {
  return addToCart(req, res);
}

async function getCart(req, res) {
  try {
    const id_branch = Number(req.query.id_branch);
    if (!id_branch) return res.status(200).json({ cart: { products: [] }, exist: false });

    const { cart, authUser, cookieToken } = await extractCartState(req, id_branch);

    // Determinar privilegios
    let tieneMayoreo = false;
    if (authUser) {
      const usuarioConPrivilegios = await prisma.usuario.findFirst({
        where: { id_usuario: authUser.id },
        select: {
          rol: {
            select: {
              rol_privilegio: {
                include: {
                  privilegio: { select: { nombre: true } }
                }
              }
            }
          }
        }
      });
      const userPrivs = usuarioConPrivilegios?.rol?.rol_privilegio?.map(rp => rp.privilegio.nombre) || [];
      tieneMayoreo = userPrivs.includes("IS_MAYORIST") || userPrivs.includes("ALL_ACCESS");
    }

    if (!cart.products || cart.products.length === 0) {
      return res.status(200).json({ cart: { branch: id_branch, products: [] }, exist: false, cartToken: authUser ? "DB_SYNCED" : cookieToken });
    }

    const productIds = cart.products.map(p => p.id);
    const ahora = new Date();
    const productosDB = await prisma.producto.findMany({
      where: { id_producto: { in: productIds } },
      include: {
        producto_imagen: { select: { imagen_url: true } },
        marca: { select: { nombre: true } },
        producto_promocion: {
          where: { promocion: { fecha_inicio: { lte: ahora }, fecha_finalizacion: { gte: ahora } } },
          select: { descuento: true, tipo_descuento: true, precio_promocion: true }
        }
      }
    });

    const products = cart.products.map(p => {
      const prodDB = productosDB.find(db => db.id_producto === p.id);
      if (!prodDB) return null;

      const precios = [{ precio: prodDB.precio_detalle, tipo: "detalle", descuento: 0 }];
      let descuentoAplicado = 0; let tipoDescuento = null;

      if (tieneMayoreo && prodDB.precio_mayoreo < prodDB.precio_detalle) {
        const desc = ((prodDB.precio_detalle - prodDB.precio_mayoreo) / prodDB.precio_detalle) * 100;
        precios.push({ precio: prodDB.precio_mayoreo, tipo: "mayoreo", descuento: desc });
      }

      if (prodDB.producto_promocion.length > 0) {
        // Verificar si hay promociones con tipo_descuento "monto" y precio_promocion
        const promocionesMonto = prodDB.producto_promocion.filter(pp => pp.tipo_descuento === "monto" && pp.precio_promocion);
        
        if (promocionesMonto.length > 0) {
          // Usar el precio promocional más bajo entre las promociones de monto
          const precioMasBajo = Math.min(...promocionesMonto.map(pp => parseFloat(pp.precio_promocion)));
          const descuentoEquivalente = ((prodDB.precio_detalle - precioMasBajo) / prodDB.precio_detalle) * 100;
          precios.push({ precio: precioMasBajo, tipo: "promocion", descuento: descuentoEquivalente });
        } else {
          // Si no hay promociones de monto, usar el porcentaje
          const mayorDescuentoPromo = Math.max(...prodDB.producto_promocion.map(pp => pp.descuento));
          const precioConDesc = prodDB.precio_detalle * (1 - mayorDescuentoPromo / 100);
          precios.push({ precio: precioConDesc, tipo: "promocion", descuento: mayorDescuentoPromo });
        }
      }

      const mejorOpcion = precios.reduce((min, cur) => cur.precio < min.precio ? cur : min, precios[0]);

      return {
        ...prodDB,
        amount: p.amount,
        precio_mas_bajo: parseFloat(mejorOpcion.precio.toFixed(2)),
        descuento_aplicado: mejorOpcion.descuento,
        tipo_descuento: mejorOpcion.tipo,
        precio_original: prodDB.precio_detalle
      };
    }).filter(Boolean);

    return res.status(200).json({
      cart: { branch: cart.branch, products },
      exist: true,
      cartToken: authUser ? "DB_SYNCED" : cookieToken
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message, success: false });
  }
}

async function decrementProduct(req, res) {
  try {
    const { product_id, amount } = req.body;
    let id_branch = Number(req.body.id_branch || req.query.id_branch);

    // eslint-disable-next-line
    const { cart, authUser } = await extractCartState(req, id_branch);

    const existingProduct = cart.products.find(p => p.id === product_id);
    if (!existingProduct) return res.status(404).json({ error: "Product not in cart", success: false });

    existingProduct.amount -= amount;
    if (existingProduct.amount <= 0) {
      cart.products = cart.products.filter(p => p.id !== product_id);
    }

    const cartToken = await saveCartState(cart, authUser, res);
    return res.status(200).json({ message: "Decremented", success: true, cartToken, cart });
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
}

async function deleteProduct(req, res) {
  try {
    const id_producto = Number(req.params.id);
    let id_branch = Number(req.body.id_branch || req.query.id_branch);

    // eslint-disable-next-line
    const { cart, authUser } = await extractCartState(req, id_branch);

    cart.products = cart.products.filter(p => p.id !== id_producto);

    const cartToken = await saveCartState(cart, authUser, res);
    return res.status(200).json({ message: "Deleted", success: true, cartToken, cart });
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
}

async function deleteCart(req, res) {
  try {
    let id_branch = Number(req.body.id_branch || req.query.id_branch);
    const authUser = getAuthUser(req);
    await clearCartState(id_branch, authUser, res);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message, success: false });
  }
}

async function syncCarts(req, res) {
  // Synchronize multiple independent branch tokens into DB immediately upon login
  try {
    const authUser = getAuthUser(req);
    if (!authUser) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { tokens } = req.body;
    if (!tokens || typeof tokens !== 'object') return res.status(400).json({ success: false });

    for (const [branchIdStr, tokenStr] of Object.entries(tokens)) {
      const branchId = Number(branchIdStr);
      if (!branchId || !tokenStr || tokenStr === "DB_SYNCED") continue;

      try {
        const decoded = jsonwebtoken.verify(tokenStr, process.env.JWT_SECRET);
        if (decoded.branch === branchId && decoded.products && decoded.products.length > 0) {
          // 1. Obtener carrito actual de la DB para esta sucursal
          const { cart: dbCart } = await extractCartState(req, branchId);
          // 2. Fusionar con el carrito guest
          const mergedCart = mergeCarts(dbCart, decoded);
          // 3. Guardar el resultado final en la DB
          await saveCartState(mergedCart, authUser, res);
        }
      } catch (e) { } // Ignore obsolete tokens
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}

module.exports = { addToCart, getCart, deleteCart, deleteProduct, modifyCart, decrementProduct, syncCarts };
