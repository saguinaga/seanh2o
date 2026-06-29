/** Mii-style avatar builder, wardrobe catalog, boutique shop */
window.BlossomAvatar = (function () {
  const HEIGHT = { short: 0.88, average: 1, tall: 1.14 };
  const BUILD = { slim: 0.92, average: 1, solid: 1.1 };

  const HAIR_STYLES = ['short', 'long', 'spiky', 'curly', 'ponytail'];

  const ITEMS = {
    top_starter: { id: 'top_starter', slot: 'top', name: 'Starter tee', price: 0, color: '#5eead4', style: 'tee', starter: true },
    top_striped: { id: 'top_striped', slot: 'top', name: 'Striped tee', price: 6, color: '#f472b6', style: 'striped' },
    top_hoodie: { id: 'top_hoodie', slot: 'top', name: 'Cozy hoodie', price: 10, color: '#8b5cf6', style: 'hoodie' },
    top_blazer: { id: 'top_blazer', slot: 'top', name: 'Blazer', price: 18, color: '#1e3a5f', style: 'blazer' },
    top_gold: { id: 'top_gold', slot: 'top', name: 'Gold stage top', price: 25, color: '#fbbf24', style: 'tee', sparkle: true },

    bottom_starter: { id: 'bottom_starter', slot: 'bottom', name: 'Blue jeans', price: 0, color: '#475569', style: 'jeans', starter: true },
    bottom_cargo: { id: 'bottom_cargo', slot: 'bottom', name: 'Cargo pants', price: 8, color: '#65a30d', style: 'cargo' },
    bottom_skirt: { id: 'bottom_skirt', slot: 'bottom', name: 'Pleated skirt', price: 9, color: '#ec4899', style: 'skirt' },
    bottom_shorts: { id: 'bottom_shorts', slot: 'bottom', name: 'Summer shorts', price: 5, color: '#38bdf8', style: 'shorts' },
    bottom_dressy: { id: 'bottom_dressy', slot: 'bottom', name: 'Dress pants', price: 14, color: '#334155', style: 'slacks' },

    shoes_starter: { id: 'shoes_starter', slot: 'shoes', name: 'Sneakers', price: 0, color: '#f8fafc', sole: '#1e293b', style: 'sneakers', starter: true },
    shoes_boots: { id: 'shoes_boots', slot: 'shoes', name: 'Combat boots', price: 12, color: '#78350f', sole: '#292524', style: 'boots' },
    shoes_loafers: { id: 'shoes_loafers', slot: 'shoes', name: 'Loafers', price: 15, color: '#92400e', sole: '#44403c', style: 'loafers' },
    shoes_hightops: { id: 'shoes_hightops', slot: 'shoes', name: 'High-tops', price: 11, color: '#e11d48', sole: '#fff', style: 'hightops' },

    acc_none: { id: 'acc_none', slot: 'accessory', name: 'No glasses', price: 0, style: 'none', starter: true },
    acc_round: { id: 'acc_round', slot: 'accessory', name: 'Round glasses', price: 5, style: 'round' },
    acc_square: { id: 'acc_square', slot: 'accessory', name: 'Square frames', price: 7, style: 'square' },
    acc_shades: { id: 'acc_shades', slot: 'accessory', name: 'Star shades', price: 14, style: 'shades' },
    acc_cap: { id: 'acc_cap', slot: 'accessory', name: 'Bloom cap', price: 8, style: 'cap', color: '#4ade80' },
  };

  const STARTER_OWNED = Object.values(ITEMS).filter((i) => i.starter).map((i) => i.id);

  function shade(hex, amt) {
    return BlossomArt?.shade?.(hex, amt) || hex;
  }

  function skinGrad(ctx, cx, cy, rx, ry, skin) {
    const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.35, 2, cx, cy, Math.max(rx, ry));
    g.addColorStop(0, shade(skin, 0.14));
    g.addColorStop(0.55, skin);
    g.addColorStop(1, shade(skin, -0.1));
    return g;
  }

  function clothGrad(ctx, x, y, w, h, color) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, shade(color, 0.12));
    g.addColorStop(0.5, color);
    g.addColorStop(1, shade(color, -0.14));
    return g;
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function defaultAvatar() {
    return {
      skin: '#f5d0a8',
      hairColor: '#4a3728',
      hairStyle: 'short',
      eyeColor: '#1e293b',
      height: 'average',
      build: 'average',
      shirtColor: '#5eead4',
      shirtPattern: null,
      pantsColor: '#475569',
      shoesColor: '#f8fafc',
    };
  }

  function defaultWardrobe() {
    return {
      owned: [...STARTER_OWNED],
      equipped: {
        top: 'top_starter',
        bottom: 'bottom_starter',
        shoes: 'shoes_starter',
        accessory: 'acc_none',
      },
    };
  }

  function migrate(state) {
    if (!state.avatar) state.avatar = defaultAvatar();
    const av = state.avatar;
    if (av.hair && !av.hairColor) av.hairColor = av.hair;
    if (!av.height) av.height = 'average';
    if (!av.build) av.build = 'average';
    if (!av.pantsColor) av.pantsColor = '#475569';
    if (!av.shoesColor) av.shoesColor = '#f8fafc';
    if (!av.hairStyle) av.hairStyle = 'short';
    if (!state.wardrobe) state.wardrobe = defaultWardrobe();
    if (!state.wardrobe.owned?.length) state.wardrobe.owned = [...STARTER_OWNED];
    if (!state.wardrobe.equipped) state.wardrobe.equipped = defaultWardrobe().equipped;
    return state;
  }

  function getEquipped(state, slot) {
    const id = state.wardrobe?.equipped?.[slot];
    return ITEMS[id] || ITEMS[`${slot}_starter`] || null;
  }

  function owns(state, itemId) {
    return state.wardrobe?.owned?.includes(itemId);
  }

  function bodyScale(av) {
    const h = HEIGHT[av.height] || 1;
    const b = BUILD[av.build] || 1;
    return { h, b, total: h * b };
  }

  function drawHairBack(ctx, av, y, s) {
    const c = av.hairColor || '#4a3728';
    const style = av.hairStyle || 'short';
    ctx.fillStyle = shade(c, -0.08);
    if (style === 'long') {
      roundRect(ctx, -20 * s, y - 48 * s, 10 * s, 30 * s, 4);
      ctx.fill();
      ctx.fillRect(10 * s, y - 48 * s, 10 * s, 30 * s);
    } else if (style === 'ponytail') {
      roundRect(ctx, 12 * s, y - 58 * s, 9 * s, 24 * s, 4);
      ctx.fill();
    }
  }

  function drawHair(ctx, av, y, s) {
    const c = av.hairColor || '#4a3728';
    ctx.fillStyle = c;
    const style = av.hairStyle || 'short';
    if (style === 'short') {
      ctx.beginPath();
      ctx.arc(0, y - 50 * s, 17 * s, Math.PI, 0);
      ctx.fill();
      roundRect(ctx, -17 * s, y - 52 * s, 34 * s, 10 * s, 4);
      ctx.fill();
      ctx.fillStyle = shade(c, 0.1);
      roundRect(ctx, -12 * s, y - 50 * s, 24 * s, 6 * s, 3);
      ctx.fill();
    } else if (style === 'long') {
      ctx.beginPath();
      ctx.arc(0, y - 50 * s, 18 * s, Math.PI, 0);
      ctx.fill();
      roundRect(ctx, -20 * s, y - 48 * s, 10 * s, 28 * s, 4);
      ctx.fillRect(10 * s, y - 48 * s, 10 * s, 28 * s);
    } else if (style === 'spiky') {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 7 * s, y - 48 * s);
        ctx.lineTo(i * 7 * s + 4 * s, y - 68 * s);
        ctx.lineTo(i * 7 * s + 8 * s, y - 48 * s);
        ctx.closePath();
        ctx.fill();
      }
    } else if (style === 'curly') {
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(i * 8 * s, y - 54 * s, 9 * s, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (style === 'ponytail') {
      ctx.beginPath();
      ctx.arc(0, y - 50 * s, 16 * s, Math.PI, 0);
      ctx.fill();
      roundRect(ctx, 12 * s, y - 58 * s, 8 * s, 22 * s, 4);
      ctx.fill();
    }
  }

  function drawFace(ctx, av, y, s) {
    const skin = av.skin || '#f5d0a8';
    ctx.fillStyle = skinGrad(ctx, 0, y - 40 * s, 15 * s, 17 * s, skin);
    ctx.beginPath();
    ctx.ellipse(0, y - 40 * s, 15 * s, 17 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.12)';
    ctx.lineWidth = 1.2 * s;
    ctx.stroke();

    ctx.fillStyle = shade(skin, -0.06);
    ctx.beginPath();
    ctx.ellipse(-14 * s, y - 40 * s, 3 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(14 * s, y - 40 * s, 3 * s, 5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(251, 113, 133, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-9 * s, y - 36 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(9 * s, y - 36 * s, 3.5 * s, 2 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(-6 * s, y - 42 * s, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.ellipse(6 * s, y - 42 * s, 4.5 * s, 5.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = av.eyeColor || '#1e293b';
    ctx.beginPath();
    ctx.arc(-6 * s, y - 41 * s, 2.2 * s, 0, Math.PI * 2);
    ctx.arc(6 * s, y - 41 * s, 2.2 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-5 * s, y - 42 * s, 0.9 * s, 0, Math.PI * 2);
    ctx.arc(7 * s, y - 42 * s, 0.9 * s, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = shade(av.hairColor || '#4a3728', -0.2);
    ctx.lineWidth = 1.8 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8 * s, y - 48 * s);
    ctx.quadraticCurveTo(-6 * s, y - 50 * s, -4 * s, y - 48 * s);
    ctx.moveTo(4 * s, y - 48 * s);
    ctx.quadraticCurveTo(6 * s, y - 50 * s, 8 * s, y - 48 * s);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.lineWidth = 1.5 * s;
    ctx.beginPath();
    ctx.arc(0, y - 33 * s, 3.5 * s, 0.15, Math.PI - 0.15);
    ctx.stroke();

    const accItem = ITEMS[av._equippedAcc] || ITEMS.acc_none;
    drawAccessory(ctx, accItem, y, s);
  }

  function drawAccessory(ctx, item, y, s) {
    if (!item || item.style === 'none') return;
    if (item.style === 'round' || item.style === 'square') {
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2 * s;
      const w = item.style === 'square' ? 9 * s : 8 * s;
      ctx.beginPath();
      ctx.ellipse(-7 * s, y - 42 * s, w, 6 * s, 0, 0, Math.PI * 2);
      ctx.ellipse(7 * s, y - 42 * s, w, 6 * s, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-2 * s, y - 42 * s);
      ctx.lineTo(2 * s, y - 42 * s);
      ctx.stroke();
    } else if (item.style === 'shades') {
      ctx.fillStyle = '#0f172a';
      roundRect(ctx, -16 * s, y - 46 * s, 14 * s, 8 * s, 2);
      ctx.fill();
      roundRect(ctx, 2 * s, y - 46 * s, 14 * s, 8 * s, 2);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-2 * s, y - 44 * s, 4 * s, 2 * s);
    } else if (item.style === 'cap') {
      ctx.fillStyle = item.color || '#4ade80';
      roundRect(ctx, -18 * s, y - 58 * s, 36 * s, 10 * s, 3);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, y - 56 * s, 18 * s, 8 * s, 0, Math.PI, 0);
      ctx.fill();
      roundRect(ctx, 10 * s, y - 54 * s, 14 * s, 4 * s, 2);
      ctx.fill();
    }
  }

  function drawArms(ctx, av, y, s, leg, moving, anim) {
    const skin = av.skin || '#f5d0a8';
    const swing = moving ? Math.sin(anim * 12) * 8 : 0;
    [-1, 1].forEach((side) => {
      const ax = side * 20 * s;
      const ay = y - 18 * s + (side === 1 ? swing : -swing) * 0.4;
      ctx.fillStyle = skinGrad(ctx, ax, ay, 5 * s, 7 * s, skin);
      roundRect(ctx, ax - 5 * s, ay, 10 * s, 14 * s, 4);
      ctx.fill();
      ctx.fillStyle = shade(skin, -0.08);
      roundRect(ctx, ax - 4 * s, ay + 12 * s, 8 * s, 6 * s, 3);
      ctx.fill();
    });
  }

  function drawTop(ctx, av, top, y, s, shirtImg) {
    const color = top?.starter ? (av.shirtColor || top.color) : (top?.color || av.shirtColor || '#5eead4');
    const style = top?.style || 'tee';
    const tx = -19 * s;
    const ty = y - 32 * s;
    const tw = 38 * s;
    const th = 30 * s;
    if (av.shirtPattern && shirtImg?.complete && style === 'tee') {
      roundRect(ctx, tx, ty, tw, th, 7);
      ctx.save();
      ctx.clip();
      ctx.drawImage(shirtImg, tx, ty, tw, th);
      ctx.restore();
    } else if (style === 'hoodie') {
      ctx.fillStyle = clothGrad(ctx, tx, ty, tw, th + 4 * s, color);
      roundRect(ctx, -21 * s, y - 34 * s, 42 * s, 36 * s, 9);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      roundRect(ctx, -9 * s, y - 28 * s, 18 * s, 22 * s, 6);
      ctx.fill();
      ctx.strokeStyle = shade(color, -0.2);
      ctx.lineWidth = 1;
      ctx.stroke();
    } else if (style === 'blazer') {
      ctx.fillStyle = clothGrad(ctx, tx, ty, tw, th, color);
      roundRect(ctx, tx, ty, tw, th + 2 * s, 5);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-5 * s, y - 28 * s, 10 * s, 26 * s);
      ctx.fillStyle = shade(color, -0.25);
      ctx.fillRect(-19 * s, y - 4 * s, 38 * s, 4 * s);
    } else if (style === 'striped') {
      ctx.fillStyle = clothGrad(ctx, tx, ty, tw, th, color);
      roundRect(ctx, tx + 1 * s, ty, tw - 2 * s, th, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.38)';
      for (let i = -16; i < 20; i += 6) ctx.fillRect(i * s, ty, 3 * s, th);
    } else {
      ctx.fillStyle = clothGrad(ctx, tx, ty, tw, th, color);
      roundRect(ctx, tx + 1 * s, ty, tw - 2 * s, th, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(tx + 4 * s, ty + 4 * s, tw * 0.35, th * 0.4);
    }
    if (top?.sparkle) {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(-10 * s, y - 24 * s, 4 * s, 4 * s);
      ctx.fillRect(6 * s, y - 18 * s, 3 * s, 3 * s);
      ctx.fillRect(-4 * s, y - 14 * s, 2 * s, 2 * s);
    }
    const skin = av.skin || '#f5d0a8';
    ctx.fillStyle = skinGrad(ctx, -12 * s, y - 18 * s, 5 * s, 5 * s, skin);
    roundRect(ctx, -17 * s, y - 22 * s, 10 * s, 9 * s, 4);
    ctx.fill();
    ctx.fillStyle = skinGrad(ctx, 12 * s, y - 18 * s, 5 * s, 5 * s, skin);
    roundRect(ctx, 7 * s, y - 22 * s, 10 * s, 9 * s, 4);
    ctx.fill();
  }

  function drawBottom(ctx, av, bottom, y, s, leg) {
    const color = bottom?.starter ? (av.pantsColor || bottom.color) : (bottom?.color || av.pantsColor || '#475569');
    const style = bottom?.style || 'jeans';
    if (style === 'skirt') {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-14 * s, y - 2 * s);
      ctx.lineTo(14 * s, y - 2 * s);
      ctx.lineTo(18 * s, y + 14 * s);
      ctx.lineTo(-18 * s, y + 14 * s);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = av.skin || '#f5d0a8';
      ctx.fillRect(-7 * s + leg, y + 14 * s, 6 * s, 14 * s);
      ctx.fillRect(1 * s - leg, y + 14 * s, 6 * s, 14 * s);
    } else if (style === 'shorts') {
      ctx.fillStyle = color;
      roundRect(ctx, -14 * s, y - 2 * s, 28 * s, 14 * s, 4);
      ctx.fill();
      ctx.fillStyle = av.skin || '#f5d0a8';
      ctx.fillRect(-9 * s + leg, y + 12 * s, 7 * s, 16 * s);
      ctx.fillRect(2 * s - leg, y + 12 * s, 7 * s, 16 * s);
    } else {
      ctx.fillStyle = clothGrad(ctx, -15 * s, y - 2 * s, 30 * s, 18 * s, color);
      roundRect(ctx, -15 * s, y - 2 * s, 30 * s, 18 * s, 5);
      ctx.fill();
      if (style === 'cargo') {
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        roundRect(ctx, -12 * s, y + 4 * s, 8 * s, 6 * s, 2);
        ctx.fill();
        roundRect(ctx, 4 * s, y + 4 * s, 8 * s, 6 * s, 2);
        ctx.fill();
      }
      if (style === 'jeans') {
        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(0, y + 14 * s);
        ctx.stroke();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        roundRect(ctx, -11 * s, y + 2 * s, 7 * s, 5 * s, 2);
        ctx.fill();
        roundRect(ctx, 4 * s, y + 2 * s, 7 * s, 5 * s, 2);
        ctx.fill();
      }
      const skin = av.skin || '#f5d0a8';
      ctx.fillStyle = skinGrad(ctx, -6 * s + leg, y + 24 * s, 4 * s, 10 * s, skin);
      roundRect(ctx, -10 * s + leg, y + 16 * s, 8 * s, 17 * s, 3);
      ctx.fill();
      ctx.fillStyle = skinGrad(ctx, 6 * s - leg, y + 24 * s, 4 * s, 10 * s, skin);
      roundRect(ctx, 2 * s - leg, y + 16 * s, 8 * s, 17 * s, 3);
      ctx.fill();
    }
  }

  function drawShoes(ctx, shoes, y, s, leg, skin, av) {
    const color = shoes?.starter ? (av?.shoesColor || shoes.color) : (shoes?.color || '#f8fafc');
    const sole = shoes?.sole || '#1e293b';
    const style = shoes?.style || 'sneakers';
    const ly = y + 30 * s;
    if (style === 'boots') {
      ctx.fillStyle = color;
      roundRect(ctx, -11 * s + leg, y + 14 * s, 10 * s, 20 * s, 3);
      ctx.fill();
      roundRect(ctx, 1 * s - leg, y + 14 * s, 10 * s, 20 * s, 3);
      ctx.fill();
    } else if (style === 'loafers') {
      ctx.fillStyle = color;
      roundRect(ctx, -11 * s + leg, ly - 2 * s, 11 * s, 6 * s, 3);
      ctx.fill();
      roundRect(ctx, 0 * s - leg, ly - 2 * s, 11 * s, 6 * s, 3);
      ctx.fill();
    } else if (style === 'hightops') {
      ctx.fillStyle = color;
      roundRect(ctx, -11 * s + leg, y + 18 * s, 10 * s, 16 * s, 4);
      ctx.fill();
      roundRect(ctx, 1 * s - leg, y + 18 * s, 10 * s, 16 * s, 4);
      ctx.fill();
      ctx.fillStyle = sole;
      roundRect(ctx, -12 * s + leg, ly, 12 * s, 5 * s, 2);
      ctx.fill();
      roundRect(ctx, 0 * s - leg, ly, 12 * s, 5 * s, 2);
      ctx.fill();
      return;
    } else {
      ctx.fillStyle = clothGrad(ctx, -11 * s + leg, ly - 4 * s, 11 * s, 7 * s, color);
      roundRect(ctx, -11 * s + leg, ly - 4 * s, 11 * s, 7 * s, 4);
      ctx.fill();
      ctx.fillStyle = clothGrad(ctx, 0 * s - leg, ly - 4 * s, 11 * s, 7 * s, color);
      roundRect(ctx, 0 * s - leg, ly - 4 * s, 11 * s, 7 * s, 4);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-8 * s + leg, ly - 2 * s, 5 * s, 2 * s);
      ctx.fillRect(3 * s - leg, ly - 2 * s, 5 * s, 2 * s);
    }
    ctx.fillStyle = sole;
    roundRect(ctx, -12 * s + leg, ly + 2 * s, 12 * s, 4 * s, 2);
    ctx.fill();
    roundRect(ctx, 0 * s - leg, ly + 2 * s, 12 * s, 4 * s, 2);
    ctx.fill();
  }

  function drawCharacter(ctx, opts) {
    const {
      avatar, wardrobe, x, y, facing = 1, anim = 0, moving = false,
      shirtImg, glow = false, chubby = false,
    } = opts;
    const av = { ...avatar };
    if (wardrobe?.equipped) {
      av._equippedAcc = wardrobe.equipped.accessory;
    }
    const sc = bodyScale(av);
    let s = sc.total * (chubby ? 1.08 : 1);
    const bob = Math.sin(anim * (moving ? 10 : 3)) * (moving ? 3 : 0.8);
    const leg = moving ? Math.sin(anim * 12) * 5 : 0;
    const py = y + bob;

    if (glow) {
      const g = ctx.createRadialGradient(x, py - 20, 4, x, py - 20, 48);
      g.addColorStop(0, 'rgba(74, 222, 128, 0.42)');
      g.addColorStop(0.5, 'rgba(250, 204, 21, 0.15)');
      g.addColorStop(1, 'rgba(74, 222, 128, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, py - 20, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    const sh = ctx.createRadialGradient(x, py + 2, 2, x, py + 2, 20 * s);
    sh.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    sh.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(x, py + 4, 18 * s, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(x, py);
    ctx.scale(facing * s, s);

    const top = getEquipped({ wardrobe }, 'top') || ITEMS.top_starter;
    const bottom = getEquipped({ wardrobe }, 'bottom') || ITEMS.bottom_starter;
    const shoes = getEquipped({ wardrobe }, 'shoes') || ITEMS.shoes_starter;

    drawHairBack(ctx, av, 0, 1);
    drawArms(ctx, av, 0, 1, leg, moving, anim);
    drawBottom(ctx, av, bottom, 0, 1, leg);
    drawShoes(ctx, shoes, 0, 1, leg, av.skin, av);
    drawTop(ctx, av, top, 0, 1, shirtImg);
    const skin = av.skin || '#f5d0a8';
    ctx.fillStyle = skinGrad(ctx, 0, 2, 7, 6, skin);
    roundRect(ctx, -7, -2, 14, 11, 4);
    ctx.fill();
    drawFace(ctx, av, 0, 1);
    drawHair(ctx, av, 0, 1);

    ctx.restore();
    return { x, py: py - 62 * s };
  }

  function drawPreview(canvas, avatar, wardrobe) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#bae6fd');
    g.addColorStop(0.55, '#e0f2fe');
    g.addColorStop(1, '#fce7f3');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    BlossomArt?.drawCloud?.(ctx, canvas.width * 0.25, canvas.height * 0.12, 0.7, 0.5);
    BlossomArt?.drawCloud?.(ctx, canvas.width * 0.7, canvas.height * 0.08, 0.55, 0.4);
    const fg = ctx.createLinearGradient(0, canvas.height * 0.65, 0, canvas.height);
    fg.addColorStop(0, 'rgba(74, 222, 128, 0.15)');
    fg.addColorStop(1, 'rgba(34, 197, 94, 0.35)');
    ctx.fillStyle = fg;
    ctx.fillRect(0, canvas.height * 0.72, canvas.width, canvas.height * 0.28);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, canvas.height * 0.72, canvas.width, 4);
    drawCharacter(ctx, {
      avatar,
      wardrobe: wardrobe || { equipped: defaultWardrobe().equipped, owned: STARTER_OWNED },
      x: canvas.width / 2,
      y: canvas.height * 0.78,
      facing: 1,
      anim: Date.now() / 800,
      moving: false,
    });
  }

  function buyItem(state, itemId) {
    const item = ITEMS[itemId];
    if (!item) return { ok: false, msg: 'Unknown item' };
    if (owns(state, itemId)) return { ok: false, msg: 'You already own that!' };
    if (state.money < item.price) return { ok: false, msg: `Need $${item.price} (you have $${state.money})` };
    state.money -= item.price;
    state.wardrobe.owned.push(itemId);
    return { ok: true, msg: `Bought ${item.name} for $${item.price}!` };
  }

  function equipItem(state, itemId) {
    const item = ITEMS[itemId];
    if (!item) return { ok: false, msg: 'Unknown item' };
    if (!owns(state, itemId)) return { ok: false, msg: 'Buy it first at Bloom Boutique!' };
    state.wardrobe.equipped[item.slot] = itemId;
    return { ok: true, msg: `Equipped ${item.name}!` };
  }

  function itemsBySlot(slot) {
    return Object.values(ITEMS).filter((i) => i.slot === slot && i.id !== 'acc_none');
  }

  function catalogForShop() {
    return ['top', 'bottom', 'shoes', 'accessory'].map((slot) => ({
      slot,
      label: { top: 'Tops', bottom: 'Bottoms', shoes: 'Shoes', accessory: 'Accessories' }[slot],
      items: Object.values(ITEMS).filter((i) => i.slot === slot),
    }));
  }

  function parseCreateForm(fd) {
    return {
      skin: fd.get('skin')?.toString() || '#f5d0a8',
      hairColor: fd.get('hairColor')?.toString() || '#4a3728',
      hairStyle: fd.get('hairStyle')?.toString() || 'short',
      eyeColor: fd.get('eyeColor')?.toString() || '#1e293b',
      height: fd.get('height')?.toString() || 'average',
      build: fd.get('build')?.toString() || 'average',
      shirtColor: fd.get('shirtColor')?.toString() || '#5eead4',
      pantsColor: fd.get('pantsColor')?.toString() || '#475569',
      shoesColor: fd.get('shoesColor')?.toString() || '#f8fafc',
      shirtPattern: null,
    };
  }

  return {
    ITEMS,
    HAIR_STYLES,
    HEIGHT,
    BUILD,
    defaultAvatar,
    defaultWardrobe,
    migrate,
    drawCharacter,
    drawPreview,
    buyItem,
    equipItem,
    owns,
    getEquipped,
    catalogForShop,
    parseCreateForm,
    roundRect,
  };
})();