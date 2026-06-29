/** Bloom Boutique shop UI */
window.BlossomBoutique = (function () {
  let state = null;
  let onPersist = null;
  let onMessage = null;
  let activeTab = 'top';

  function $(id) { return document.getElementById(id); }

  function open(gameState, callbacks) {
    state = gameState;
    onPersist = callbacks.onPersist;
    onMessage = callbacks.onMessage;
    const modal = $('boutiqueModal');
    if (modal) modal.hidden = false;
    render();
    window.BlossomAudio?.playSfx('ui');
  }

  function close() {
    const modal = $('boutiqueModal');
    if (modal) modal.hidden = true;
  }

  function render() {
    const grid = $('boutiqueGrid');
    const money = $('boutiqueMoney');
    if (money) money.textContent = `$${state.money}`;
    if (!grid) return;

    document.querySelectorAll('[data-boutique-tab]').forEach((btn) => {
      btn.classList.toggle('boutique-tab--active', btn.dataset.boutiqueTab === activeTab);
    });

    const items = BlossomAvatar.catalogForShop().find((c) => c.slot === activeTab)?.items || [];
    grid.innerHTML = items.map((item) => {
      const owned = BlossomAvatar.owns(state, item.id);
      const equipped = state.wardrobe?.equipped?.[item.slot] === item.id;
      const canBuy = !owned && item.price <= state.money;
      return `
        <div class="boutique-item ${equipped ? 'boutique-item--equipped' : ''} ${owned ? 'boutique-item--owned' : ''}">
          <div class="boutique-swatch" style="background:${item.color || '#94a3b8'}"></div>
          <strong>${item.name}</strong>
          <span class="boutique-price">${item.price === 0 ? 'Free' : '$' + item.price}</span>
          ${equipped ? '<span class="boutique-badge">Wearing</span>' : ''}
          ${owned
            ? `<button type="button" class="boutique-btn boutique-btn--equip" data-equip="${item.id}">${equipped ? '✓ On' : 'Wear'}</button>`
            : `<button type="button" class="boutique-btn boutique-btn--buy ${canBuy ? '' : 'boutique-btn--disabled'}" data-buy="${item.id}" ${canBuy ? '' : 'disabled'}>Buy</button>`
          }
        </div>`;
    }).join('');

    grid.querySelectorAll('[data-buy]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = BlossomAvatar.buyItem(state, btn.dataset.buy);
        onMessage?.(res.msg, res.ok ? 'good' : 'warn');
        if (res.ok) {
          window.BlossomAudio?.playSfx('star');
          BlossomAvatar.equipItem(state, btn.dataset.buy);
          onPersist?.(state);
        } else window.BlossomAudio?.playSfx('warn');
        render();
        window.BlossomGame?.updateHud?.();
      });
    });
    grid.querySelectorAll('[data-equip]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const res = BlossomAvatar.equipItem(state, btn.dataset.equip);
        onMessage?.(res.msg, res.ok ? 'good' : 'warn');
        if (res.ok) {
          window.BlossomAudio?.playSfx('chore');
          onPersist?.(state);
        }
        render();
      });
    });

    const preview = $('boutiquePreview');
    if (preview) BlossomAvatar.drawPreview(preview, state.avatar, state.wardrobe);
  }

  function init() {
    document.querySelectorAll('[data-boutique-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.boutiqueTab;
        render();
      });
    });
    $('boutiqueClose')?.addEventListener('click', close);
    $('boutiqueModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'boutiqueModal') close();
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { open, close };
})();